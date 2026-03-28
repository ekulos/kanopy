import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectsView from "@/components/projects/ProjectsView";
import type { Project } from "@/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await auth();

  const projects = await prisma.project.findMany({
    where: { ownerId: session!.user!.id! },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true } } },
            take: 5,
          },
        },
      },
      tasks: { where: { parentId: null }, select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col h-full">
      <ProjectsView projects={projects as unknown as Project[]} />
    </div>
  );
}
