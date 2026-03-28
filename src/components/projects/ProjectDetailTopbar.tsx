"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { PROJECT_STATUS_LABELS } from "@/lib/utils";
import type { Project, User, ProjectStatus } from "@/types";
import Modal from "@/components/ui/Modal";
import Avatar from "@/components/ui/Avatar";

interface Props {
  project: Project;
  currentView: "kanban" | "list";
  teamMembers?: User[];
}

export default function ProjectDetailTopbar({ project, currentView, teamMembers = [] }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [assigneePickerOpen, setAssigneePickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // ─── Edit project state ────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [editCode, setEditCode] = useState(project.code ?? "");
  const [editDesc, setEditDesc] = useState(project.description ?? "");
  const [editColor, setEditColor] = useState(project.color);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [editTeamId, setEditTeamId] = useState<string>(project.teamId ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    if (!assigneePickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setAssigneePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [assigneePickerOpen]);

  const toggleAssignee = (id: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openEdit = async () => {
    setEditName(project.name);
    setEditCode(project.code ?? "");
    setEditDesc(project.description ?? "");
    setEditColor(project.color);
    setEditStatus(project.status);
    setEditTeamId(project.teamId ?? "");
    setEditOpen(true);
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const { data } = await res.json();
        setAvailableTeams(data.map((t: any) => ({ id: t.id, name: t.name, color: t.color })));
      }
    } catch {}
  };

  const handleEditSave = async () => {
    if (!editName.trim()) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          code: editCode.trim() || undefined,
          description: editDesc.trim() || null,
          color: editColor,
          status: editStatus,
          teamId: editTeamId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Progetto aggiornato");
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, description: description.trim() || undefined, projectId: project.id, priority, assigneeIds: selectedAssignees }),
      });
      if (!res.ok) throw new Error();
      toast.success("Task creato");
      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedAssignees([]);
      router.refresh();
    } catch {
      toast.error("Errore nella creazione del task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="h-12 bg-white border-b border-gray-100 flex items-center px-4 gap-2 flex-shrink-0">
        {/* Breadcrumb */}
        <Link href="/projects" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors">
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 2L4 7l5 5" />
          </svg>
          Progetti
        </Link>
        <span className="text-gray-300 text-xs">/</span>
        <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
          {project.name}
          {project.code && <span className="ml-2 text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{project.code}</span>}
        </span>

        <div className="flex-1" />

        {/* View switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => router.push(`/projects/${project.code ?? project.id}?view=kanban`)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors font-medium ${
              currentView === "kanban" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="3.5" height="14" rx="1" />
              <rect x="5" y="0" width="3.5" height="10" rx="1" />
              <rect x="10" y="0" width="3.5" height="12" rx="1" />
            </svg>
            Kanban
          </button>
          <button
            onClick={() => router.push(`/projects/${project.code ?? project.id}?view=list`)}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors font-medium ${
              currentView === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="1" width="14" height="2" rx="1" />
              <rect x="0" y="6" width="14" height="2" rx="1" />
              <rect x="0" y="11" width="14" height="2" rx="1" />
            </svg>
            Lista
          </button>
        </div>

        <div className="flex-1" />

        <button
          onClick={openEdit}
          title="Impostazioni progetto"
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-700"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <circle cx="7" cy="7" r="2" />
            <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.9 2.9l1.05 1.05M10.05 10.05l1.05 1.05M2.9 11.1l1.05-1.05M10.05 3.95l1.05-1.05" />
          </svg>
        </button>

        <button
          onClick={() => setOpen(true)}
          className="bg-accent text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:opacity-90"
        >
          + Nuovo task
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuovo task">
        <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium">Titolo *</label>
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setOpen(false); }}
                  placeholder="Es. Implementare login"
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Descrizione</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrizione opzionale..."
                  rows={3}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Priorità</label>
                <div className="flex gap-2 mt-1.5">
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-medium border transition-all ${
                        priority === p
                          ? p === "high" ? "bg-red-50 border-red-300 text-red-800"
                            : p === "medium" ? "bg-amber-50 border-amber-300 text-amber-800"
                            : "bg-blue-50 border-blue-300 text-blue-800"
                          : "bg-transparent border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {p === "high" ? "Alta" : p === "medium" ? "Media" : "Bassa"}
                    </button>
                  ))}
                </div>
              </div>

              {teamMembers.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 font-medium">Assegnatari</label>
                  <div className="relative mt-1.5" ref={pickerRef}>
                    <button
                      type="button"
                      onClick={() => setAssigneePickerOpen((v) => !v)}
                      className="w-full flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 hover:border-gray-300 bg-white text-left"
                    >
                      {selectedAssignees.length === 0 ? (
                        <span className="text-gray-400">Nessun assegnatario</span>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedAssignees.map((id) => {
                            const m = teamMembers.find((u) => u.id === id);
                            return m ? (
                              <span key={id} className="flex items-center gap-1 bg-accent/10 text-accent rounded-full px-2 py-0.5 text-[11px] font-medium">
                                <Avatar user={m} size="xs" />
                                {m.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                      <svg className="w-3.5 h-3.5 text-gray-300 ml-auto flex-shrink-0" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M3 5l4 4 4-4" />
                      </svg>
                    </button>
                    {assigneePickerOpen && (
                      <div className="absolute z-20 left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-full">
                        {teamMembers.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleAssignee(m.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-xs text-gray-700"
                          >
                            <Avatar user={m} size="xs" />
                            <span className="flex-1 text-left">{m.name}</span>
                            {selectedAssignees.includes(m.id) && (
                              <svg className="w-3.5 h-3.5 text-accent" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 7l4 4 6-6" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                disabled={loading || !title.trim()}
                className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Creazione..." : "Crea task"}
              </button>
            </div>
      </Modal>

      {/* ─── Edit project modal ─────────────────────────────────────────── */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Impostazioni progetto">
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-xs text-gray-500 font-medium">Nome *</label>
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Codice progetto</label>
            <input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
              placeholder="Es. WEB"
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20"
            />
            <p className="text-[10px] text-gray-400 mt-1">Usato per gli ID dei ticket (es. WEB-1). Solo lettere maiuscole e numeri.</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium">Descrizione</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Descrizione opzionale..."
              rows={3}
              className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 resize-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Colore</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                />
                <span className="text-xs text-gray-400">{editColor}</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-medium block mb-1">Stato</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent bg-white"
              >
                {(Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Team</label>
            <select
              value={editTeamId}
              onChange={(e) => setEditTeamId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 outline-none focus:border-accent bg-white"
            >
              <option value="">Nessun team</option>
              {availableTeams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => setEditOpen(false)}
            className="text-xs px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleEditSave}
            disabled={editSaving || !editName.trim()}
            className="text-xs px-4 py-2 rounded-lg bg-accent text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {editSaving ? "Salvataggio..." : "Salva"}
          </button>
        </div>
      </Modal>
    </>
  );
}
