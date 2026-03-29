"use client";

import { useTranslations } from "next-intl";
import { STATUS_LABELS, PROJECT_STATUS_LABELS } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  todo:        "bg-amber-50 text-amber-700",
  in_progress: "bg-emerald-50 text-emerald-700",
  done:        "bg-blue-50 text-blue-700",
  active:      "bg-emerald-50 text-emerald-700",
  on_hold:     "bg-amber-50 text-amber-700",
  completed:   "bg-blue-50 text-blue-700",
  archived:    "bg-gray-100 text-gray-500",
};

const ALL_LABELS: Record<string, string> = {
  ...STATUS_LABELS,
  ...PROJECT_STATUS_LABELS,
};

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const t = useTranslations("labels");
  let label = ALL_LABELS[status] ?? status;
  try {
    if (Object.prototype.hasOwnProperty.call(PROJECT_STATUS_LABELS, status)) {
      const translated = t(`projectStatus.${status}`);
      if (translated && typeof translated === "string") label = translated;
    } else {
      const translated = t(`status.${status}`);
      if (translated && typeof translated === "string") label = translated;
    }
  } catch (e) {
    // fallback to English label
  }

  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_STYLES[status] ?? "bg-gray-100 text-gray-500"}`}
    >
      {label}
    </span>
  );
}
