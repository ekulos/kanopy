"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { TaskStatus, TaskPriority, TaskFilter } from "@/types";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

interface Props {
  filter: TaskFilter;
  onChange: (filter: TaskFilter) => void;
  totalCount: number;
  filteredCount: number;
}

export default function TaskFilterBar({ filter, onChange, totalCount, filteredCount }: Props) {
  const t = useTranslations("tasks");
  const tl = useTranslations("labels");
  const hasFilter = filter.query !== "" || filter.statuses.length > 0 || filter.priorities.length > 0;

  const toggleStatus = (s: TaskStatus) => {
    const next = filter.statuses.includes(s)
      ? filter.statuses.filter((x) => x !== s)
      : [...filter.statuses, s];
    onChange({ ...filter, statuses: next });
  };

  const togglePriority = (p: TaskPriority) => {
    const next = filter.priorities.includes(p)
      ? filter.priorities.filter((x) => x !== p)
      : [...filter.priorities, p];
    onChange({ ...filter, priorities: next });
  };

  const clear = () => onChange({ query: "", statuses: [], priorities: [] });

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex-shrink-0 flex-wrap">
      {/* Search */}
      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 min-w-[180px]">
        <svg
          className="w-3.5 h-3.5 text-gray-400 flex-shrink-0"
          viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3"
        >
          <circle cx="6" cy="6" r="4.5" />
          <path d="M9.5 9.5L13 13" strokeLinecap="round" />
        </svg>
          <input
          value={filter.query}
          onChange={(e) => onChange({ ...filter, query: e.target.value })}
          placeholder={t("searchPlaceholder")}
          className="text-xs text-gray-700 bg-transparent outline-none flex-1 placeholder:text-gray-400 min-w-0"
        />
        {filter.query && (
          <button
            onClick={() => onChange({ ...filter, query: "" })}
            className="text-gray-300 hover:text-gray-500 flex-shrink-0"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 1l10 10M11 1L1 11" />
            </svg>
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-gray-200" />

      {/* Status filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mr-0.5">{t("headers.status")}</span>
        {STATUSES.map(({ value }) => {
          const active = filter.statuses.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleStatus(value)}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-medium border transition-all",
                active
                  ? value === "todo"
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : value === "in_progress"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-blue-50 border-blue-300 text-blue-800"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              )}
              >
              {tl(`status.${value}`)}
            </button>
          );
        })}
      </div>

      <div className="h-4 w-px bg-gray-200" />

      {/* Priority filter */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mr-0.5">{t("headers.priority")}</span>
        {PRIORITIES.map(({ value }) => {
          const active = filter.priorities.includes(value);
          return (
            <button
              key={value}
              onClick={() => togglePriority(value)}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-medium border transition-all",
                active
                  ? value === "high"
                    ? "bg-red-50 border-red-300 text-red-800"
                    : value === "medium"
                    ? "bg-amber-50 border-amber-300 text-amber-800"
                    : "bg-blue-50 border-blue-300 text-blue-800"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
              )}
              >
              {tl(`priority.${value}`)}
            </button>
          );
        })}
      </div>

      {hasFilter && (
        <>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs text-gray-400">
            {filteredCount} of {totalCount}
          </span>
          <button onClick={clear} className="text-xs text-accent hover:underline">
            {t("clear")}
          </button>
        </>
      )}
    </div>
  );
}
