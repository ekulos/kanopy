# Copilot — Roadmap & Future Extensions

This file guides Copilot when implementing planned features for Kanopy. Each section describes what to add and where to change code.

---

## ✅ Already implemented

- **/my-tasks page** — `src/app/(app)/my-tasks/page.tsx` — tasks assigned to the current user, ordered by due date
- **/deadlines page** — `src/app/(app)/deadlines/page.tsx` — tasks with due dates grouped by timeframe
- **API /api/users** — `src/app/api/users/route.ts` — GET user list with text search (?q=)
- **API /api/teams** — `src/app/api/teams/route.ts` — GET teams list, POST create team
- **API /api/teams/[id]** — GET, PATCH, DELETE team (owner/admin only)
- **API /api/teams/[id]/members** — POST add member by email, DELETE remove member
- **Project code (`Project.code`)** — short unique identifier (e.g. `WEB`) used in URLs `/projects/WEB`; ticket IDs use `WEB-1`
- **`ticketNumber` on Task** — project-scoped auto-increment on creation
- **Markdown editor** — `@uiw/react-md-editor`; `MarkdownEditor`/`MarkdownPreview` in `src/components/ui/MarkdownEditor.tsx`; used in `TaskDetailMain` and `SubtaskList`
- **Expandable subtasks** — chevron + title click expands full details
- **Bulk delete tasks in list view** — `TaskList.tsx` with multi-select toolbar and confirmation; `DELETE /api/tasks` with `{ ids[] }`
- **Delete project from list** — `ProjectsTable.tsx` with trash icon, lazy task/subtask counts, confirmation modal
- **Immediate list update after project creation** — `ProjectsView` keeps local state; `ProjectsTopbar` calls `onProjectCreated`

---

## In-app notifications

### Goal
Notify users when they are assigned to a task or when someone comments.

### Suggested implementation
1. **Schema**: add `Notification` model to `schema.prisma`:
   ```prisma
   model Notification {
     id        String   @id @default(cuid())
     userId    String
     type      String   // assigned | commented | status_changed
     taskId    String?
     read      Boolean  @default(false)
     createdAt DateTime @default(now())
     user      User     @relation(...)
     task      Task?    @relation(...)
   }
   ```
2. **API**: create `src/app/api/notifications/route.ts` (GET list, PATCH mark-as-read)
3. **Trigger**: create notifications in POST `/api/tasks` (assignments) and POST `/api/tasks/comments`
4. **UI**: add a badge counter in the `Sidebar` and a notifications dropdown
5. **Real-time** (optional): use Server-Sent Events or polling every 30s

---

## Webhooks

### Goal
Send an HTTP POST to a configured URL when a task's status changes.

### Suggested implementation
1. **Schema**: add a `Webhook` model with `projectId`, `url`, `events[]`, `secret`
2. **API**: `src/app/api/projects/[id]/webhooks/route.ts`
3. **Trigger**: in PATCH `/api/tasks/[id]`, if status changes, `fetch(webhook.url, { ... })`
4. **Security**: sign payload with HMAC-SHA256 using the `secret`

---

## Advanced task filters

### Goal
Filter the Kanban/list by assignee, priority, label, and due date.

### Suggested implementation
1. Add filter state in `KanbanBoard.tsx` (useState)
2. Pass filters as query params to `/api/tasks`
3. Apply Prisma filters in `GET /api/tasks`:
   ```typescript
   where: {
     ...(priority ? { priority } : {}),
     ...(assigneeId ? { assignees: { some: { userId: assigneeId } } } : {}),
     ...(labelId ? { labels: { some: { labelId } } } : {}),
     ...(overdue ? { dueDate: { lt: new Date() } } : {}),
   }
   ```
4. UI: filter bar with selectable chips in `ProjectDetailTopbar`

---

## Labels

### Goal
Add colored labels to tasks (e.g. "bug", "feature", "urgent").

### Existing schema
```prisma
model Label { id, name, color }
model TaskLabel { taskId, labelId }
```

### To implement
1. **API**: `src/app/api/labels/route.ts` — CRUD labels per project
2. **UI panel**: add a labels section in `TaskDetailPanel.tsx`
3. **Kanban card**: show label badges in `TaskCard.tsx`

---

## Drag & drop with reorder inside column

### Goal
Allow reordering tasks within the same column.

### Suggested implementation
1. Use `SortableContext` already present in `KanbanColumn.tsx`
2. In `onDragEnd` handler of `KanbanBoard.tsx`:
   - If `active.column === over.column`: reorder and update `position`
   - If `active.column !== over.column`: change `status` (already implemented)
3. Update `position` via `PATCH /api/tasks/:id` with `{ position: newIndex }`
4. For batch updates use `prisma.$transaction([...])` to atomically update multiple positions

---

## Export CSV

### Goal
Export a project's tasks to CSV.

### Suggested implementation
1. Add `GET /api/projects/[id]/export` that:
   - Reads all tasks for the project
   - Serializes to CSV with `papaparse.unparse()`
   - Responds with `Content-Type: text/csv` and `Content-Disposition: attachment`
2. Add an "Export CSV" button in `ProjectDetailTopbar.tsx`

---

## Dark mode

### Suggested implementation
1. Set `darkMode: "class"` in `tailwind.config.ts`
2. Use `next-themes` to manage the toggle
3. Add the provider in `app/layout.tsx`
4. Add `dark:` variants where necessary (mainly background and text)
5. The sidebar `#16213e` works well in both modes

---

## Global search

### Suggested implementation
1. API: `GET /api/search?q=query` — search `task.title`, `task.description`, `project.name`
2. UI: command palette (Cmd+K) using the `cmdk` library
3. Group results by type (projects, tasks)

---

## Stats / Dashboard

### Suggested implementation
1. `GET /api/stats` — aggregate Prisma queries:
   ```typescript
   const byStatus = await prisma.task.groupBy({
     by: ["status"],
     where: { project: { ownerId: userId } },
     _count: true,
   });
   ```
2. `/dashboard` page with charts (use `recharts` or `chart.js`)
3. Metrics: tasks by status, overdue tasks, weekly velocity

---

## Multi-tenant / advanced team support

### Goal
Enable multiple users to collaborate in the same workspace.

### Notes
- `Team` and `TeamMember` models already exist in the schema
- Current project queries filter by `ownerId` — change to allow users who are members of the project's team
- Add roles: owner can delete, admin can modify, member can comment only

