import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  color: z.string().optional(),
});

async function getTeamAsOwnerOrAdmin(teamId: string, userId: string) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      members: { some: { userId, role: { in: ["owner", "admin"] } } },
    },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const team = await prisma.team.findFirst({
    where: { id, members: { some: { userId: session.user.id } } },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      projects: { select: { id: true, name: true, color: true, status: true } },
    },
  });

  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
  return NextResponse.json({ data: team });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getTeamAsOwnerOrAdmin(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const team = await prisma.team.update({
    where: { id },
    data: parsed.data,
    include: {
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  return NextResponse.json({ data: team });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getTeamAsOwnerOrAdmin(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  await prisma.team.delete({ where: { id } });
  return NextResponse.json({ data: { success: true } });
}
