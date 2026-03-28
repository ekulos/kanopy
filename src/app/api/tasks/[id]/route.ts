import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.string().nullable().optional(),
  position: z.number().optional(),
  parentId: z.string().nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({
    where: { id, project: { ownerId: session.user.id } },
    include: {
      project: { select: { id: true, name: true, color: true } },
      parent: { select: { id: true, title: true } },
      subtasks: {
        include: {
          assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { position: "asc" },
      },
      assignees: { include: { user: { select: { id: true, name: true, image: true, email: true } } } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      labels: { include: { label: true } },
    },
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ data: task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findFirst({
    where: { id, project: { ownerId: session.user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { assigneeIds, dueDate, ...rest } = parsed.data;

  // Aggiorna assegnatari se forniti
  if (assigneeIds !== undefined) {
    await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
    if (assigneeIds.length > 0) {
      await prisma.taskAssignee.createMany({
        data: assigneeIds.map((userId) => ({ taskId: id, userId })),
      });
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...rest,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
    include: {
      assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
      subtasks: { select: { id: true, status: true } },
    },
  });

  // Log cambio status
  if (rest.status && rest.status !== existing.status) {
    await prisma.activity.create({
      data: {
        type: "status_changed",
        payload: JSON.stringify({ from: existing.status, to: rest.status }),
        taskId: id,
        projectId: existing.projectId,
        userId: session.user.id,
      },
    });
  }

  return NextResponse.json({ data: task });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.task.findFirst({
    where: { id, project: { ownerId: session.user.id } },
  });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ data: { success: true } });
}
