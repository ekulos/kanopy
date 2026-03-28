import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().regex(/^[A-Z][A-Z0-9]{0,9}$/, "Code must start with an uppercase letter and contain only uppercase letters and numbers").min(1).max(10).optional(),
  description: z.string().nullable().optional(),
  color: z.string().optional(),
  status: z.enum(["active", "on_hold", "completed", "archived"]).optional(),
  teamId: z.string().nullable().optional(),
});

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { OR: [{ code: id }, { id }], ownerId: userId },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { OR: [{ code: id }, { id }], ownerId: session.user.id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      team: {
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
        },
      },
      tasks: {
        where: { parentId: null },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
          subtasks: { select: { id: true, status: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ status: "asc" }, { position: "asc" }],
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json({ data: project });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { id } = await params;
  const existing = await getProject(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });

  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: parsed.data,
  });

  return NextResponse.json({ data: project });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

  const { id } = await params;
  const existing = await getProject(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });

  await prisma.project.delete({ where: { id: existing.id } });
  return NextResponse.json({ data: { success: true } });
}
