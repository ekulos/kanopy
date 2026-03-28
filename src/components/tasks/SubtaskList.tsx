"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { cn, STATUS_LABELS, PRIORITY_LABELS, formatDueDate, isDueLate } from "@/lib/utils";
import ProgressBar from "@/components/ui/ProgressBar";
import { MarkdownEditor, MarkdownPreview } from "@/components/ui/MarkdownEditor";
import type { Task } from "@/types";

interface Props {
  task: Task;
}

export default function SubtaskList({ task }: Props) {
  const [subtasks, setSubtasks] = useState<Task[]>(task.subtasks ?? []);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const done = subtasks.filter((s) => s.status === "done").length;
  const total = subtasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggle = async (subtask: Task) => {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    // Ottimistic
    setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, status: newStatus } : s)));
    try {
      const res = await fetch(`/api/tasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setSubtasks((prev) => prev.map((s) => (s.id === subtask.id ? { ...s, status: subtask.status } : s)));
      toast.error("Errore aggiornamento sotto-task");
    }
  };

  const remove = async (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    try {
      await fetch(`/api/tasks/${subtaskId}`, { method: "DELETE" });
    } catch {
      toast.error("Errore eliminazione sotto-task");
    }
  };

  const addSubtask = async () => {
    const title = newTitle.trim();
    if (!title) { setAdding(false); setNewDesc(""); return; }
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: newDesc.trim() || undefined,
          projectId: task.projectId,
          parentId: task.id,
          status: "todo",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setSubtasks((prev) => [...prev, data.data]);
      setNewTitle("");
      setNewDesc("");
      setAdding(false);
    } catch {
      toast.error("Errore creazione sotto-task");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Sub-task
        </p>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{total}</span>
        <div className="flex items-center gap-2 ml-auto">
          <ProgressBar done={done} total={total} className="w-16" height="xs" />
          <span className="text-xs text-gray-400">{done}/{total}</span>
        </div>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-1">
        {subtasks.map((s) => {
          const expanded = expandedIds.has(s.id);
          return (
          <div
            key={s.id}
            className={cn(
              "rounded-lg border border-transparent hover:bg-gray-50 hover:border-gray-100 group transition-colors",
              s.status === "done" && "opacity-60"
            )}
          >
            {/* Row principale */}
            <div className="flex items-center gap-2.5 px-2.5 py-2">
            {/* Chevron expand */}
            <button
              onClick={() => toggleExpand(s.id)}
              className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors"
              aria-label={expanded ? "Comprimi" : "Espandi"}
            >
              <svg
                className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")}
                viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M4 2l4 4-4 4" />
              </svg>
            </button>

            {/* Checkbox */}
            <button
              onClick={() => toggle(s)}
              className={cn(
                "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all",
                s.status === "done"
                  ? "bg-accent border-accent"
                  : "border-gray-300 hover:border-accent"
              )}
            >
              {s.status === "done" && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1.5 5l2.5 2.5 5-5" />
                </svg>
              )}
            </button>

            {/* Titolo */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(s.id)}>
              <span className={cn("text-sm text-gray-800 truncate block", s.status === "done" && "line-through text-gray-400")}>
                {s.title}
              </span>
              {!expanded && s.description && (
                <span className="text-xs text-gray-400 truncate block mt-0.5">{s.description}</span>
              )}
            </div>

            {/* Meta */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                s.status === "todo" ? "bg-amber-50 text-amber-700" :
                s.status === "in_progress" ? "bg-emerald-50 text-emerald-700" :
                "bg-blue-50 text-blue-700"
              )}>
                {STATUS_LABELS[s.status]}
              </span>
              {!expanded && s.assignees?.slice(0, 2).map((a) => (
                <div key={a.id} className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] text-white font-medium">
                  {a.user?.name?.[0] ?? "?"}
                </div>
              ))}
            </div>

            {/* Elimina */}
            <button
              onClick={() => remove(s.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-300 hover:text-red-400"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l10 10M12 2L2 12" />
              </svg>
            </button>
          </div>

          {/* Pannello espanso */}
          {expanded && (
            <div className="px-2.5 pb-3 pl-[52px] space-y-2">
              {s.description && (
                <MarkdownPreview content={s.description} />
              )}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Priorità */}
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                  s.priority === "high" ? "bg-red-50 text-red-700" :
                  s.priority === "medium" ? "bg-amber-50 text-amber-700" :
                  "bg-blue-50 text-blue-700"
                )}>
                  {PRIORITY_LABELS[s.priority]}
                </span>

                {/* Scadenza */}
                {s.dueDate && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1",
                    isDueLate(s.dueDate) ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                  )}>
                    <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <rect x="1" y="2" width="10" height="9" rx="1.5" />
                      <path d="M4 1v2M8 1v2M1 5h10" />
                    </svg>
                    {formatDueDate(s.dueDate)}
                  </span>
                )}

                {/* Assegnatari */}
                {s.assignees && s.assignees.length > 0 && (
                  <div className="flex items-center gap-1">
                    {s.assignees.map((a) => (
                      <div
                        key={a.id}
                        title={a.user?.name ?? a.user?.email ?? "?"}
                        className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-[8px] text-white font-medium"
                      >
                        {a.user?.name?.[0] ?? "?"}
                      </div>
                    ))}
                    <span className="text-[10px] text-gray-400 ml-0.5">
                      {s.assignees.map((a) => a.user?.name ?? a.user?.email).filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}

                {/* Data creazione */}
                <span className="text-[10px] text-gray-400 ml-auto">
                  Creato {formatDueDate(s.createdAt)}
                </span>
              </div>
            </div>
          )}
          </div>
          );
        })}

        {/* Add row */}
        {adding ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-2.5 py-2 space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 rounded border-2 border-gray-200 flex-shrink-0" />
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addSubtask();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); setNewDesc(""); }
                }}
                placeholder="Subtask title..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-gray-300"
              />
            </div>
            <div className="pl-[26px]">
              <MarkdownEditor
                value={newDesc}
                onChange={setNewDesc}
                placeholder="Description (optional)..."
                minHeight={80}
              />
            </div>
            <div className="flex gap-1.5 pl-[26px]">
              <button onClick={addSubtask} className="text-xs bg-accent text-white px-2.5 py-1 rounded">Add</button>
              <button onClick={() => { setAdding(false); setNewTitle(""); setNewDesc(""); }} className="text-xs text-gray-400 px-1.5 py-1">
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 border border-dashed border-transparent hover:border-gray-200 transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M7 1v12M1 7h12" />
            </svg>
            Add subtask
          </button>
        )}
      </div>
    </div>
  );
}
