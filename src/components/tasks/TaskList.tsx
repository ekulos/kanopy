"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn, formatDueDate, isDueLate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";
import AvatarStack from "@/components/ui/AvatarStack";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Task } from "@/types";

interface Props {
  tasks: Task[];
  projectId: string;
}

export default function TaskList({ tasks: initialTasks, projectId }: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const allSelected = tasks.length > 0 && tasks.every((t) => selected.has(t.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tasks.map((t) => t.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedTasks = tasks.filter((t) => selected.has(t.id));
  const totalSubtasksToDelete = selectedTasks.reduce(
    (sum, t) => sum + (t.subtasks?.length ?? 0),
    0
  );

  const handleDelete = async () => {
    const ids = Array.from(selected);
    setDeleting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error();
      setTasks((prev) => prev.filter((t) => !selected.has(t.id)));
      setSelected(new Set());
      setConfirmOpen(false);
      toast.success(`${ids.length} task deleted`);
      router.refresh();
    } catch {
      toast.error("Error deleting tasks");
    } finally {
      setDeleting(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-sm">Nessun task in questo progetto.</p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar selezione */}
      {someSelected && (
        <div className="flex items-center gap-3 mb-2 px-1 py-2 bg-accent/5 rounded-lg border border-accent/20 animate-in fade-in">
          <span className="text-xs font-medium text-accent ml-1">{selected.size} selected</span>
          <div className="flex-1" />
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.2a1 1 0 001 .8h4.4a1 1 0 001-.8L11 4" />
            </svg>
            Delete selected
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5">Cancel</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full" style={{ tableLayout: "fixed" }}>
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-3 py-3 w-8">
                <button
                  onClick={toggleAll}
                  className={cn(
                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                    allSelected
                      ? "bg-accent border-accent"
                      : someSelected
                      ? "border-accent bg-accent/20"
                      : "border-gray-300 hover:border-accent"
                  )}
                  aria-label="Seleziona tutti"
                >
                  {allSelected && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M1.5 5l2.5 2.5 5-5" />
                    </svg>
                  )}
                  {!allSelected && someSelected && (
                    <span className="block w-2 h-0.5 bg-accent rounded" />
                  )}
                </button>
              </th>
                <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-3 w-[36%]">Title</th>
                <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-3 w-[13%]">Status</th>
                <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-3 w-[11%]">Priority</th>
                <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-3 w-[16%]">Assigned</th>
                <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-3 w-[12%]">Due</th>
                <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-3 py-3 w-[10%]">Subtasks</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const isLate = isDueLate(task.dueDate);
              const doneSubtasks = task.subtasks?.filter((s) => s.status === "done").length ?? 0;
              const totalSubtasks = task.subtasks?.length ?? 0;
              const isSelected = selected.has(task.id);

              return (
                <tr
                  key={task.id}
                  className={cn(
                    "border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors",
                    isSelected && "bg-accent/5 hover:bg-accent/10"
                  )}
                >
                  <td className="px-3 py-3">
                    <button
                      onClick={() => toggleOne(task.id)}
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-accent border-accent" : "border-gray-300 hover:border-accent"
                      )}
                      aria-label="Seleziona task"
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M1.5 5l2.5 2.5 5-5" />
                        </svg>
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/projects/${projectId}/tasks/${task.id}`}
                      className={cn(
                        "text-sm font-medium text-gray-800 hover:text-accent transition-colors block truncate",
                        task.status === "done" && "line-through text-gray-400"
                      )}
                    >
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-3 py-3">
                    {(task.assignees?.length ?? 0) > 0
                      ? <AvatarStack users={(task.assignees ?? []).flatMap((a) => (a.user ? [a.user] : []))} max={3} size="sm" />
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {task.dueDate ? (
                      <span className={cn("text-xs", isLate ? "text-red-500 font-medium" : "text-gray-400")}>
                        {formatDueDate(task.dueDate)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-200">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {totalSubtasks > 0 ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <ProgressBar done={doneSubtasks} total={totalSubtasks} height="xs" className="flex-1" />
                          <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                            {Math.round((doneSubtasks / totalSubtasks) * 100)}%
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-300">{doneSubtasks}/{totalSubtasks}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-200">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modale di conferma eliminazione */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !deleting && setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-red-500" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 2a7 7 0 100 14A7 7 0 009 2zM9 6v4M9 12h.01" />
                </svg>
              </div>
              <div>
                    <h2 className="text-base font-semibold text-gray-900">Delete task</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      You are about to delete <span className="font-medium text-gray-800">{selected.size} task</span>
                      {totalSubtasksToDelete > 0 && (
                        <>
                          {" "}and{" "}
                          <span className="font-medium text-gray-800">{totalSubtasksToDelete} sub-tasks</span>
                        </>
                      )}
                      . This action is <span className="text-red-600 font-medium">irreversible</span>.
                    </p>
              </div>
            </div>

            {/* Elenco task selezionati */}
            <div className="rounded-lg border border-gray-100 bg-gray-50 divide-y divide-gray-100 max-h-48 overflow-y-auto mb-5">
              {selectedTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 gap-2">
                  <span className="text-xs text-gray-700 truncate flex-1">{t.title}</span>
                  {(t.subtasks?.length ?? 0) > 0 && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0 flex items-center gap-0.5">
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                        <path d="M2 4h8M4 7h6M6 10h4" strokeLinecap="round" />
                      </svg>
                      +{t.subtasks!.length}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? "Eliminazione..." : `Elimina ${selected.size} task`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
