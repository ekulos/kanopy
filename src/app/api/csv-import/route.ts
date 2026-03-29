import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizeCsvStatus, normalizeCsvPriority } from "@/lib/utils";
import type { CsvTaskRow, CsvImportResult } from "@/types";

const importSchema = z.object({
  projectId: z.string(),
  rows: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      status: z.string().optional(),
      priority: z.string().optional(),
      due_date: z.string().optional(),
      assignees: z.string().optional(),
      main_task: z.string().optional(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { projectId, rows } = parsed.data;

  // Verify that the project belongs to the user
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result: CsvImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as CsvTaskRow;
    const rowNum = i + 1;

    // Validation
    if (!row.title?.trim()) {
      result.errors.push({ row: rowNum, message: "Title is required" });
      result.skipped++;
      continue;
    }

    // Parse data
    let dueDate: Date | null = null;
    if (row.due_date?.trim()) {
      const d = new Date(row.due_date.trim());
      if (isNaN(d.getTime())) {
        result.errors.push({ row: rowNum, message: `Invalid date: ${row.due_date}` });
        result.skipped++;
        continue;
      }
      dueDate = d;
    }

    // Resolve assignees by email
    const assigneeEmails = (row.assignees ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    let assigneeIds: string[] = [];
    if (assigneeEmails.length > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: assigneeEmails } },
        select: { id: true },
      });
      assigneeIds = users.map((u) => u.id);
    }

    // Resolve parent task for subtasks
    let parentId: string | null = null;
    if (row.main_task?.trim()) {
      const parentTask = await prisma.task.findFirst({
        where: { projectId, title: row.main_task.trim(), parentId: null },
        select: { id: true },
      });
      if (!parentTask) {
        result.errors.push({ row: rowNum, message: `Parent task not found: "${row.main_task.trim()}"` });
        result.skipped++;
        continue;
      }
      parentId = parentTask.id;
    }

    // Calculate position
    const lastTask = await prisma.task.findFirst({
      where: { projectId, status: normalizeCsvStatus(row.status), parentId },
      orderBy: { position: "desc" },
    });

    try {
      await prisma.task.create({
        data: {
          title: row.title.trim(),
          description: row.description?.trim() || null,
          status: normalizeCsvStatus(row.status),
          priority: normalizeCsvPriority(row.priority),
          dueDate,
          projectId,
          parentId,
          position: (lastTask?.position ?? -1) + 1,
          assignees: {
            create: assigneeIds.map((userId) => ({ userId })),
          },
        },
      });
      result.imported++;
    } catch (err) {
      result.errors.push({ row: rowNum, message: "Error saving" });
      result.skipped++;
    }
  }

  return NextResponse.json({ data: result });
}
