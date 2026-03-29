"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Task } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Props {
  task: Task;
}

export default function TaskDetailTopbar({ task }: Props) {
  const router = useRouter();
  const t = useTranslations("task");
  const tProjects = useTranslations("projects");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [prevTaskId, setPrevTaskId] = useState<string | null>(null);
  const [nextTaskId, setNextTaskId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const qs = new URLSearchParams();
        qs.set("projectId", task.projectId);
        if (task.parentId) qs.set("parentId", task.parentId);
        else qs.set("onlyRoot", "true");
        const res = await fetch(`/api/tasks?${qs.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        const list: Task[] = json.data ?? [];
        const idx = list.findIndex((t) => t.id === task.id);
        if (!mounted) return;
        setPrevTaskId(idx > 0 ? list[idx - 1].id : null);
        setNextTaskId(idx >= 0 && idx < list.length - 1 ? list[idx + 1].id : null);
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [task.id, task.projectId, task.parentId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success(t("deleted"));
      router.push(`/projects/${task.project?.code ?? task.projectId}`);
    } catch {
      toast.error(t("errorDeleting"));
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="h-12 bg-white border-b border-gray-100 flex items-center px-4 gap-2 flex-shrink-0">
      {/* Breadcrumb */}
      <Link
        href="/projects"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
        {tProjects("title")}
      </Link>
      <span className="text-gray-300 text-xs">/</span>
      <Link
        href={`/projects/${task.project?.code ?? task.projectId}`}
        className="text-xs text-gray-400 hover:text-gray-600 hover:underline underline-offset-2 transition-colors"
      >
        {task.project?.name}
      </Link>
      <span className="text-gray-300 text-xs">/</span>
      <span className="text-sm font-medium text-gray-800 truncate max-w-[260px]">{task.title}</span>

      <div className="flex-1" />

      {/* Nav prev/next */}
      <button
        onClick={() => prevTaskId && router.push(`/projects/${task.project?.code ?? task.projectId}/tasks/${prevTaskId}`)}
        disabled={!prevTaskId}
        className={`w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors ${!prevTaskId ? 'opacity-40 pointer-events-none' : ''}`}
        title={prevTaskId ? t("previous") : ""}
      >
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
      </button>
      <button
        onClick={() => nextTaskId && router.push(`/projects/${task.project?.code ?? task.projectId}/tasks/${nextTaskId}`)}
        disabled={!nextTaskId}
        className={`w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors ${!nextTaskId ? 'opacity-40 pointer-events-none' : ''}`}
        title={nextTaskId ? t("next") : ""}
      >
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 2l5 5-5 5" />
        </svg>
      </button>

      {/* Share */}
      <button
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        title={t("copyLinkTitle")}
        onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success(t("copyLink")); }}
      >
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="11" cy="3" r="1.5" /><circle cx="3" cy="7" r="1.5" /><circle cx="11" cy="11" r="1.5" />
          <path d="M4.5 6.2l5-2.5M4.5 7.8l5 2.5" />
        </svg>
      </button>

      <button
        onClick={() => setConfirmOpen(true)}
        className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
      >
        {t("delete")}
      </button>

      <ConfirmModal
        open={confirmOpen}
        title={t("deleteConfirmTitle")}
        message={t("deleteConfirmMessage")}
        confirmLabel={t("delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
