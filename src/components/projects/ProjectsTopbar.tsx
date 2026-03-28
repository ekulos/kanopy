"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";

const COLORS = ["#378add", "#7c5cbf", "#e8a838", "#1d9e75", "#e05c5c", "#6c757d"];

import type { Project } from "@/types";

interface Props {
  query?: string;
  onSearch?: (q: string) => void;
  onProjectCreated?: (project: Project) => void;
}

export default function ProjectsTopbar({ query = "", onSearch, onProjectCreated }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  const suggestCode = (n: string) => {
    // Auto-generate: take first letter of each word, up to 6 chars, uppercase
    const suggested = n
      .trim()
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setCode(suggested);
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!code.trim()) { setCodeError("Project code is required"); return; }
    if (!/^[A-Z][A-Z0-9]{0,9}$/.test(code)) { setCodeError("Must start with an uppercase letter (eg. WEB)"); return; }
    setCodeError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, code, description: description.trim() || undefined, color }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.formErrors?.[0] ?? body?.error ?? "Error creating project";
        toast.error(typeof msg === "string" ? msg : "Error creating project");
        return;
      }
      const created = await res.json();
      toast.success("Project created");
      setOpen(false);
      setName("");
      setCode("");
      setDescription("");
      setColor(COLORS[0]);
      onProjectCreated?.(created.data);
      router.refresh();
    } catch {
      toast.error("Error creating project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="h-12 bg-white border-b border-gray-100 flex items-center px-5 gap-3 flex-shrink-0">
        <span className="text-sm font-semibold text-gray-800">Progetti</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 min-w-[160px]">
          <svg className="w-3.5 h-3.5 opacity-40 flex-shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Search project..."
            className="text-xs text-gray-700 bg-transparent outline-none w-full placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => onSearch?.("")} className="text-gray-300 hover:text-gray-500">
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 2l8 8M10 2l-8 8" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="bg-accent text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-90"
        >
          + New project
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo progetto">
        <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Nome *</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => { setName(e.target.value); suggestCode(e.target.value); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setOpen(false); }}
                  placeholder="Eg. Company website"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Codice progetto *</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)); setCodeError(""); }}
                    placeholder="Eg. WEB"
                    className={`w-full border rounded-lg px-3 py-2 text-sm font-mono text-gray-900 outline-none focus:ring-1 ${codeError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : "border-gray-200 focus:border-accent focus:ring-accent/20"}`}
                  />
                </div>
                {codeError
                  ? <p className="text-[10px] text-red-500 mt-1">{codeError}</p>
                  : <p className="text-[10px] text-gray-400 mt-1">Used for ticket IDs (eg. WEB-1, WEB-2). Uppercase letters and numbers only.</p>
                }
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Colore</label>
                <div className="flex gap-2 mt-1.5">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: color === c ? `2px solid ${c}` : "none",
                        outlineOffset: "2px",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setOpen(false)}
                className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim() || !code.trim()}
                className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Creazione..." : "Crea progetto"}
              </button>
            </div>
      </Modal>
    </>
  );
}
