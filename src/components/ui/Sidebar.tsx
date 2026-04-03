"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";
import { useSidebarProjects } from "@/hooks/useSidebarProjects";
import Avatar from "@/components/ui/Avatar";
import { useTranslations } from "next-intl";

interface Props {
  user: Session["user"];
}

export default function Sidebar({ user }: Props) {
  const pathname = usePathname();
  const { projects } = useSidebarProjects();
  const tProjects = useTranslations("projects");
  const tTasks = useTranslations("tasks");
  const tDeadlines = useTranslations("deadlines");
  const tTeams = useTranslations("teams");
  const tCsv = useTranslations("csv");

  // Extract current project id from path
  const projectMatch = pathname.match(/\/projects\/([^\/]+)/);
  const currentProjectId = projectMatch?.[1];
  const currentProject = projects.find((p) => (p.code ?? p.id) === currentProjectId);

  const isInProject = !!currentProjectId;
  const isInImport = pathname.includes("/import");
  const isInTask = pathname.includes("/tasks/");

  return (
    <aside className="w-[210px] bg-[#16213e] flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-[14px] border-b border-white/[0.08]">
        <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-white text-sm font-medium">
          K
        </div>
        <span className="text-sm font-medium text-white">
          Ky<span className="text-accent-light">oma</span>
        </span>
      </div>

      {/* Main menu */}
      <nav className="px-2 pt-3 pb-1">
        <p className="text-[10px] font-medium text-white/30 tracking-widest uppercase px-2 pb-1.5">Menu</p>
        <NavItem href="/projects" active={pathname === "/projects"} icon={<GridIcon />}>
          {tProjects("title")}
        </NavItem>
        <NavItem href="/my-tasks" active={pathname === "/my-tasks"} icon={<TaskIcon />}>
          {tTasks("title")}
        </NavItem>
        <NavItem href="/deadlines" active={pathname === "/deadlines"} icon={<ClockIcon />}>
          {tDeadlines("title")}
        </NavItem>
        <NavItem href="/teams" active={pathname === "/teams"} icon={<UsersIcon />}>
          {tTeams("title")}
        </NavItem>
      </nav>

      <div className="mx-3 my-1.5 h-px bg-white/[0.07]" />

      {/* Recent projects */}
      <nav className="px-2 pb-1 flex-1 overflow-y-auto">
        <p className="text-[10px] font-medium text-white/30 tracking-widest uppercase px-2 pb-1.5 pt-2">{tProjects("title")}</p>
        {projects.map((p) => (
          <NavItem
            key={p.id}
            href={`/projects/${p.code ?? p.id}`}
            active={(p.code ?? p.id) === currentProjectId && !isInImport}
            icon={<div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />}
          >
            <span className="truncate">{p.name}</span>
          </NavItem>
        ))}
      </nav>

      {/* Project context section */}
      {isInProject && currentProject && (
        <>
          <div className="mx-3 my-1 h-px bg-white/[0.07]" />
          <div className="px-2 pb-2">
            <div className="flex items-center gap-1.5 px-2 pt-2 pb-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentProject.color }} />
              <span className="text-[10px] text-white/30 uppercase tracking-widest truncate">
                {currentProject.name}
              </span>
            </div>
              <NavItem
              href={`/projects/${currentProjectId}`}
              active={isInProject && !isInImport && !isInTask}
              icon={<ListIcon />}
              ctx
            >
              Tasks
            </NavItem>
            <NavItem
              href={`/projects/${currentProjectId}/import`}
              active={isInImport}
              icon={<CsvIcon />}
              ctx
            >
              {tCsv("title")}
            </NavItem>
          </div>
        </>
      )}

      {/* User */}
      <div className="mt-auto border-t border-white/[0.07] p-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer group">
          <Link href="/settings" className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar user={{ name: user?.name, image: user?.image }} size="md" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white/80 truncate">{user?.name}</p>
              <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
            </div>
          </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              title={"Sign out"}
            >
            <svg className="w-4 h-4 text-white/40 hover:text-white/70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  active,
  icon,
  children,
  ctx = false,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
  ctx?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-colors mb-0.5",
        active
          ? "bg-accent/25 text-purple-200"
          : ctx
          ? "text-white/45 hover:bg-white/5 hover:text-white/80"
          : "text-white/55 hover:bg-white/7 hover:text-white/85"
      )}
    >
      <span className="opacity-70 flex-shrink-0">{icon}</span>
      {children}
    </Link>
  );
}

function GridIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="currentColor"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="9" y="1" width="5" height="5" rx="1" /><rect x="1" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>;
}
function TaskIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3" width="11" height="9" rx="1" /><path d="M5 1v2M10 1v2M2 6h11" /></svg>;
}
function ClockIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="7.5" cy="7.5" r="5.5" /><path d="M7.5 4.5v3l2 1.5" strokeLinecap="round" /></svg>;
}
function ListIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><rect x="2" y="3" width="11" height="9" rx="1" /><path d="M5 6h5M5 9h3" /></svg>;
}
function CsvIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M3 2h6l3 3v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" /><path d="M9 2v3h3M5 8h5M5 10.5h3" /></svg>;
}
function UsersIcon() {
  return <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3"><circle cx="5.5" cy="4.5" r="2" /><path d="M1 12c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" strokeLinecap="round" /><circle cx="11" cy="4" r="1.5" /><path d="M12.5 11.5c0-1.5-1-2.5-2.5-3" strokeLinecap="round" /></svg>;
}

function SettingsIcon() {
  return (
    <svg className="w-[15px] h-[15px]" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7.5" cy="7.5" r="2" />
      <path d="M7.5 1v2M7.5 12v2M1 7.5h2M12 7.5h2M3 3l1.5 1.5M10.5 10.5L12 12M3 12l1.5-1.5M10.5 4.5L12 3" strokeLinecap="round" />
    </svg>
  );
}
