# Copilot — Database & Prisma

Guidance for working with the database and Prisma ORM in Kanopy.

---

## Entity schema (overview)

```
User ──< TeamMember >── Team
User ──< TaskAssignee >── Task
User ──< Comment
User ──< Activity

Project >── User (owner)
Project >── Team (optional)
Project ──< Task

Task >── Project
Task >── Task (parent, for subtasks)
Task ──< Task (subtasks)
Task ──< TaskAssignee
Task ──< Comment
Task ──< TaskLabel >── Label
Task ──< Activity
```

### Key fields

- **Project**: `code String? @unique` — short URI-safe identifier (e.g. `WEB`, `SKARA`); used in URLs instead of `id`
- **Task**: `ticketNumber Int @default(0)` — project-scoped incremental number; displayed as `{code}-{ticketNumber}` (e.g. `WEB-1`)

### Lookup project by code or id

```typescript
// Use OR lookup so old id-based links keep working
const project = await prisma.project.findFirst({
  where: { OR: [{ code: id }, { id }], ownerId: userId },
});
```

### Auto-increment `ticketNumber` when creating a task

```typescript
const last = await prisma.task.findFirst({
  where: { projectId },
  orderBy: { ticketNumber: "desc" },
  select: { ticketNumber: true },
});
const ticketNumber = (last?.ticketNumber ?? 0) + 1;
const task = await prisma.task.create({ data: { ...data, ticketNumber } });
```

---

## Enum values (stored as strings)

### `Task.status`
| DB value | Label |
|---|---|
| `todo` | Todo |
| `in_progress` | In Progress |
| `done` | Done |

### `Task.priority`
| DB value | Label |
|---|---|
| `low` | Low |
| `medium` | Medium |
| `high` | High |

### `Project.status`
| DB value | Label |
|---|---|
| `active` | Active |
| `on_hold` | On Hold |
| `completed` | Completed |
| `archived` | Archived |

---

## Common queries

### User's projects with stats
```typescript
const projects = await prisma.project.findMany({
  where: { ownerId: userId },
  include: {
    owner: { select: { id: true, name: true, image: true } },
    tasks: { where: { parentId: null }, select: { id: true, status: true } },
    team: { include: { members: { include: { user: { select: { id: true, name: true, image: true } }, take: 5 } } } },
  },
  orderBy: { createdAt: "desc" },
});
// Note: project.code is the slug used in URLs (e.g. "WEB")
```

### Project tasks (root only)
```typescript
const tasks = await prisma.task.findMany({
  where: { projectId, parentId: null },
  include: {
    assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
    subtasks: { select: { id: true, status: true } },
    _count: { select: { comments: true } },
  },
  orderBy: [{ position: "asc" }],
});
```

### Subtasks of a task
```typescript
const subtasks = await prisma.task.findMany({
  where: { parentId: taskId },
  orderBy: { position: "asc" },
});
```

### Tasks assigned to the current user (`/my-tasks`)
```typescript
const tasks = await prisma.task.findMany({
  where: {
    assignees: { some: { userId: session.user.id } },
    status: { not: "done" },
  },
  include: {
    project: { select: { id: true, name: true, color: true } },
    assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
  },
  orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
});
```

### Tasks with due date (`/deadlines`)
```typescript
const tasks = await prisma.task.findMany({
  where: {
    project: { ownerId: userId },
    dueDate: { not: null },
    status: { not: "done" },
  },
  orderBy: { dueDate: "asc" },
});
```

### User's teams
```typescript
const teams = await prisma.team.findMany({
  where: { members: { some: { userId } } },
  include: {
    members: { include: { user: { select: { id: true, name: true, image: true } } } },
    _count: { select: { projects: true } },
  },
});
```

### Task with full details (task detail page)
```typescript
const task = await prisma.task.findFirst({
  where: { id: taskId, project: { ownerId: userId } },
  include: {
    project: { select: { id: true, name: true, color: true } },
    parent: { select: { id: true, title: true } },
    subtasks: { include: { assignees: { include: { user: true } } } },
    assignees: { include: { user: true } },
    comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    labels: { include: { label: true } },
  },
});
```

---

## Migrations

```bash
# Development: push schema without migration files
npm run db:push

# Production: create and apply migrations
npm run db:migrate

# After schema changes: regenerate client
npm run db:generate
```

---

## Adding a new field to `Task`

1. Add the field to `schema.prisma`:
```prisma
model Task {
  // ...existing fields...
  newField String? // or the appropriate type
}
```

2. Run:
```bash
npm run db:push         # or db:migrate in production
npx prisma generate     # regenerate the client — REQUIRED after schema changes
```

3. Update `src/types/index.ts` — the `Task` interface

4. Update Zod schemas in:
   - `src/app/api/tasks/route.ts` (createTaskSchema)
   - `src/app/api/tasks/[id]/route.ts` (updateTaskSchema)

5. If the field is optional or has a default, the migration is non-breaking.

---

## Demo seed data

Run `npm run db:seed` to populate with:
- 3 users (Marco, Federica, Sara)
- 1 team "Dev Team"
- Projects with unique `code` values (e.g. `WEBR` for "Website Redesign")
- 4 root tasks with various statuses and incremental `ticketNumber`s
- 4 subtasks

To truncate tables (respecting FK order):
```sql
DELETE FROM "TaskLabel";
DELETE FROM "Comment";
DELETE FROM "TaskAssignee";
DELETE FROM "Activity";
DELETE FROM "Task";
DELETE FROM "Project";
```

---

## SQLite vs PostgreSQL

The project uses SQLite for development (`DATABASE_URL="file:./dev.db"`).

To switch to PostgreSQL in production:
1. Change `provider = "postgresql"` in `schema.prisma`
2. Update `DATABASE_URL` in the production environment
3. Run `npm run db:migrate` in production

**Note**: SQLite does not support some Prisma types (e.g. `Decimal`) — avoid those if you need cross-db compatibility.

