// ─── Enums ───────────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type TeamRole = "owner" | "admin" | "member";

// ─── Filters ─────────────────────────────────────────────────────────────────

export interface TaskFilter {
  query: string;
  statuses: TaskStatus[];
  priorities: TaskPriority[];
}

export const EMPTY_TASK_FILTER: TaskFilter = { query: "", statuses: [], priorities: [] };

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  user?: User;
}

export interface Project {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  ownerId: string;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  team?: Team;
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
}

export interface Task {
  id: string;
  ticketNumber: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  position: number;
  projectId: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  parent?: Task | null;
  subtasks?: Task[];
  assignees?: TaskAssignee[];
  comments?: Comment[];
  labels?: TaskLabel[];
  _count?: {
    subtasks: number;
    comments: number;
  };
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: User;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
  label?: Label;
}

export interface Activity {
  id: string;
  type: string;
  payload: string | null;
  taskId: string | null;
  projectId: string | null;
  userId: string;
  createdAt: string;
  user?: User;
}

// ─── API Payloads ─────────────────────────────────────────────────────────────

export interface CreateProjectPayload {
  name: string;
  description?: string;
  color?: string;
  teamId?: string;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {
  status?: ProjectStatus;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  projectId: string;
  parentId?: string | null;
  assigneeIds?: string[];
}

export interface UpdateTaskPayload extends Partial<Omit<CreateTaskPayload, "projectId">> {
  position?: number;
}

export interface CreateCommentPayload {
  content: string;
  taskId: string;
}

// ─── CSV Import ───────────────────────────────────────────────────────────────

export interface CsvTaskRow {
  titolo: string;
  descrizione?: string;
  stato?: string;
  priorità?: string;
  scadenza?: string;
  assegnatari?: string;
  task_padre?: string;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: TaskStatus;
  label: string;
  color: string;
  tasks: Task[];
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
