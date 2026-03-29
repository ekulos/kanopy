"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "../tasks/TaskCard";
import type { Task, TaskStatus, TaskPriority, TaskFilter, Project } from "@/types";
import { STATUS_LABELS, STATUS_DOT_COLORS } from "@/lib/utils";

interface Props {
  project: Project;
  initialTasks: Task[];
  filter?: TaskFilter;
}

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

export default function KanbanBoard({ project, initialTasks, filter }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Sync when the server refreshes data (e.g., after task creation)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);
  
  const tError = useTranslations("error");
  const t = useTranslations("labels");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = COLUMNS.map((status) => {
    const q = filter?.query.toLowerCase().trim() ?? "";
    const filteredForColumn = tasks.filter((t) => {
      if (t.status !== status) return false;
      if (!filter) return true;
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false);
      const matchPriority =
        filter.priorities.length === 0 ||
        filter.priorities.includes(t.priority as TaskPriority);
      const matchStatus =
        filter.statuses.length === 0 ||
        filter.statuses.includes(t.status as TaskStatus);
      return matchQuery && matchPriority && matchStatus;
    });
    return {
      id: status,
      label: t(`status.${status}`) ?? STATUS_LABELS[status],
      color: STATUS_DOT_COLORS[status],
      tasks: filteredForColumn,
      enableAdd: status === "todo",
    };
  });

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      setActiveTask(task ?? null);
    },
    [tasks]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);
      if (!over) return;

      const taskId = active.id as string;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // over.id può essere lo status di una colonna (todo/in_progress/done)
      // oppure l'id di un task (quando si trascina sopra un'altra card).
      // In quel caso, risalire allo status del task di destinazione.
      const VALID_STATUSES: TaskStatus[] = ["todo", "in_progress", "done"];
      let newStatus: TaskStatus;
      if (VALID_STATUSES.includes(over.id as TaskStatus)) {
        newStatus = over.id as TaskStatus;
      } else {
        const overTask = tasks.find((t) => t.id === over.id);
        if (!overTask) return;
        newStatus = overTask.status as TaskStatus;
      }

      if (task.status === newStatus) return;

      // Ottimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error();
      } catch {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
        );
        toast.error(tError("updating"));
      }
    },
    [tasks]
  );

  const handleTaskCreated = (task: Task) => {
    setTasks((prev) => [...prev, task]);
  };

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 h-full">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            projectId={project.code ?? project.id}
            enableAdd={col.enableAdd}
            onTaskCreated={handleTaskCreated}
            onTaskDeleted={handleTaskDeleted}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 opacity-90">
            <TaskCard task={activeTask} projectId={project.id} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
