import { cn, getInitials } from "@/lib/utils";

const SIZES = {
  xs: "w-5 h-5 text-[8px]",
  sm: "w-6 h-6 text-[8px]",
  md: "w-7 h-7 text-[10px]",
  lg: "w-8 h-8 text-xs",
} as const;

interface Props {
  user: { name?: string | null; image?: string | null };
  size?: keyof typeof SIZES;
  className?: string;
  title?: string;
}

export default function Avatar({ user, size = "sm", className, title }: Props) {
  return (
    <div
      className={cn(
        "rounded-full bg-accent flex items-center justify-center font-medium text-white flex-shrink-0",
        SIZES[size],
        className
      )}
      title={title ?? user.name ?? ""}
    >
      {user.image ? (
        <img src={user.image} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        getInitials(user.name)
      )}
    </div>
  );
}
