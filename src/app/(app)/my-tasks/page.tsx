import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn, formatDueDate, isDueLate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";
import ProgressBar from "@/components/ui/ProgressBar";

export const dynamic = "force-dynamic";

export default async function MyTasksPage() {
  const session = await auth();

  const t = await getTranslations("tasks");

  const tasks = await prisma.task.findMany({
    where: {
      assignees: { some: { userId: session!.user!.id! } },
      status: { not: "done" },
    },
    include: {
      project: { select: { id: true, code: true, name: true, color: true } },
      assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
      subtasks: { select: { id: true, status: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-12 bg-white border-b border-gray-100 flex items-center px-5 flex-shrink-0">
          <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="2" y="2" width="12" height="12" rx="2" />
            <path d="M5 8l2 2 4-4" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{t("myTitle")}</span>
        </div>
        <div className="ml-3 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {tasks.length}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {tasks.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-3 text-gray-200" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="4" y="4" width="24" height="24" rx="4" />
              <path d="M10 16l4 4 8-8" />
            </svg>
            <p className="text-sm">{t("noTasksAssigned")}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full" style={{ tableLayout: "fixed" }}>
              <thead>
                  <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[32%]">{t("headers.title")}</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[18%]">{t("headers.project")}</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[13%]">{t("headers.status")}</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[11%]">{t("headers.priority")}</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[13%]">{t("headers.due")}</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3 w-[13%]">{t("headers.subtasks")}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isLate = isDueLate(task.dueDate);
                  const doneSubtasks = task.subtasks?.filter((s) => s.status === "done").length ?? 0;
                  const totalSubtasks = task.subtasks?.length ?? 0;

                  return (
                    <tr key={task.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${task.project?.code ?? task.project?.id}/tasks/${task.id}`}
                          className="text-sm font-medium text-gray-800 hover:text-accent transition-colors block truncate"
                        >
                          {task.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/projects/${task.project?.code ?? task.project?.id}`}
                          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                        >
                          <div
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: task.project?.color ?? "#378add" }}
                          />
                          <span className="text-xs text-gray-600 truncate">{task.project?.name}</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>
                      <td className="px-4 py-3">
                        {task.dueDate ? (
                          <span className={cn("text-xs", isLate ? "text-red-500 font-medium" : "text-gray-500")}>
                            {isLate && "⚠ "}{formatDueDate(task.dueDate)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {totalSubtasks > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <ProgressBar done={doneSubtasks} total={totalSubtasks} className="max-w-[40px] flex-1" height="xs" />
                            <span className="text-[11px] text-gray-400">{doneSubtasks}/{totalSubtasks}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
