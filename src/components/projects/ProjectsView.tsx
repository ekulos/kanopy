"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import ProjectsTopbar from "./ProjectsTopbar";
import ProjectsTable from "./ProjectsTable";
import { useTranslations } from "next-intl";
import type { Project, ProjectStatus } from "@/types";

interface Props {
  projects: Project[];
}

export default function ProjectsView({ projects: initialProjects }: Props) {
  const t = useTranslations("projects");
  const labels = useTranslations("labels");

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const STATUS_OPTIONS: { value: ProjectStatus | "all"; label: string }[] = [
    { value: "all", label: t("statusAll") },
    { value: "active", label: labels("projectStatus.active") },
    { value: "on_hold", label: labels("projectStatus.on_hold") },
    { value: "completed", label: labels("projectStatus.completed") },
    { value: "archived", label: labels("projectStatus.archived") },
  ];

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return projects.filter((p) => {
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false);
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [projects, query, statusFilter]);

  const hasFilter = query !== "" || statusFilter !== "all";

  return (
    <div className="flex flex-col h-full">
      <ProjectsTopbar
        query={query}
        onSearch={setQuery}
        onProjectCreated={(p) => setProjects((prev) => [p, ...prev])}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-5 py-2 bg-white border-b border-gray-100 flex-shrink-0">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{t("statusLabel")}</span>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                "text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all",
                statusFilter === value
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {hasFilter && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {filtered.length} of {projects.length}
            </span>
            <button
              onClick={() => { setQuery(""); setStatusFilter("all"); }}
              className="text-xs text-accent hover:underline"
            >
              {t("clearFilters")}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <ProjectsTable projects={filtered} />
      </div>
    </div>
  );
}
