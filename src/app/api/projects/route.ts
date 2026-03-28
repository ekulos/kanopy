import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().regex(/^[A-Z][A-Z0-9]{0,9}$/, "Il codice deve iniziare con una lettera maiuscola e contenere solo lettere maiuscole e numeri (es. SKARA)").min(1).max(10),
  description: z.string().optional(),
  color: z.string().optional().default("#378add"),
  teamId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const projects = await prisma.project.findMany({
    where: {
      ownerId: session.user.id,
      ...(status ? { status } : {}),
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      team: { select: { id: true, name: true, color: true } },
      _count: { select: { tasks: { where: { parentId: null } } } },
      tasks: {
        where: { parentId: null },
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: projects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      ownerId: session.user.id,
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
