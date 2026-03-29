"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import StatusBadge from "@/components/ui/StatusBadge";
import AvatarStack from "@/components/ui/AvatarStack";
import ProgressBar from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import type { Project } from "@/types";
import { useTranslations } from "next-intl";

interface Props {
  projects: Project[];
}

interface DeleteState {
  project: Project;
  rootTasks: number;
  subtasks: number;
  loading: boolean;
}

export default function ProjectsTable({ projects: initialProjects }: Props) {
  const t = useTranslations("projects");
  const tt = useTranslations("tasks");
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openDelete = async (p: Project) => {
    // Mostra subito la modale in stato loading
    setDeleteState({ project: p, rootTasks: 0, subtasks: 0, loading: true });
    try {
      const res = await fetch(`/api/projects/${p.id}`);
      const { data } = await res.json();
      const tasks: { subtasks?: { id: string }[] }[] = data.tasks ?? [];
      const rootTasks = tasks.length;
      const subtasks = tasks.reduce((sum, t) => sum + (t.subtasks?.length ?? 0), 0);
      setDeleteState({ project: p, rootTasks, subtasks, loading: false });
    } catch {
      setDeleteState((prev) => prev ? { ...prev, loading: false } : null);
    }
  };

  const handleDelete = async () => {
    if (!deleteState) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${deleteState.project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setProjects((prev) => prev.filter((p) => p.id !== deleteState.project.id));
      setDeleteState(null);
      toast.success(t("deleted"));
      router.refresh();
    } catch {
      toast.error(t("errorDeleting"));
    } finally {
      setDeleting(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-sm">{t("noProjects")}</p>
        <p className="text-xs mt-1">{t("createFirstProject")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{t("table.project")}</th>
              <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{t("table.status")}</th>
              <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{t("table.progress")}</th>
              <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{t("table.team")}</th>
              <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">{t("table.tasks")}</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const tasks = p.tasks ?? [];
              const done = tasks.filter((t) => t.status === "done").length;
              const total = tasks.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const members = p.team?.members ?? [];
              const memberUsers = members.flatMap((m) => (m.user ? [m.user] : []));

              return (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors group cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.code ?? p.id}`} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                      {p.code && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.code}</span>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ProgressBar done={done} total={total} color={p.color} height="sm" className="w-24" />
                      <span className="text-xs text-gray-400">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {memberUsers.length > 0
                      ? <AvatarStack users={memberUsers} max={4} size="sm" />
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{t("table.tasksCount", { count: total })}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => { e.preventDefault(); openDelete(p); }}
                      title={t("delete")}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50"
                      )}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M2 4h10M5 4V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5V4M5.5 6.5v4M8.5 6.5v4M3 4l.8 7.2a1 1 0 001 .8h4.4a1 1 0 001-.8L11 4" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modale conferma eliminazione */}
      {deleteState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => !deleting && setDeleteState(null)}
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
                <h2 className="text-base font-semibold text-gray-900">{t("delete")}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t("deleteConfirmMessage", { name: deleteState.project.name })}
                </p>
              </div>
            </div>

                {deleteState.loading ? (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-5 flex items-center justify-center gap-2 mb-5 text-xs text-gray-400">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2a6 6 0 100 12A6 6 0 008 2z" strokeOpacity=".3" />
                  <path d="M8 2a6 6 0 016 6" strokeLinecap="round" />
                </svg>
                {t("fetchingInfo")}
              </div>
              ) : (
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 mb-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t("deleteModal.rootTasks")}</span>
                  <span className="font-semibold text-gray-800">{deleteState.rootTasks}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t("deleteModal.subtasks")}</span>
                  <span className="font-semibold text-gray-800">{deleteState.subtasks}</span>
                </div>
                <div className="border-t border-gray-200 pt-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t("deleteModal.totalDeletions")}</span>
                  <span className="font-semibold text-red-600">{deleteState.rootTasks + deleteState.subtasks} {t("deleteModal.items")}</span>
                </div>
                {deleteState.rootTasks + deleteState.subtasks > 0 && (
                  <p className="text-[11px] text-red-500 pt-0.5">{tt("irreversible")}</p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteState(null)}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteState.loading}
                className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
