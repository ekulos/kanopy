"use client";

import { useState, useMemo } from "react";
import ProjectDetailTopbar from "./ProjectDetailTopbar";
import ProjectMetaBar from "./ProjectMetaBar";
import TaskFilterBar from "@/components/tasks/TaskFilterBar";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import TaskList from "@/components/tasks/TaskList";
import type { Task, TaskFilter, TaskStatus, TaskPriority, Project, User } from "@/types";
import { EMPTY_TASK_FILTER } from "@/types";

interface Props {
  project: Project;
  initialTasks: Task[];
  currentView: "kanban" | "list";
}

function applyFilter(tasks: Task[], filter: TaskFilter): Task[] {
  const q = filter.query.toLowerCase().trim();
  return tasks.filter((t) => {
    const matchQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.description?.toLowerCase().includes(q) ?? false);
    const matchStatus =
      filter.statuses.length === 0 || filter.statuses.includes(t.status as TaskStatus);
    const matchPriority =
      filter.priorities.length === 0 || filter.priorities.includes(t.priority as TaskPriority);
    return matchQuery && matchStatus && matchPriority;
  });
}

export default function ProjectTasksView({ project, initialTasks, currentView }: Props) {
  const [filter, setFilter] = useState<TaskFilter>(EMPTY_TASK_FILTER);
  const [showFilter, setShowFilter] = useState(false);

  const teamMembers: User[] = (project.team?.members ?? []).flatMap((m) =>
    m.user ? [m.user] : []
  );

  const filteredTasks = useMemo(() => applyFilter(initialTasks, filter), [initialTasks, filter]);

  const activeFilterCount =
    (filter.query ? 1 : 0) + filter.statuses.length + filter.priorities.length;

  return (
    <>
      <ProjectDetailTopbar project={project} currentView={currentView} teamMembers={teamMembers} />
      <ProjectMetaBar
        project={project}
        filterOpen={showFilter}
        activeFilterCount={activeFilterCount}
        onToggleFilter={() => setShowFilter((v) => !v)}
      />
      {showFilter && (
        <TaskFilterBar
          filter={filter}
          onChange={setFilter}
          totalCount={initialTasks.length}
          filteredCount={filteredTasks.length}
        />
      )}
      <div className="flex-1 overflow-hidden p-4">
        {currentView === "kanban" ? (
          <KanbanBoard project={project} initialTasks={initialTasks} filter={filter} />
        ) : (
          <TaskList tasks={filteredTasks} projectId={project.code ?? project.id} />
        )}
      </div>
    </>
  );
}
