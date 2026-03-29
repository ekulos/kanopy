"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SubtaskList from "./SubtaskList";
import CommentThread from "./CommentThread";
import { MarkdownEditor, MarkdownPreview } from "@/components/ui/MarkdownEditor";
import type { Task } from "@/types";

interface Props {
  task: Task;
  currentUserId: string;
}

export default function TaskDetailMain({ task, currentUserId }: Props) {
  const router = useRouter();
  const t = useTranslations("task");
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });
      if (!res.ok) throw new Error();
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-7 py-6 min-w-0">
      {/* Title */}
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-xl font-semibold text-gray-900 bg-transparent border-none outline-none resize-none leading-snug focus:bg-gray-50 focus:px-2 focus:rounded-lg transition-all mb-1"
        rows={1}
      />

      {/* Project breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-5">
        <div className="w-2 h-2 rounded-full" style={{ background: task.project?.color ?? "#888" }} />
        {task.project?.name} &nbsp;·&nbsp; {task.project?.code ? `${task.project.code}-${task.ticketNumber}` : `#${task.id.slice(-4).toUpperCase()}`}
        {task.parent && (
          <>
            &nbsp;·&nbsp;
            <span className="text-gray-400">subtask of <span className="text-gray-600">{task.parent.title}</span></span>
          </>
        )}
      </div>

      {/* Description */}
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">{t("descriptionLabel")}</p>
      {editing ? (
        <MarkdownEditor
          value={description}
          onChange={setDescription}
          placeholder={t("addDescriptionPlaceholder")}
          minHeight={120}
        />
      ) : (
        <div
          className="min-h-[40px] cursor-text rounded-lg hover:bg-gray-50 transition-colors px-1 py-0.5"
          onClick={() => setEditing(true)}
        >
          {description ? (
            <MarkdownPreview content={description} />
          ) : (
            <p className="text-sm text-gray-300">{t("addDescriptionEmpty")}</p>
          )}
        </div>
      )}

      {/* Inline save button */}
      {(editing || title !== task.title || description !== (task.description ?? "")) && (
        <div className="flex gap-2 mt-2 mb-4">
            <button
            onClick={async () => { await handleSave(); setEditing(false); }}
            disabled={saving}
            className="text-xs bg-accent text-white px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
          <button
            onClick={() => { setTitle(task.title); setDescription(task.description ?? ""); setEditing(false); }}
            className="text-xs text-gray-400 px-2 py-1.5 hover:text-gray-600"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      <div className="h-px bg-gray-100 my-5" />

      {/* Subtasks */}
      <SubtaskList task={task} />

      <div className="h-px bg-gray-100 my-5" />

      {/* Comments */}
      <CommentThread taskId={task.id} initialComments={task.comments ?? []} currentUserId={currentUserId} />
    </div>
  );
}
