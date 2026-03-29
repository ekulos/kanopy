import AvatarStack from "@/components/ui/AvatarStack";
import { useTranslations } from "next-intl";
import type { Project } from "@/types";

interface Props {
  project: Project;
  filterOpen?: boolean;
  activeFilterCount?: number;
  onToggleFilter?: () => void;
}

export default function ProjectMetaBar({ project, filterOpen, activeFilterCount = 0, onToggleFilter }: Props) {
  const t = useTranslations("projects");
  const tasks = project.tasks ?? [];
  const total = tasks.length;
  const wip = tasks.filter((t) => t.status === "in_progress").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const members = project.team?.members ?? [];

  return (
    <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex items-center gap-4 flex-shrink-0">
      {/* Project name + dot */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: project.color }} />
        <span className="text-sm font-medium text-gray-700">{project.name}</span>
      </div>

      <div className="w-px h-5 bg-gray-100" />

      {/* Stats */}
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span className="text-sm font-semibold text-gray-800">{total}</span>
        {t("stats.totalTasks")}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span className="text-sm font-semibold text-gray-800">{wip}</span>
        {t("stats.inProgress")}
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <span className="text-sm font-semibold text-gray-800">{done}</span>
        {t("stats.completed")}
      </div>

      <div className="w-px h-5 bg-gray-100" />

      {/* Avatars */}
      <div className="flex items-center gap-2">
        <AvatarStack users={members.flatMap((m) => (m.user ? [m.user] : []))} max={5} size="sm" />
        <span className="text-xs text-gray-400">{members.length} {t("members")}</span>
      </div>

      <div className="ml-auto">
        <button
          onClick={onToggleFilter}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
            filterOpen
              ? "bg-accent/10 border-accent/40 text-accent"
              : "border-gray-200 text-gray-400 hover:bg-gray-50"
          }`}
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <path d="M1 3h10M3 6h6M5 9h2" />
          </svg>
          {t("filters")}
          {activeFilterCount > 0 && (
            <span className="ml-0.5 bg-accent text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-semibold leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
