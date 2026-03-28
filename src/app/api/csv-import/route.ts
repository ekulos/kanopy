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
      titolo: z.string(),
      descrizione: z.string().optional(),
      stato: z.string().optional(),
      priorità: z.string().optional(),
      scadenza: z.string().optional(),
      assegnatari: z.string().optional(),
      task_padre: z.string().optional(),
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

  // Verifica che il progetto appartenga all'utente
  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId: session.user.id },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const result: CsvImportResult = { imported: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as CsvTaskRow;
    const rowNum = i + 1;

    // Validazione
    if (!row.titolo?.trim()) {
      result.errors.push({ row: rowNum, message: "Title is required" });
      result.skipped++;
      continue;
    }

    // Parse data
    let dueDate: Date | null = null;
    if (row.scadenza?.trim()) {
      const d = new Date(row.scadenza.trim());
      if (isNaN(d.getTime())) {
        result.errors.push({ row: rowNum, message: `Invalid date: ${row.scadenza}` });
        result.skipped++;
        continue;
      }
      dueDate = d;
    }

    // Risolvi assegnatari per email
    const assigneeEmails = (row.assegnatari ?? "")
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

    // Risolvi task padre per sotto-task
    let parentId: string | null = null;
    if (row.task_padre?.trim()) {
      const parentTask = await prisma.task.findFirst({
        where: { projectId, title: row.task_padre.trim(), parentId: null },
        select: { id: true },
      });
      if (!parentTask) {
        result.errors.push({ row: rowNum, message: `Parent task not found: "${row.task_padre.trim()}"` });
        result.skipped++;
        continue;
      }
      parentId = parentTask.id;
    }

    // Calcola posizione
    const lastTask = await prisma.task.findFirst({
      where: { projectId, status: normalizeCsvStatus(row.stato), parentId },
      orderBy: { position: "desc" },
    });

    try {
      await prisma.task.create({
        data: {
          title: row.titolo.trim(),
          description: row.descrizione?.trim() || null,
          status: normalizeCsvStatus(row.stato),
          priority: normalizeCsvPriority(row.priorità),
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
