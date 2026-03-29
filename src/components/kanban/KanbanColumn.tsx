"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import TaskCard from "../tasks/TaskCard";
import type { Task, KanbanColumn as KanbanColumnType } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  column: KanbanColumnType;
  projectId: string;
  enableAdd: boolean;
  onTaskCreated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export default function KanbanColumn({ column, projectId, enableAdd, onTaskCreated, onTaskDeleted }: Props) {
  const t = useTranslations("tasks");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) { setAdding(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, projectId, status: column.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      onTaskCreated(data.data);
      setNewTitle("");
      setAdding(false);
    } catch {
      toast.error(t("errorCreating"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-1 pb-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: column.color }} />
        <span className="text-sm font-medium text-gray-800">{column.label}</span>
        <span className="ml-auto text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
          {column.tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 flex flex-col gap-2 rounded-xl p-2 transition-colors min-h-[100px] overflow-y-auto scrollbar-hide",
          isOver ? "bg-accent/5 ring-1 ring-accent/20" : "bg-transparent"
        )}
      >
        <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectId={projectId}
              onDeleted={onTaskDeleted}
            />
          ))}
        </SortableContext>

        {/* Inline add */}
        {adding ? (
          <div className="bg-white border border-gray-200 rounded-lg p-2.5">
              <textarea
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAdd(); }
                if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
              }}
              placeholder={t("taskTitlePlaceholder")}
              className="w-full text-sm text-gray-900 resize-none outline-none placeholder:text-gray-400"
              rows={2}
              disabled={loading}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAdd}
                disabled={loading || !newTitle.trim()}
                className="text-xs bg-accent text-white px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {loading ? t("creating") : t("add")}
              </button>
              <button
                onClick={() => { setAdding(false); setNewTitle(""); }}
                className="text-xs text-gray-500 px-2 py-1.5 hover:text-gray-700"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        ) : enableAdd && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-1 py-1.5 rounded-md hover:bg-white/60 transition-colors w-full"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            {t("add")}
          </button>
        )}
      </div>
    </div>
  );
}
