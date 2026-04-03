# Copilot — React Components

Guidelines for creating and modifying Kyoma UI components.

---

## Atomic UI components (ui/)

Use these building blocks instead of inlining UI code.

### Avatar / AvatarStack
```tsx
import Avatar from "@/components/ui/Avatar";
import AvatarStack from "@/components/ui/AvatarStack";

// Avatar — single user, sizes: xs (w-5) | sm (w-6, default) | md (w-7) | lg (w-8)
<Avatar user={{ name: "Mario Rossi", image: null }} size="md" />

// AvatarStack — overlapping list with automatic white border
<AvatarStack users={members.flatMap(m => m.user ? [m.user] : [])} max={4} size="sm" />
```

### StatusBadge / PriorityBadge
```tsx
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";

<StatusBadge status={task.status} />
<PriorityBadge priority={task.priority} />
```

### ProgressBar
```tsx
import ProgressBar from "@/components/ui/ProgressBar";

// color = CSS color string (omettere per usare bg-accent)
// height: "xs" (h-1) | "sm" (h-1.5, default)
// className: width della traccia (es. "w-24", "flex-1")
<ProgressBar done={done} total={total} color={project.color} height="sm" className="w-24" />
```

### MarkdownEditor / MarkdownPreview
```tsx
import { MarkdownEditor, MarkdownPreview } from "@/components/ui/MarkdownEditor";

// Editor for input and click-to-edit
<MarkdownEditor value={description} onChange={setDescription} />

// Preview (read-only)
<MarkdownPreview source={description} />
```

Both are dynamically imported with `ssr: false` — import them only in client components.
Click-to-edit pattern:
```tsx
const [editing, setEditing] = useState(false);
// view mode
<div onClick={() => setEditing(true)}><MarkdownPreview source={value} /></div>
// edit mode
<MarkdownEditor value={value} onChange={setValue} />
```

### Modal / ConfirmModal
```tsx
import Modal from "@/components/ui/Modal";

// Generic modal — onClose closes when clicking the backdrop
<Modal open={open} onClose={() => setOpen(false)} title="Modal title">
	{/* content */}
	<div className="flex justify-end gap-2 mt-4">
		<button onClick={() => setOpen(false)}>Cancel</button>
		<button onClick={handleSubmit} className="...">Confirm</button>
	</div>
</Modal>

import ConfirmModal from "@/components/ui/ConfirmModal";

<ConfirmModal
	open={confirmOpen}
	title="Delete item"
	message="This action cannot be undone."
	confirmLabel="Delete"
	danger
	loading={deleting}
	onConfirm={handleDelete}
	onCancel={() => setConfirmOpen(false)}
/>
```

---

## Project components (projects/)

### `ProjectsView`
- Keeps the projects list in local state: `useState<Project[]>(initialProjects)`
- Passes `onProjectCreated` to `ProjectsTopbar` for immediate UI update after creation
- Filters by text query and status client-side without a server refresh

### `ProjectsTopbar`
- Accepts `onProjectCreated?: (project: Project) => void`
- Create modal includes a `code` field (auto-suggested from name initials)
- Inline validation uses `/^[A-Z][A-Z0-9]{0,9}$/` with an error message shown under the field
- After creation: calls `onProjectCreated(created.data)` and `router.refresh()` to update the sidebar

### `ProjectsTable`
- Client component with a trash icon shown on row hover
- On trash click: lazily fetch `/api/projects/[id]` to get accurate counts of tasks/subtasks
- Confirmation modal shows root tasks / subtasks / total and a destructive warning
- After delete: optimistically remove project from local state and call `router.refresh()`

---

## Task components

### `TaskList` (list view)
- Client component with multi-selection using checkboxes
- Header checkbox for "select all"
- Selection toolbar shows a counter and a delete button
- Confirmation modal lists selected task names and subtask counts
- Bulk delete via `DELETE /api/tasks` with `{ ids: string[] }`

### `SubtaskList`
- Each subtask is expandable by chevron or clicking the title
- Expanded area shows description (MarkdownPreview), priority, due date, assignees, and created date
- The add form uses `MarkdownEditor` for the description

---

## When to use Server Components (default)
- When the component reads data from Prisma or session
- When it has no `useState`, `useEffect`, event handlers, or refs
- Pages (`app/**/page.tsx`) and layouts should be server components when possible

## When to use "use client"
- For interactivity: `onClick`, `onChange`, `onSubmit`
- When using hooks: `useState`, `useEffect`, `useRef`, `useRouter`
- When using client-only libraries: `@dnd-kit`, `react-hot-toast`, `papaparse`

---

## Client component example

```tsx
"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface Props {
	task: Task;
	onSuccess?: (updated: Task) => void;
}

export default function MyComponent({ task, onSuccess }: Props) {
	const [loading, setLoading] = useState(false);

	const handleAction = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ /* payload */ }),
			});
			if (!res.ok) throw new Error();
			const data = await res.json();
			onSuccess?.(data.data);
			toast.success("Operation succeeded");
		} catch {
			toast.error("Operation failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="...">
			{/* JSX */}
		</div>
	);
}
```

---

## Optimistic update pattern (Kanban)

```tsx
// 1. Update local state BEFORE the API call
setTasks((prev) =>
	prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
);

// 2. Call the API
try {
	const res = await fetch(`/api/tasks/${taskId}`, { /* ... */ });
	if (!res.ok) throw new Error();
} catch {
	// 3. Rollback on error
	setTasks((prev) =>
		prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t))
	);
	toast.error("Update failed");
}
```

---

## Tailwind styling

### Project colors
```
bg-accent / text-accent / border-accent     → #7c5cbf (accent purple)
bg-[#16213e]                                → dark sidebar background
text-gray-800                               → primary text
text-gray-400 / text-gray-500               → muted text
border-gray-100 / border-gray-200           → thin borders
bg-gray-50                                  → hover background
```

### Status badge pattern
```tsx
<span className={cn(
	"text-[11px] px-2 py-0.5 rounded-full font-medium",
	status === "todo" ? "bg-amber-50 text-amber-700" :
	status === "in_progress" ? "bg-emerald-50 text-emerald-700" :
	"bg-blue-50 text-blue-700"
)}>
	{STATUS_LABELS[status]}
</span>
```

### Priority badge pattern
```tsx
<span className={cn(
	"text-[11px] px-2 py-0.5 rounded-full font-medium",
	priority === "high" ? "bg-red-50 text-red-700" :
	priority === "medium" ? "bg-amber-50 text-amber-700" :
	"bg-blue-50 text-blue-700"
)}>
	{PRIORITY_LABELS[priority]}
</span>
```

### Avatar pattern
```tsx
<div
	className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-medium text-white"
	style={{ background: "#7c5cbf" }}
	title={user.name ?? ""}
>
	{user.image
		? <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
		: getInitials(user.name)}
</div>
```

---

## Views with search/filter

### `TaskFilterBar`
Stateless search + filter bar for task views — receives and updates a `TaskFilter`.

```tsx
import TaskFilterBar from "@/components/tasks/TaskFilterBar";
import { EMPTY_TASK_FILTER } from "@/types";
import type { TaskFilter } from "@/types";

const [filter, setFilter] = useState<TaskFilter>(EMPTY_TASK_FILTER);

<TaskFilterBar
	filter={filter}
	onChange={setFilter}
	totalCount={allTasks.length}
	filteredCount={filteredTasks.length}
/>
```

### `ProjectsView`
Client wrapper for the projects page: holds `query` + `statusFilter` and renders `ProjectsTopbar`, filter pills, and `ProjectsTable`.

```tsx
import ProjectsView from "@/components/projects/ProjectsView";

// Used in projects/page.tsx — projects is the Prisma result cast to Project[]
<ProjectsView projects={projects as unknown as Project[]} />
```

### `ProjectTasksView`
Client wrapper for project detail: holds `TaskFilter`, renders `ProjectDetailTopbar`, `ProjectMetaBar`, `TaskFilterBar` and either `KanbanBoard` or `TaskList`.

```tsx
import ProjectTasksView from "@/components/projects/ProjectTasksView";

<ProjectTasksView
	project={project as unknown as Project}
	initialTasks={project.tasks as unknown as Task[]}
	currentView={view}
/>
```

`KanbanBoard` receives a `filter` prop and applies it only at display time, preserving full state for DnD.
`TaskList` receives tasks already filtered by `ProjectTasksView`.

---

## Naming conventions
- `PascalCase.tsx` for components
- `camelCase.ts` for hooks and utilities
- Group components by domain: `tasks/`, `projects/`, `kanban/`, `csv/`, `ui/`

---

## SVG icons

SVG icons are inline (no external icon library). Example pattern:

```tsx
<svg
	className="w-4 h-4 text-gray-400"
	viewBox="0 0 16 16"
	fill="none"
	stroke="currentColor"
	strokeWidth="1.5"
	strokeLinecap="round"
>
	<path d="..." />
</svg>
```

Common sizes: `w-3 h-3`, `w-3.5 h-3.5`, `w-4 h-4`, `w-5 h-5`.

---

## User feedback
- Always use `toast.success("...")` and `toast.error("...")` from `react-hot-toast`
- Show `loading` state on buttons during fetches
- Never block the UI without visual feedback

---

## Existing components (do not duplicate)

| Component | Path | Purpose |
|---|---|---|
| Sidebar | ui/Sidebar.tsx | Global + contextual navigation |
| Avatar | ui/Avatar.tsx | Single user avatar (photo or initials). Props: `user`, `size` |
| AvatarStack | ui/AvatarStack.tsx | Overlapping avatars. Props: `users[]`, `max`, `size` |
| StatusBadge | ui/StatusBadge.tsx | Colored pill for task/project status. Props: `status: string` |
| PriorityBadge | ui/PriorityBadge.tsx | Colored pill for task priority. Props: `priority: string` |
| ProgressBar | ui/ProgressBar.tsx | Progress bar. Props: `done`, `total`, `color?`, `height?`, `className?` |
| Modal | ui/Modal.tsx | Modal shell (backdrop + container + title). Props: `open`, `onClose`, `title?`, `children` |
| ConfirmModal | ui/ConfirmModal.tsx | Confirmation modal with a danger button. Props: `open`, `title`, `message`, `onConfirm`, `onCancel`, `loading?`, `danger?` |
| KanbanBoard | kanban/KanbanBoard.tsx | DnD board with columns |
| KanbanColumn | kanban/KanbanColumn.tsx | Droppable column with inline add |
| TaskCard | tasks/TaskCard.tsx | Sortable card for kanban |
| TaskDetailMain | tasks/TaskDetailMain.tsx | Title, description, subtasks, comments |
| TaskDetailPanel | tasks/TaskDetailPanel.tsx | Collapsible metadata panel |
| SubtaskList | tasks/SubtaskList.tsx | Subtask list with toggle and add |
| CommentThread | tasks/CommentThread.tsx | Comment thread with input |
| CsvImportPanel | csv/CsvImportPanel.tsx | Dropzone + preview + import |

