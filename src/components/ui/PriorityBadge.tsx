import { PRIORITY_LABELS } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
  high:   "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low:    "bg-blue-50 text-blue-700",
};

interface Props {
  priority: string;
}

export default function PriorityBadge({ priority }: Props) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[priority] ?? "bg-gray-100 text-gray-500"}`}>
      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] ?? priority}
    </span>
  );
}
