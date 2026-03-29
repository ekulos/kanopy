import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn, isDueLate, formatDueDate } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import PriorityBadge from "@/components/ui/PriorityBadge";
import { isToday, isTomorrow, parseISO, isWithinInterval, addDays, startOfDay } from "date-fns";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

function getDeadlineGroup(dueDate: string | Date | null): "overdue" | "today" | "tomorrow" | "week" | "later" {
  if (!dueDate) return "later";
  const d = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  const now = new Date();
  if (isDueLate(dueDate)) return "overdue";
  if (isToday(d)) return "today";
  if (isTomorrow(d)) return "tomorrow";
  if (isWithinInterval(d, { start: startOfDay(now), end: addDays(now, 7) })) return "week";
  return "later";
}

function isDueLateDate(date: string | Date | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  const now = new Date();
  return d < startOfDay(now);
}

// group labels are provided via translations

const GROUP_ORDER = ["overdue", "today", "tomorrow", "week", "later"];

export default async function DeadlinesPage() {
  const session = await auth();
  const t = await getTranslations("deadlines");
  const tt = await getTranslations("tasks");

  const tasks = await prisma.task.findMany({
    where: {
      project: { ownerId: session!.user!.id! },
      dueDate: { not: null },
      status: { not: "done" },
    },
    include: {
      project: { select: { id: true, code: true, name: true, color: true } },
      assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
    orderBy: { dueDate: "asc" },
  });

  // Raggruppa per fascia temporale
  const groups: Record<string, typeof tasks> = {
    overdue: [],
    today: [],
    tomorrow: [],
    week: [],
    later: [],
  };
  for (const task of tasks) {
    groups[getDeadlineGroup(task.dueDate)].push(task);
  }

  const totalCount = tasks.length;

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="h-12 bg-white border-b border-gray-100 flex items-center px-5 flex-shrink-0">
          <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-accent" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5l2 1.5" />
          </svg>
          <span className="text-sm font-semibold text-gray-800">{t("title")}</span>
        </div>
        <div className="ml-3 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {totalCount}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {totalCount === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-3 text-gray-200" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="16" cy="16" r="12" />
              <path d="M16 10v6.5l4 3" />
            </svg>
            <p className="text-sm">{t("noUpcoming")}</p>
          </div>
        ) : (
          GROUP_ORDER.map((groupKey) => {
            const groupTasks = groups[groupKey];
            if (groupTasks.length === 0) return null;

            return (
              <div key={groupKey}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    groupKey === "overdue" ? "text-red-500" :
                    groupKey === "today" ? "text-amber-600" :
                    "text-gray-400"
                  )}>
                    {t("groups." + groupKey)}
                  </span>
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {groupTasks.length}
                  </span>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full" style={{ tableLayout: "fixed" }}>
                    <colgroup>
                      <col style={{ width: "35%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "19%" }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">{tt("headers.title")}</th>
                        <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">{tt("headers.project")}</th>
                        <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">{tt("headers.status")}</th>
                        <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">{tt("headers.priority")}</th>
                        <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-2.5">{tt("headers.due")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupTasks.map((task) => {
                        const isLate = isDueLateDate(task.dueDate);
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
                              <span className={cn(
                                "text-xs font-medium",
                                isLate ? "text-red-500" :
                                groupKey === "today" ? "text-amber-600" :
                                "text-gray-500"
                              )}>
                                {isLate && "⚠ "}{formatDueDate(task.dueDate)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
