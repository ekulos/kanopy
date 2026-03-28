import { getInitials } from "@/lib/utils";

const SIZES = {
  xs: { ring: "w-5 h-5 text-[8px]", overlap: -4 },
  sm: { ring: "w-6 h-6 text-[8px]", overlap: -5 },
  md: { ring: "w-7 h-7 text-[10px]", overlap: -6 },
} as const;

interface Props {
  users: Array<{ id: string; name?: string | null; image?: string | null }>;
  max?: number;
  size?: keyof typeof SIZES;
}

export default function AvatarStack({ users, max = 4, size = "sm" }: Props) {
  const s = SIZES[size];
  const visible = users.slice(0, max);

  return (
    <div className="flex">
      {visible.map((u, i) => (
        <div
          key={u.id}
          className={`rounded-full border-2 border-white bg-accent flex items-center justify-center font-medium text-white flex-shrink-0 ${s.ring}`}
          style={{ marginLeft: i > 0 ? `${s.overlap}px` : 0, zIndex: i }}
          title={u.name ?? ""}
        >
          {u.image ? (
            <img src={u.image} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(u.name)
          )}
        </div>
      ))}
    </div>
  );
}
