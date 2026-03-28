import { cn } from "@/lib/utils";

const HEIGHT_CLASS = {
  xs: "h-1",
  sm: "h-1.5",
} as const;

interface Props {
  done: number;
  total: number;
  /** CSS color string. Omit to use the Tailwind `bg-accent` class. */
  color?: string;
  height?: keyof typeof HEIGHT_CLASS;
  /** Width / flex classes applied to the outer track div. */
  className?: string;
}

export default function ProgressBar({ done, total, color, height = "sm", className }: Props) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={cn("bg-gray-100 rounded-full overflow-hidden", HEIGHT_CLASS[height], className)}>
      <div
        className={cn("h-full rounded-full transition-all", !color && "bg-accent")}
        style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}
