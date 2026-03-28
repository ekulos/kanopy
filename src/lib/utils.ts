import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import type { TaskStatus, TaskPriority, ProjectStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDueDate(date: string | Date | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isToday(d)) return "oggi";
  if (isTomorrow(d)) return "domani";
  return format(d, "d MMM", { locale: it });
}

export function isDueLate(date: string | Date | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Da fare",
  in_progress: "In corso",
  done: "Fatto",
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
  low: "Bassa",
  medium: "Media",
  high: "Alta",
};

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string }> = {
  low: { bg: "bg-blue-50", text: "text-blue-800" },
  medium: { bg: "bg-amber-50", text: "text-amber-800" },
  high: { bg: "bg-red-50", text: "text-red-800" },
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Attivo",
  on_hold: "In attesa",
  completed: "Completato",
  archived: "Archiviato",
};

// ─── CSV parsing helpers ──────────────────────────────────────────────────────

export function normalizeCsvStatus(raw: string | undefined): TaskStatus {
  const map: Record<string, TaskStatus> = {
    da_fare: "todo",
    todo: "todo",
    "da fare": "todo",
    in_corso: "in_progress",
    in_progress: "in_progress",
    "in corso": "in_progress",
    fatto: "done",
    done: "done",
  };
  return map[raw?.toLowerCase().trim() ?? ""] ?? "todo";
}

export function normalizeCsvPriority(raw: string | undefined): TaskPriority {
  const map: Record<string, TaskPriority> = {
    bassa: "low",
    low: "low",
    media: "medium",
    medium: "medium",
    alta: "high",
    high: "high",
  };
  return map[raw?.toLowerCase().trim() ?? ""] ?? "medium";
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
