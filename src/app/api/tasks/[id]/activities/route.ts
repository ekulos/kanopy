import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, project: { ownerId: session.user.id } } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const activities = await prisma.activity.findMany({
    where: { taskId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: activities });
}
