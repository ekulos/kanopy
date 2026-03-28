import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeamsView from "@/components/teams/TeamsView";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const teams = await prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col h-full">
      <TeamsView
        initialTeams={teams as any}
        currentUserId={userId}
      />
    </div>
  );
}
