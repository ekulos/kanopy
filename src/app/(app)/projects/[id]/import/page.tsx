import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CsvImportTopbar from "@/components/csv/CsvImportTopbar";
import CsvImportPanel from "@/components/csv/CsvImportPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CsvImportPage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { OR: [{ code: id }, { id }], ownerId: session!.user!.id! },
    select: { id: true, code: true, name: true, color: true },
  });

  if (!project) notFound();

  return (
    <div className="flex flex-col h-full">
      <CsvImportTopbar project={project} />
      <div className="flex-1 overflow-y-auto p-6">
        <CsvImportPanel projectId={project.id} projectName={project.name} />
      </div>
    </div>
  );
}
