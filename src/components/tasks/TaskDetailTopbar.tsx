"use client";

import { useState } from "react";
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Task deleted");
      router.push(`/projects/${task.project?.code ?? task.projectId}`);
    } catch {
      toast.error("Error deleting task");
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
        Projects
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
      <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors" title="Previous task">
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
      </button>
      <button className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors" title="Next task">
        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M5 2l5 5-5 5" />
        </svg>
      </button>

      {/* Condividi */}
      <button
        className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="Copy link"
        onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
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
        Delete
      </button>

      <ConfirmModal
        open={confirmOpen}
        title="Delete task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
