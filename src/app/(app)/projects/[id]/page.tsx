import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProjectTasksView from "@/components/projects/ProjectTasksView";
import type { Project, Task } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const session = await auth();
  const { id } = await params;
  const { view: viewParam } = await searchParams;
  const view = viewParam === "list" ? "list" : "kanban";

  const project = await prisma.project.findFirst({
    where: { OR: [{ code: id }, { id }], ownerId: session!.user!.id! },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true, email: true } } },
          },
        },
      },
      tasks: {
        where: { parentId: null },
        include: {
          assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
          subtasks: { select: { id: true, status: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ position: "asc" }],
      },
    },
  });

  if (!project) notFound();

  return (
    <div className="flex flex-col h-full">
      <ProjectTasksView
        project={project as unknown as Project}
        initialTasks={project.tasks as unknown as Task[]}
        currentView={view}
      />
    </div>
  );
}
