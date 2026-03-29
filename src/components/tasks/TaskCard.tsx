"use client";

import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn, formatDueDate, isDueLate } from "@/lib/utils";
import PriorityBadge from "@/components/ui/PriorityBadge";
import AvatarStack from "@/components/ui/AvatarStack";
import ProgressBar from "@/components/ui/ProgressBar";
import type { Task } from "@/types";

interface Props {
  task: Task;
  projectId: string;
  onDeleted?: (id: string) => void;
}

export default function TaskCard({ task, projectId, onDeleted }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const doneSubtasks = task.subtasks?.filter((s) => s.status === "done").length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const isLate = isDueLate(task.dueDate);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border border-gray-200 rounded-lg p-3 cursor-pointer group transition-all",
        task.status === "in_progress" && "border-l-2 border-l-amber-400 rounded-l-none",
        task.status === "done" && "opacity-60",
        isDragging && "opacity-30 shadow-lg"
      )}
      {...attributes}
      {...listeners}
    >
      <Link
        href={`/projects/${projectId}/tasks/${task.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        <p
          className={cn(
            "text-sm font-medium text-gray-800 leading-snug mb-2",
            task.status === "done" && "line-through text-gray-400"
          )}
        >
          {task.title}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Priority */}
          <PriorityBadge priority={task.priority} />

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 4h8M4 7h6M6 10h4" strokeLinecap="round" />
              </svg>
              {doneSubtasks}/{totalSubtasks}
            </span>
          )}

          {/* Comments */}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                <path d="M2 2h8a1 1 0 011 1v5a1 1 0 01-1 1H4l-3 2V3a1 1 0 011-1z" />
              </svg>
              {task._count?.comments}
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span className={cn("text-[10px] ml-auto", isLate ? "text-red-500 font-medium" : "text-gray-400")}>
              {formatDueDate(task.dueDate)}
            </span>
          )}
        </div>

        {/* Subtask progress bar */}
        {totalSubtasks > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar done={doneSubtasks} total={totalSubtasks} height="xs" className="flex-1" />
            <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
              {Math.round((doneSubtasks / totalSubtasks) * 100)}%
            </span>
          </div>
        )}

        {/* Assignees */}
        {(task.assignees?.length ?? 0) > 0 && (
          <div className="flex mt-2">
            <AvatarStack
              users={task.assignees!.flatMap((a) => (a.user ? [a.user] : []))}
              max={4}
              size="xs"
            />
          </div>
        )}
      </Link>
    </div>
  );
}
