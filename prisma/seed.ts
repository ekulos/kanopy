import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Utenti demo
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

  // Progetto
  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
      code: "WEB",
      description: "Redesign completo del sito aziendale con Next.js 14",
      color: "#378add",
      status: "active",
      ownerId: marco.id,
      teamId: team.id,
    },
  });

  // Task con sotto-task
  const task1 = await prisma.task.create({
    data: {
      title: "Kanban drag & drop",
      description: "Implementare drag & drop con @dnd-kit/core",
      status: "in_progress",
      priority: "high",
      ticketNumber: 1,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      projectId: project.id,
      position: 0,
      assignees: { create: [{ userId: marco.id }, { userId: federica.id }] },
    },
  });

  // Sotto-task
  await prisma.task.createMany({
    data: [
      {
        title: "Installare @dnd-kit/core",
        status: "done",
        priority: "medium",
        projectId: project.id,
        parentId: task1.id,
        position: 0,
      },
      {
        title: "Wrappare le colonne con DndContext",
        status: "done",
        priority: "medium",
        projectId: project.id,
        parentId: task1.id,
        position: 1,
      },
      {
        title: "Implementare onDragEnd con aggiornamento stato",
        status: "in_progress",
        priority: "high",
        projectId: project.id,
        parentId: task1.id,
        position: 2,
      },
      {
        title: "Test su dispositivi touch",
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
      title: "Design system & componenti",
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
      title: "Deploy su Vercel",
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

  console.log("✅ Seed completato");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
