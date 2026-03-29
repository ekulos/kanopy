import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Demo users
  const marco = await prisma.user.upsert({
    where: { email: "marco@kanopy.dev" },
    update: {},
    create: {
      name: "Marco Russo",
      email: "marco@kanopy.dev",
      role: "admin",
      image: null,
    },
  });

  const federica = await prisma.user.upsert({
    where: { email: "federica@kanopy.dev" },
    update: {},
    create: {
      name: "Federica Poli",
      email: "federica@kanopy.dev",
      role: "member",
    },
  });

  const sara = await prisma.user.upsert({
    where: { email: "sara@kanopy.dev" },
    update: {},
    create: {
      name: "Sara Ferrari",
      email: "sara@kanopy.dev",
      role: "member",
    },
  });

  // Team
  const team = await prisma.team.upsert({
    where: { id: "team-dev" },
    update: {},
    create: {
      id: "team-dev",
      name: "Dev Team",
      color: "#7c5cbf",
      members: {
        create: [
          { userId: marco.id, role: "owner" },
          { userId: federica.id, role: "member" },
          { userId: sara.id, role: "member" },
        ],
      },
    },
  });

  // Project
  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
      code: "WEB",
      description: "Complete redesign of the company website with Next.js 14",
      color: "#378add",
      status: "active",
      ownerId: marco.id,
      teamId: team.id,
    },
  });

  // Task with subtasks
  const task1 = await prisma.task.create({
    data: {
      title: "Kanban drag & drop",
      description: "Implement drag & drop with @dnd-kit/core",
      status: "in_progress",
      priority: "high",
      ticketNumber: 1,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      projectId: project.id,
      position: 0,
      assignees: { create: [{ userId: marco.id }, { userId: federica.id }] },
    },
  });

  // Subtasks
  await prisma.task.createMany({
    data: [
      {
        title: "Install @dnd-kit/core",
        status: "done",
        priority: "medium",
        projectId: project.id,
        parentId: task1.id,
        position: 0,
      },
      {
        title: "Wrap columns with DndContext",
        status: "done",
        priority: "medium",
        projectId: project.id,
        parentId: task1.id,
        position: 1,
      },
      {
        title: "Implement onDragEnd with state update",
        status: "in_progress",
        priority: "high",
        projectId: project.id,
        parentId: task1.id,
        position: 2,
      },
      {
        title: "Test on touch devices",
        status: "todo",
        priority: "medium",
        projectId: project.id,
        parentId: task1.id,
        position: 3,
      },
    ],
  });

  await prisma.task.create({
    data: {
      title: "Setup Next.js 14 + Tailwind",
      status: "done",
      priority: "low",
      ticketNumber: 2,
      projectId: project.id,
      position: 1,
      assignees: { create: [{ userId: marco.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: "Design system & components",
      status: "todo",
      priority: "medium",
      ticketNumber: 3,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: project.id,
      position: 2,
      assignees: { create: [{ userId: federica.id }] },
    },
  });

  await prisma.task.create({
    data: {
      title: "Deploy to Vercel",
      status: "todo",
      priority: "high",
      ticketNumber: 4,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      projectId: project.id,
      position: 3,
      assignees: {
        create: [{ userId: marco.id }, { userId: sara.id }],
      },
    },
  });

  console.log("✅ Seed completed");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
