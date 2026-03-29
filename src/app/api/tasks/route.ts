import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  dueDate: z.string().nullable().optional(),
  projectId: z.string(),
  parentId: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status") as string | null;
  const assigneeId = searchParams.get("assigneeId");
  const parentId = searchParams.get("parentId");
  const onlyRoot = searchParams.get("onlyRoot") === "true";

  const tasks = await prisma.task.findMany({
    where: {
      project: { ownerId: session.user.id },
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(assigneeId ? { assignees: { some: { userId: assigneeId } } } : {}),
      ...(parentId !== null ? { parentId } : {}),
      ...(onlyRoot ? { parentId: null } : {}),
    },
    include: {
      assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
      subtasks: { select: { id: true, status: true, title: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ data: tasks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { assigneeIds, ...taskData } = parsed.data;

  // Calculate next position in the column
  const lastTask = await prisma.task.findFirst({
    where: { projectId: taskData.projectId, status: taskData.status, parentId: taskData.parentId ?? null },
    orderBy: { position: "desc" },
  });
  const position = (lastTask?.position ?? -1) + 1;

  // Calculate the next ticketNumber for the project
  const lastTicket = await prisma.task.findFirst({
    where: { projectId: taskData.projectId },
    orderBy: { ticketNumber: "desc" },
  });
  const ticketNumber = (lastTicket?.ticketNumber ?? 0) + 1;

  const task = await prisma.task.create({
    data: {
      ...taskData,
      position,
      ticketNumber,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      assignees: {
        create: assigneeIds.map((userId) => ({ userId })),
      },
    },
    include: {
      assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
      subtasks: { select: { id: true, status: true } },
    },
  });

  // Log attività
  await prisma.activity.create({
    data: {
      type: "task_created",
      taskId: task.id,
      projectId: task.projectId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();
  const ids: string[] = z.array(z.string()).parse(body.ids);
  if (ids.length === 0) return NextResponse.json({ error: "No IDs provided" }, { status: 400 });

  // Verify ownership: all tasks must belong to the user
  const count = await prisma.task.count({
    where: { id: { in: ids }, project: { ownerId: session.user.id } },
  });
  if (count !== ids.length) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Elimina in cascata (i sotto-task vengono eliminati automaticamente per la relazione cascade)
  await prisma.task.deleteMany({ where: { id: { in: ids } } });

  return NextResponse.json({ data: { deleted: ids.length } });
}
