import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Plus, Layers, Users, CheckCircle2, Search } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useSpaces } from "@/hooks/useSpaces";
import { useAllTasks } from "@/hooks/useTasks";
import { EmptyState } from "@/components/shared/EmptyState";
import { SpaceCardSkeleton } from "@/components/shared/SkeletonLoader";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

const SPACE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function Spaces() {
  const { spaces, loading } = useSpaces();
  const { tasks } = useAllTasks();
  const { isAdmin, userDoc } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useLang();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(SPACE_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = spaces.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "spaces"), {
        name: newName.trim(),
        description: newDesc.trim(),
        color: newColor,
        icon: "layers",
        memberIds: isAdmin ? [userDoc?.id] : [],
        createdAt: serverTimestamp(),
        createdBy: userDoc?.id,
      });
      toast.success(t.createSpace);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
    } catch {
      toast.error("Failed to create space");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.spaces}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{spaces.length} {t.spaces.toLowerCase()}</p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t.newSpace}
          </motion.button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchSpaces}
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all max-w-sm"
        />
      </div>

      {/* Create form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-card border border-border rounded-xl p-5 mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">{t.createSpace}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.spaceName}</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t.spaceName}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">{t.spaceDesc}</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder={t.spaceDesc}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">{t.spaceColor}</label>
              <div className="flex gap-2 flex-wrap">
                {SPACE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                    style={{ backgroundColor: c, outline: newColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {creating ? t.creating : t.createSpace}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <SpaceCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={t.noSpacesFound}
          description={isAdmin ? t.createFirstSpace : t.notInAnySpace}
          action={isAdmin ? { label: t.createSpace, onClick: () => setShowCreate(true) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((space, i) => {
            const spaceTasks = tasks.filter((t2) => t2.spaceId === space.id);
            const done = spaceTasks.filter((t2) => t2.status === "done").length;
            const pct = spaceTasks.length > 0 ? Math.round((done / spaceTasks.length) * 100) : 0;
            return (
              <motion.div
                key={space.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.25 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/spaces/${space.id}`)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${space.color || "#6366f1"}20` }}
                  >
                    <Layers className="w-5 h-5" style={{ color: space.color || "#6366f1" }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{space.name}</h3>
                    {space.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{space.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {spaceTasks.length} {t.tasks}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {space.memberIds?.length || 0} {t.membersLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: space.color || "#6366f1" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{pct}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
