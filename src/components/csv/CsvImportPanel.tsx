"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { CsvTaskRow } from "@/types";

interface Props {
  projectId: string;
  projectName: string;
}

type RowState = CsvTaskRow & { _errors: string[]; _valid: boolean };

const VALID_STATI = ["da_fare", "in_corso", "fatto", "todo", "in_progress", "done", "da fare", "in corso", ""];
const VALID_PRIORITA = ["alta", "media", "bassa", "high", "medium", "low", ""];

export default function CsvImportPanel({ projectId, projectName }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<RowState[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ imported: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const parseFile = (file: File) => {
    Papa.parse<CsvTaskRow>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (res) => {
        const parsed: RowState[] = res.data.map((row) => {
          const errors: string[] = [];
          if (!row.titolo?.trim()) errors.push("Titolo obbligatorio");
          if (row.stato && !VALID_STATI.includes(row.stato.toLowerCase().trim()))
            errors.push(`Stato non valido: "${row.stato}"`);
          if (row.priorità && !VALID_PRIORITA.includes(row.priorità.toLowerCase().trim()))
            errors.push(`Priorità non valida: "${row.priorità}"`);
          if (row.scadenza?.trim() && isNaN(new Date(row.scadenza.trim()).getTime()))
            errors.push(`Data non valida: "${row.scadenza}"`);
          return { ...row, _errors: errors, _valid: errors.length === 0 };
        });
        setRows(parsed);
        setDone(null);
      },
      error: () => toast.error("Errore nel parsing del CSV"),
    });
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) { toast.error("Carica un file .csv"); return; }
    parseFile(file);
  };

  const handleImport = async () => {
    const valid = rows.filter((r) => r._valid);
    if (!valid.length) return;
    setImporting(true);
    try {
      const res = await fetch("/api/csv-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          rows: valid.map(({ _errors, _valid, ...r }) => r),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setDone({ imported: data.data.imported });
    } catch {
      toast.error("Error during import");
    } finally {
      setImporting(false);
    }
  };

  const valid = rows.filter((r) => r._valid).length;
  const invalid = rows.filter((r) => !r._valid).length;

  if (done) {
    return (
      <div className="max-w-xl">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            {done.imported} task importati in "{projectName}"
          </h3>
          <p className="text-sm text-gray-400 mb-6">I task sono stati aggiunti al progetto</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push(`/projects/${projectId}`)} className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90">
              Vai ai task
            </button>
            <button onClick={() => { setRows([]); setDone(null); }} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
              Importa altro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Drop zone */}
      {rows.length === 0 && (
        <div
          className={cn(
            "bg-white border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer",
            dragging ? "border-accent bg-accent/5" : "border-gray-200 hover:border-gray-300"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M10 13V4M6 8l4-4 4 4" /><path d="M3 15h14" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-800 mb-1">Drag CSV file here</p>
          <p className="text-xs text-gray-400 mb-3">or click to select</p>
          <span className="text-xs text-accent border border-accent/30 px-3 py-1 rounded-full">Choose .csv file</span>
        </div>
      )}

      {/* Spec colonne */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Supported columns</p>
        <div className="space-y-2">
          {[
            { col: "titolo", req: true, desc: "Task name" },
            { col: "descrizione", req: false, desc: "Additional details" },
            { col: "stato", req: false, desc: "da_fare · in_corso · fatto" },
            { col: "priorità", req: false, desc: "alta · media · bassa" },
            { col: "scadenza", req: false, desc: "Format YYYY-MM-DD" },
            { col: "assegnatari", req: false, desc: "Comma separated emails" },
            { col: "task_padre", req: false, desc: "Parent task title (creates sub-task)" },
          ].map((r) => (
            <div key={r.col} className="flex items-center gap-2.5 text-xs">
              <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">{r.col}</code>
              <span className={cn("font-medium", r.req ? "text-red-500" : "text-gray-300")}>{r.req ? "required" : "optional"}</span>
              <span className="text-gray-400">— {r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-gray-800">Preview — {rows.length} rows</p>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{valid} valid</span>
              {invalid > 0 && <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">{invalid} errors</span>}
            </div>
            <button onClick={() => setRows([])} className="text-xs text-gray-400 hover:text-gray-600">
              Change file
            </button>
          </div>

          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {["titolo", "descrizione", "task_padre", "stato", "priorità", "scadenza", "assegnatari", "esito"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={cn("border-t border-gray-50", !row._valid && "bg-red-50/50")}>
                    <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[160px] truncate">
                      {row.titolo || <span className="italic text-red-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[160px] truncate">{row.descrizione || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[120px] truncate">{row.task_padre || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.stato || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.priorità || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500">{row.scadenza || "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[120px] truncate">{row.assegnatari || "—"}</td>
                    <td className="px-4 py-2.5">
                      {row._valid ? (
                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">ok</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium" title={row._errors.join(", ")}>
                          errore
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={importing || valid === 0}
              className="text-sm bg-accent text-white px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {importing ? "Importing..." : `Import ${valid} tasks`}
            </button>
            <button onClick={() => setRows([])} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            {invalid > 0 && (
              <p className="text-xs text-gray-400 ml-auto">{invalid} rows with errors will be skipped</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
