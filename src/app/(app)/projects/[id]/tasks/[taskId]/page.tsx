import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TaskDetailTopbar from "@/components/tasks/TaskDetailTopbar";
import TaskDetailMain from "@/components/tasks/TaskDetailMain";
import TaskDetailPanel from "@/components/tasks/TaskDetailPanel";
import type { Task, User } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string; taskId: string }>;
}

export default async function TaskDetailPage({ params }: Props) {
  const session = await auth();
  const { taskId } = await params;

  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { ownerId: session!.user!.id! } },
    include: {
      project: { select: { id: true, code: true, name: true, color: true } },
      parent: { select: { id: true, title: true } },
      subtasks: {
        include: {
          assignees: { include: { user: { select: { id: true, name: true, image: true } } } },
        },
        orderBy: { position: "asc" },
      },
      assignees: {
        include: { user: { select: { id: true, name: true, image: true, email: true } } },
      },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
      labels: { include: { label: true } },
    },
  });

  if (!task) notFound();

  // Fetch the project's team members for assignment
  const projectWithTeam = await prisma.project.findUnique({
    where: { id: task.projectId },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, image: true, email: true } } },
          },
        },
      },
    },
  });

  const teamMembers =
    projectWithTeam?.team?.members.map((m) => m.user) ?? [];

  return (
    <div className="flex flex-col h-full">
      <TaskDetailTopbar task={task as unknown as Task} />
      <div className="flex flex-1 overflow-hidden">
        <TaskDetailMain task={task as unknown as Task} currentUserId={session!.user!.id!} />
        <TaskDetailPanel task={task as unknown as Task} teamMembers={teamMembers as unknown as User[]} />
      </div>
    </div>
  );
}
