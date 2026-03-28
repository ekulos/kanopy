import Link from "next/link";

interface Props {
  project: { id: string; code: string | null; name: string; color: string };
}

export default function CsvImportTopbar({ project }: Props) {
  return (
    <div className="h-12 bg-white border-b border-gray-100 flex items-center px-4 gap-2 flex-shrink-0">
      <Link
        href="/projects"
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M9 2L4 7l5 5" />
        </svg>
        Progetti
      </Link>
      <span className="text-gray-300 text-xs">/</span>
      <Link
        href={`/projects/${project.code ?? project.id}`}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5"
      >
        <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
        {project.name}
      </Link>
      <span className="text-gray-300 text-xs">/</span>
      <span className="text-sm font-medium text-gray-800">Import CSV</span>
    </div>
  );
}
