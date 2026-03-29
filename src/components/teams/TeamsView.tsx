"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";

// ─── Local types ──────────────────────────────────────────────────────────────

type TeamRole = "owner" | "admin" | "member";

type MemberUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
};

type TeamMemberFull = {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: string;
  user: MemberUser;
};

type TeamFull = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: string;
  members: TeamMemberFull[];
  _count: { projects: number };
};

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: TeamRole }) {
  const t = useTranslations("teams");
  return (
    <span
      className={cn(
        "text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
        role === "owner"
          ? "bg-accent/10 text-accent"
          : role === "admin"
          ? "bg-blue-50 text-blue-600"
          : "bg-gray-100 text-gray-500"
      )}
    >
      {t(`role.${role}`)}
    </span>
  );
}

// ─── Team detail panel ────────────────────────────────────────────────────────

function TeamDetail({
  team,
  currentUserId,
  canManage,
  myRole,
  onUpdated,
  onDeleted,
  onRefresh,
}: {
  team: TeamFull;
  currentUserId: string;
  canManage: boolean;
  myRole: TeamRole;
  onUpdated: (patch: Pick<TeamFull, "id" | "name" | "description" | "color">) => void;
  onDeleted: (id: string) => void;
  onRefresh: (teamId: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [editDesc, setEditDesc] = useState(team.description ?? "");
  const [editColor, setEditColor] = useState(team.color);
  const [saving, setSaving] = useState(false);

  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "member">("member");
  const [addLoading, setAddLoading] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<TeamMemberFull | null>(null);
  const [removing, setRemoving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const t = useTranslations("teams");

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || null,
          color: editColor,
        }),
      });
      if (!res.ok) throw new Error("Update error");
      onUpdated({ id: team.id, name: editName.trim(), description: editDesc.trim() || null, color: editColor });
      setEditing(false);
      toast.success(t("updated"));
    } catch {
      toast.error(t("errorUpdating"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMember() {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message ?? json.error ?? t("memberNotFound") ?? "User not found");
      }
      await onRefresh(team.id);
      setAddEmail("");
      toast.success(t("memberAdded"));
    } catch (e: any) {
      toast.error(e.message || t("errorUpdating"));
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveMember() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/teams/${team.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: removeTarget.userId }),
      });
      if (!res.ok) throw new Error("Removal error");
      await onRefresh(team.id);
      setRemoveTarget(null);
      toast.success(t("memberRemoved"));
    } catch {
      toast.error(t("errorRemoving"));
    } finally {
      setRemoving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion error");
      onDeleted(team.id);
      toast.success(t("deleted"));
    } catch {
      toast.error(t("errorDeleting"));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0"
          style={{ background: team.color }}
        />
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 text-[15px] font-semibold border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-accent"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                />
                <input
                  type="color"
                  className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                />
              </div>
              <input
                className="w-full text-sm text-gray-500 border border-gray-200 rounded-md px-2 py-1 outline-none focus:border-accent"
                placeholder="Description (optional)"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  className="text-xs bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent/90 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditName(team.name);
                    setEditDesc(team.description ?? "");
                    setEditColor(team.color);
                  }}
                  className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-[15px] font-semibold text-gray-800">{team.name}</h2>
              {team.description && (
                <p className="text-sm text-gray-500 mt-0.5">{team.description}</p>
              )}
            </>
          )}
        </div>

        {canManage && !editing && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors"
            >
              Edit
            </button>
            {myRole === "owner" && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-2.5 py-1.5 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-5 mb-6 text-sm text-gray-500">
        <span>
          <strong className="text-gray-700">{team.members.length}</strong> members
        </span>
        <span>
          <strong className="text-gray-700">{team._count?.projects}</strong> projects
        </span>
      </div>

      {/* Members list */}
      <section className="mb-6">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Members
        </h3>
        <ul className="space-y-1">
          {team.members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-1.5">
              <Avatar user={{ name: m.user?.name, image: m.user?.image }} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {m.user?.name ?? "—"}
                </p>
                <p className="text-xs text-gray-400 truncate">{m.user?.email}</p>
              </div>
              <RoleBadge role={m.role} />
                {canManage && m.role !== "owner" && m.userId !== currentUserId && (
                <button
                  onClick={() => setRemoveTarget(m)}
                  className="ml-1 text-gray-300 hover:text-red-400 transition-colors"
                  title="Remove member"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M4 4l8 8M12 4l-8 8" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Add member */}
      {canManage && (
        <section>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Add member</h3>
          <div className="flex gap-2">
              <input
              type="email"
              placeholder="email@example.com"
              className="flex-1 text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-accent"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
            />
            <select
              className="text-sm border border-gray-200 rounded-md px-2 py-2 outline-none focus:border-accent bg-white text-gray-700"
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as "admin" | "member")}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleAddMember}
                disabled={addLoading || !addEmail.trim()}
                className="text-sm bg-accent text-white px-4 py-2 rounded-md hover:bg-accent/90 disabled:opacity-50 font-medium"
              >
                {addLoading ? "…" : "Add"}
            </button>
          </div>
        </section>
      )}

      <ConfirmModal
        open={!!removeTarget}
        title={t("removeMember")}
        message={t("removeMemberMessage", { name: removeTarget?.user?.name ?? t("membersLabel") })}
        confirmLabel={t("removeConfirmLabel")}
        danger
        loading={removing}
        onConfirm={handleRemoveMember}
        onCancel={() => setRemoveTarget(null)}
      />

      <ConfirmModal
        open={deleteOpen}
        title={t("deleteTeam")}
        message={t("deleteTeamMessage", { name: team.name })}
        confirmLabel={t("delete")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface Props {
  initialTeams: TeamFull[];
  currentUserId: string;
}

export default function TeamsView({ initialTeams, currentUserId }: Props) {
  const t = useTranslations("teams");
  const [teams, setTeams] = useState<TeamFull[]>(initialTeams);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTeams[0]?.id ?? null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#7c5cbf");

  const selected = teams.find((t) => t.id === selectedId) ?? null;
  const myRole =
    selected?.members.find((m) => m.userId === currentUserId)?.role ?? null;
  const canManage = myRole === "owner" || myRole === "admin";

  async function refreshTeam(teamId: string) {
    const res = await fetch(`/api/teams/${teamId}`);
    if (res.ok) {
      const { data } = await res.json();
      setTeams((prev) => prev.map((t) => (t.id === teamId ? data : t)));
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          color: newColor,
        }),
      });
      const { data, error } = await res.json();
      if (!res.ok) throw new Error(error?.message ?? "Creation error");
      // Fetch full team detail (includes _count)
      const detailRes = await fetch(`/api/teams/${data.id}`);
      const detail = detailRes.ok ? (await detailRes.json()).data : data;
      setTeams((prev) => [detail, ...prev]);
      setSelectedId(detail.id);
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewColor("#7c5cbf");
      toast.success("Team created");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-white flex-shrink-0">
        <h1 className="text-[15px] font-semibold text-gray-800 flex-1">{t("title")}</h1>
        <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium bg-accent text-white px-3 py-1.5 rounded-md hover:bg-accent/90 transition-colors"
          >
            <span className="text-base leading-none">+</span> {t("new")}
          </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Team list */}
        <div className="w-60 flex-shrink-0 border-r border-gray-100 bg-[#f9f9fb] overflow-y-auto">
          {teams.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-10 px-4">{t("noTeams")}</p>
          ) : (
            <ul className="p-2 space-y-0.5">
              {teams.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-[13px] transition-colors",
                      t.id === selectedId
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: t.color }}
                    />
                    <span className="truncate flex-1">{t.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {t.members.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Team detail */}
        <div className="flex-1 overflow-y-auto">
          {selected && myRole ? (
            <TeamDetail
              key={selected.id}
              team={selected}
              currentUserId={currentUserId}
              canManage={canManage}
              myRole={myRole}
              onUpdated={(patch) =>
                setTeams((prev) =>
                  prev.map((t) => (t.id === patch.id ? { ...t, ...patch } : t))
                )
              }
              onDeleted={(id) => {
                const remaining = teams.filter((t) => t.id !== id);
                setTeams(remaining);
                setSelectedId(remaining[0]?.id ?? null);
              }}
              onRefresh={refreshTeam}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              {teams.length === 0
                ? t("createFirstTeam")
                : t("selectTeam")}
            </div>
          )}
        </div>
      </div>

      {/* Create team modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title={t("createTeam")}>
        <div className="space-y-3 mt-1">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Name *</label>
            <input
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-accent"
              placeholder="E.g. Design team"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
            <input
              className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 outline-none focus:border-accent"
              placeholder="Optional"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">Color</label>
            <input
              type="color"
              className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
            <span className="text-xs text-gray-400">{newColor}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => setCreateOpen(false)}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="text-sm px-4 py-1.5 rounded-md bg-accent text-white font-medium hover:bg-accent/90 disabled:opacity-50"
          >
              {creating ? t("creating") : t("create")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
