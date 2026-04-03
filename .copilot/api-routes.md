# Copilot — API Routes

This file guides Copilot when creating or modifying Next.js API routes for the Kyoma project.

---

## Standard route pattern

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 1. Define the Zod schema BEFORE the handler
const schema = z.object({ ... });

export async function GET(req: NextRequest) {
  // 2. Always authenticate first
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Read query params if needed
  const { searchParams } = new URL(req.url);

  // 4. Prisma query with minimal fields (avoid SELECT *)
  const result = await prisma.model.findMany({ where: { ownerId: session.user.id }, ... });

  // 5. Always return { data: ... }
  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const item = await prisma.model.create({ data: { ...parsed.data, userId: session.user.id } });
  return NextResponse.json({ data: item }, { status: 201 });
}
```

---

## Security rules

- **Always** verify that a resource belongs to the current user before PATCH/DELETE
- Use `findFirst({ where: { id, ownerId: session.user.id } })` as a guard, never `findUnique` alone
- Do not expose raw Prisma errors to the client — log them internally and return a generic message

---

## Handling many-to-many relations (e.g. assigneeIds)

```typescript
// Correct pattern to update assignees
if (assigneeIds !== undefined) {
  await prisma.taskAssignee.deleteMany({ where: { taskId } });
  if (assigneeIds.length > 0) {
    await prisma.taskAssignee.createMany({
      data: assigneeIds.map((userId) => ({ taskId, userId })),
    });
  }
}
```

---

## Activity logging

After significant operations (status change, creation, etc.) create an `Activity` record:

```typescript
await prisma.activity.create({
  data: {
    type: "status_changed",               // snake_case
    payload: JSON.stringify({ from, to }), // JSON string
    taskId,
    projectId,
    userId: session.user.id,
  },
});
```

Existing activity types: `task_created`, `status_changed`, `assignee_added`, `comment_added`

---

## Kanban position calculation

When creating a task in a column compute the position:

```typescript
const last = await prisma.task.findFirst({
  where: { projectId, status, parentId: null },
  orderBy: { position: "desc" },
});
const position = (last?.position ?? -1) + 1;
```

---

## Project code validation

```typescript
const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  // Regex: starts with an uppercase letter, then optional letters/digits (max 10 chars)
  code: z.string().regex(/^[A-Z][A-Z0-9]{0,9}$/, "Ex. WEB, SKARA (uppercase, max 10)").min(1).max(10),
  description: z.string().optional(),
  color: z.string().optional(),
});
```

## Lookup project by code or id

```typescript
// Use OR lookup so old id-based links still work
const project = await prisma.project.findFirst({
  where: { OR: [{ code: id }, { id }], ownerId: session.user.id },
});
if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

## Bulk DELETE tasks

```typescript
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json(); // string[]
  // Verify ownership: tasks must belong to projects owned by the user
  const tasks = await prisma.task.findMany({
    where: { id: { in: ids }, project: { ownerId: session.user.id } },
    select: { id: true },
  });
  const safeIds = tasks.map((t) => t.id);

  await prisma.task.deleteMany({ where: { id: { in: safeIds } } });
  return NextResponse.json({ data: { deleted: safeIds.length } });
}
```

---

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/projects | List user's projects |
| POST | /api/projects | Create project (requires unique `code`, e.g. `WEB`) |
| GET | /api/projects/[id] | Project detail with tasks (`[id]` = code or id) |
| PATCH | /api/projects/[id] | Update project (`[id]` = code or id) |
| DELETE | /api/projects/[id] | Delete project and related tasks (cascade) |
| GET | /api/tasks | List tasks (filter by projectId, status, assigneeId, parentId, onlyRoot) |
| POST | /api/tasks | Create task (auto-increments `ticketNumber` per project) |
| DELETE | /api/tasks | **Bulk delete** — body: `{ ids: string[] }` — verifies ownership for each id |
| GET | /api/tasks/[id] | Task detail with subtasks, comments, assignees |
| PATCH | /api/tasks/[id] | Update task (including status change for kanban) |
| DELETE | /api/tasks/[id] | Delete single task |
| POST | /api/tasks/comments | Create comment |
| POST | /api/csv-import | Import tasks from CSV for a project |
| GET | /api/users | List users (filterable with ?q=) |
| GET | /api/teams | List teams the user belongs to |
| POST | /api/teams | Create team (user becomes owner) |
| GET | /api/teams/[id] | Team detail with members and projects |
| PATCH | /api/teams/[id] | Update name/description/color (owner or admin) |
| DELETE | /api/teams/[id] | Delete team (owner or admin) |
| POST | /api/teams/[id]/members | Add member by email |
| DELETE | /api/teams/[id]/members | Remove member (userId in body) |
