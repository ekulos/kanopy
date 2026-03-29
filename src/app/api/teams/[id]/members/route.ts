import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member"]).optional().default("member"),
});

const removeMemberSchema = z.object({
  userId: z.string(),
});

async function getTeamAsOwnerOrAdmin(teamId: string, userId: string) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      members: { some: { userId, role: { in: ["owner", "admin"] } } },
    },
  });
}

// POST /api/teams/[id]/members — add a member by email
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getTeamAsOwnerOrAdmin(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const body = await req.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const userToAdd = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, name: true, email: true, image: true },
  });
  if (!userToAdd) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const member = await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: id, userId: userToAdd.id } },
    update: { role: parsed.data.role },
    create: { teamId: id, userId: userToAdd.id, role: parsed.data.role },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json({ data: member }, { status: 201 });
}

// DELETE /api/teams/[id]/members — remove a member (userId in body)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const existing = await getTeamAsOwnerOrAdmin(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const body = await req.json();
  const parsed = removeMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Do not allow removing the owner
  const memberToRemove = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: id, userId: parsed.data.userId } },
  });
  if (memberToRemove?.role === "owner") {
    return NextResponse.json({ error: "You can't remove the team owner" }, { status: 403 });
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: id, userId: parsed.data.userId } },
  });

  return NextResponse.json({ data: { success: true } });
}
