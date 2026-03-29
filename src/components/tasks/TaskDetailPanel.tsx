"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cn, STATUS_LABELS, PRIORITY_LABELS, formatDueDate, isDueLate, getInitials } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { formatDistanceToNow } from "date-fns";
import type { Task, TaskStatus, TaskPriority, User, Activity } from "@/types";

interface Props {
  task: Task;
  teamMembers: User[];
}

export default function TaskDetailPanel({ task, teamMembers }: Props) {
  const router = useRouter();
  const t = useTranslations("task");
  const tc = useTranslations("common");
  const tl = useTranslations("labels");
  const [open, setOpen] = useState(true);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assignees, setAssignees] = useState(task.assignees ?? []);
  const [dueDate, setDueDate] = useState<string | null>(task.dueDate ?? null);
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!addPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setAddPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [addPickerOpen]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingActivities(true);
      try {
        const res = await fetch(`/api/tasks/${task.id}/activities`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (!mounted) return;
        setActivities(json.data ?? []);
      } catch (err) {
        toast.error("Error loading activities");
      } finally {
        if (mounted) setLoadingActivities(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [task.id]);

  const patch = async (payload: object) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Error updating");
    }
  };

  const handleStatus = async (s: TaskStatus) => {
    setStatus(s);
    await patch({ status: s });
  };

  const handlePriority = async (p: TaskPriority) => {
    setPriority(p);
    await patch({ priority: p });
  };

  const removeAssignee = async (userId: string) => {
    const next = assignees.filter((a) => a.userId !== userId);
    setAssignees(next);
    await patch({ assigneeIds: next.map((a) => a.userId) });
  };

  const addAssignee = async (userId: string) => {
    if (assignees.some((a) => a.userId === userId)) return;
    const member = teamMembers.find((m) => m.id === userId);
    if (!member) return;
    const next = [...assignees, { id: userId, taskId: task.id, userId, user: member }];
    setAssignees(next);
    await patch({ assigneeIds: next.map((a) => a.userId) });
  };

  const handleDueDate = async (val: string) => {
    const next = val || null;
    setDueDate(next);
    await patch({ dueDate: next });
  };

  const done = (task.subtasks ?? []).filter((s) => s.status === "done").length;
  const total = (task.subtasks ?? []).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isLate = isDueLate(dueDate);

  function renderActivityText(a: Activity) {
    try {
      const actor = a.user?.name ? `${a.user.name} — ` : "";
      const payload = a.payload ? JSON.parse(a.payload) : null;
      switch (a.type) {
        case "task_created":
          return `${actor}${t("activity.taskCreated")}`;
        case "status_changed": {
          const to = payload?.to as keyof typeof STATUS_LABELS | undefined;
          const statusLabel = to ? tl(`status.${to}`) : String(payload?.to ?? "");
          return `${actor}${t("activity.statusChanged", { status: statusLabel })}`;
        }
        case "assignee_added": {
          const assigneeId = payload?.userId;
          const name = payload?.userName ?? assigneeId ?? "assignee";
          return `${actor}${t("activity.assigneeAdded", { name })}`;
        }
        case "comment_added":
          return `${actor}${t("activity.commentAdded")}`;
        default:
          return `${actor}${a.type.replaceAll("_", " ")}`;
      }
    } catch (e) {
      return a.type;
    }
  }

  return (
    <div className="flex flex-shrink-0">
      {/* Toggle strip */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-5 border-l border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-center transition-colors"
        title={open ? t("closePanel") : t("openPanel")}
      >
        <svg
          className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", !open && "rotate-180")}
          viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        >
          <path d="M9 2L5 7l4 5" />
        </svg>
      </button>

      {/* Panel */}
      <div
        className={cn(
          "border-l border-gray-100 bg-white overflow-y-auto transition-all duration-200",
          open ? "w-56 opacity-100" : "w-0 opacity-0 overflow-hidden"
        )}
      >
        <div className="w-56 px-4 py-5 space-y-5">

          {/* Status */}
          <Section label={t("sections.status")}>
            <div className="flex flex-wrap gap-1.5">
              {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatus(s)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all",
                    status === s
                      ? s === "todo" ? "bg-amber-50 border-amber-300 text-amber-800"
                        : s === "in_progress" ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {tl(`status.${s}`)}
                </button>
              ))}
            </div>
          </Section>

          {/* Priority */}
          <Section label={t("sections.priority")}>
            <div className="flex gap-1.5">
              {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePriority(p)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all",
                    priority === p
                      ? p === "high" ? "bg-red-50 border-red-300 text-red-800"
                        : p === "medium" ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-blue-50 border-blue-300 text-blue-800"
                      : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  {tl(`priority.${p}`)}
                </button>
              ))}
            </div>
          </Section>

          {/* Assignees */}
          <Section label={t("sections.assignees")}>
            <div className="space-y-1.5">
              {assignees.map((a) => (
                <div key={a.id} className="flex items-center gap-2 group">
                  <Avatar user={a.user ?? { name: null, image: null }} size="sm" />
                  <span className="text-xs text-gray-700 flex-1 truncate">{a.user?.name}</span>
                  <button
                    onClick={() => removeAssignee(a.userId)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 1l10 10M11 1L1 11" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Add */}
              {teamMembers.filter((m) => !assignees.some((a) => a.userId === m.id)).length > 0 && (
                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => setAddPickerOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent mt-1"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M7 1v12M1 7h12" />
                    </svg>
                    {t("sections.addMember")}
                  </button>
                  {addPickerOpen && (
                    <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-md py-1 z-10 min-w-[160px]">
                      {teamMembers
                        .filter((m) => !assignees.some((a) => a.userId === m.id))
                        .map((m) => (
                          <button
                            key={m.id}
                            onClick={() => { addAssignee(m.id); setAddPickerOpen(false); }}
                            className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-gray-50 text-xs text-gray-700"
                          >
                            <Avatar user={m} size="xs" />
                            {m.name}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          {/* Due */}
          <Section label={t("sections.due")}>
            <div className="flex flex-col gap-1.5">
              <input
                type="date"
                value={dueDate ? dueDate.slice(0, 10) : ""}
                onChange={(e) => handleDueDate(e.target.value)}
                className={cn(
                  "w-full text-sm border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-accent",
                  isLate && dueDate ? "text-red-500 border-red-200" : "text-gray-700"
                )}
              />
              {isLate && dueDate && (
                <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium w-fit">{t("overdue")}</span>
              )}
              {dueDate && (
                <button
                  onClick={() => handleDueDate("")}
                  className="text-[11px] text-gray-400 hover:text-red-400 text-left transition-colors"
                >
                  {t("removeDueDate")}
                </button>
              )}
            </div>
          </Section>

          {/* Subtask progress */}
          {total > 0 && (
            <Section label={t("sections.subtaskProgress")}>
              <div className="flex items-center gap-2">
                <ProgressBar done={done} total={total} className="flex-1" height="sm" />
                <span className="text-xs text-gray-400 flex-shrink-0">{done}/{total}</span>
              </div>
            </Section>
          )}

          {/* Recent activity */}
          <Section label={t("sections.recentActivity")}>
            <div className="space-y-2">
              {loadingActivities ? (
                <div className="text-sm text-gray-300">{tc("loading")}</div>
              ) : activities.length === 0 ? (
                <div className="text-sm text-gray-300">{tc("noRecentActivity")}</div>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                    <p className="text-xs text-gray-500 flex-1">{renderActivityText(a)}</p>
                    <span className="text-[11px] text-gray-300 flex-shrink-0">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                  </div>
                ))
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function renderActivityText(a: Activity) {
  try {
    const actor = a.user?.name ? `${a.user.name} — ` : "";
    const payload = a.payload ? JSON.parse(a.payload) : null;
    switch (a.type) {
      case "task_created":
        return `${actor}Task created`;
      case "status_changed": {
        const to = payload?.to as keyof typeof STATUS_LABELS | undefined;
        return `${actor}Status → ${to ? STATUS_LABELS[to] : String(payload?.to ?? "")}`;
      }
      case "assignee_added": {
        const assigneeId = payload?.userId;
        const name = payload?.userName ?? assigneeId ?? "assignee";
        return `${actor}Assignee added: ${name}`;
      }
      case "comment_added":
        return `${actor}Comment added`;
      default:
        return `${actor}${a.type.replaceAll("_", " ")}`;
    }
  } catch (e) {
    return a.type;
  }
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      {children}
    </div>
  );
}
