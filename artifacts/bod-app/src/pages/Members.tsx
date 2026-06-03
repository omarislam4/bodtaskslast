import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Edit2, Check, X, Shield, UserCheck, ShieldCheck } from "lucide-react";
import { useMembers, memberKeys } from "@/hooks/useMembers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import { useSpaces, useAddSpaceMember, useRemoveSpaceMember } from "@/hooks/useSpaces";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/shared/EmptyState";
import { MemberRowSkeleton } from "@/components/shared/SkeletonLoader";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { UserDoc } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Members() {
  const { members, loading } = useMembers();
  const { spaces } = useSpaces();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: "", email: "", role: "member" as "admin" | "member" });
  const [editForm, setEditForm] = useState<Partial<UserDoc>>({});

  const createMember = useMutation({
    mutationFn: () => usersService.create({ email: form.email.trim(), displayName: form.displayName.trim(), role: form.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      toast.success(t.addMember);
      setShowCreate(false);
      setForm({ displayName: "", email: "", role: "member" });
    },
    onError: () => toast.error(t.errGeneric),
  });

  const updateMember = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      usersService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      toast.success(t.save);
      setEditing(null);
    },
    onError: () => toast.error(t.errGeneric),
  });

  const deleteMember = useMutation({
    mutationFn: (id: string) => usersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all() });
      toast.success(t.delete);
    },
    onError: () => toast.error(t.errGeneric),
  });

  const addSpaceMember = useAddSpaceMember();
  const removeSpaceMember = useRemoveSpaceMember();

  if (!isAdmin) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <Shield className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-foreground font-semibold">{t.adminRequired}</p>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.displayName.trim()) return;
    createMember.mutate();
  };

  const handleUpdate = (id: string) => {
    updateMember.mutate({ id, payload: editForm as Record<string, unknown> });
  };

  const handleDelete = (id: string) => {
    deleteMember.mutate(id);
  };

  const handleRoleToggle = (member: UserDoc) => {
    const newRole = member.role === "admin" ? "member" : "admin";
    updateMember.mutate({ id: member.id, payload: { role: newRole } }, {
      onSuccess: () => toast.success(newRole === "admin" ? t.makeAdmin : t.removeAdminRole),
    });
  };

  const handleSpaceToggle = (member: UserDoc, spaceId: string) => {
    const hasSpace = member.spaceIds?.includes(spaceId);
    if (hasSpace) {
      removeSpaceMember.mutate({ spaceId, memberId: member.id });
    } else {
      addSpaceMember.mutate({ spaceId, userId: member.id });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.members}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{members.length} {t.membersLabel}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.addMember}
        </motion.button>
      </div>

      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="bg-card border border-border rounded-xl p-5 mb-6 overflow-hidden"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">{t.addMember}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.fullName}</label>
                <input
                  value={form.displayName} onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                  placeholder={t.fullName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.email}</label>
                <input
                  type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="member@company.com"
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Role</label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as "admin" | "member" }))}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground">{t.cancel}</button>
              <button type="submit" disabled={createMember.isPending} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60">
                {createMember.isPending ? t.creating : t.addMember}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          Array(4).fill(0).map((_, i) => <MemberRowSkeleton key={i} />)
        ) : members.length === 0 ? (
          <EmptyState icon={Users} title={t.noMembersYet} description={t.addMember} action={{ label: t.addMember, onClick: () => setShowCreate(true) }} />
        ) : (
          members.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="border-b border-border last:border-0"
            >
              <div className="flex items-center gap-4 p-4">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {(member.displayName || member.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  {editing === member.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={editForm.displayName || member.displayName}
                        onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                        className="text-sm bg-background border border-input rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button onClick={() => handleUpdate(member.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground truncate">{member.displayName || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </>
                  )}
                </div>
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${member.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {member.role}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleRoleToggle(member)}
                    className={`p-1.5 rounded-lg transition-colors ${member.role === "admin" ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
                    title={member.role === "admin" ? t.removeAdminRole : t.makeAdmin}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setEditing(member.id); setEditForm({ displayName: member.displayName }); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {spaces.length > 0 && (
                <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> {t.spaces}:
                  </span>
                  {spaces.map((space) => {
                    const hasAccess = member.spaceIds?.includes(space.id);
                    return (
                      <button
                        key={space.id}
                        onClick={() => handleSpaceToggle(member, space.id)}
                        className={`px-2 py-0.5 text-xs rounded-full border transition-all ${hasAccess ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                      >
                        {hasAccess && <span className="me-1">✓</span>}{space.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
