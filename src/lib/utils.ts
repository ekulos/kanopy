import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import type { TaskStatus, TaskPriority, ProjectStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDueDate(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  return format(d, "d MMM");
}

export function isDueLate(date: string | Date | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; border: string }> = {
  todo: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  in_progress: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" },
  done: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
};

export const STATUS_DOT_COLORS: Record<TaskStatus, string> = {
  todo: "#888",
  in_progress: "#e8a838",
  done: "#1d9e75",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  low: { bg: "bg-blue-50", text: "text-blue-800" },
  medium: { bg: "bg-amber-50", text: "text-amber-800" },
  high: { bg: "bg-red-50", text: "text-red-800" },
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On hold",
  completed: "Completed",
  archived: "Archived",
};

// ─── CSV parsing helpers ──────────────────────────────────────────────────────

export function parseCsvStatus(raw: string | undefined): TaskStatus | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase().trim().replace(/[-\s]+/g, "_");
  if (normalized === "todo") return "todo";
  if (normalized === "in_progress") return "in_progress";
  if (normalized === "done") return "done";
  return null;
}

export function parseCsvPriority(raw: string | undefined): TaskPriority | null {
  if (!raw) return null;
  const normalized = raw.toLowerCase().trim();
  if (normalized === "low") return "low";
  if (normalized === "medium") return "medium";
  if (normalized === "high") return "high";
  return null;
}

export function normalizeCsvStatus(raw: string | undefined): TaskStatus {
  return parseCsvStatus(raw) ?? "todo";
}

export function normalizeCsvPriority(raw: string | undefined): TaskPriority {
  return parseCsvPriority(raw) ?? "medium";
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function generateColor(): string {
  const colors = ["#378add", "#7c5cbf", "#1d9e75", "#e24b4a", "#ba7517", "#d4537e"];
  return colors[Math.floor(Math.random() * colors.length)];
}
