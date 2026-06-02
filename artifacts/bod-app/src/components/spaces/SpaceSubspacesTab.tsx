import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layers, Users } from "lucide-react";
import { useSubSpaces, useCreateSubSpace } from "@/hooks/useSpaces";
import { useLang } from "@/contexts/LangContext";
import { EmptyState } from "@/components/shared/EmptyState";

const SPACE_COLORS = [
  "#6366f1", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

interface Props {
  spaceId: string;
  isAdmin: boolean;
}

export function SpaceSubspacesTab({ spaceId, isAdmin }: Props) {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { data: subSpaces = [] } = useSubSpaces(spaceId);
  const createSubSpace = useCreateSubSpace();

  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");
  const [newSubColor, setNewSubColor] = useState("#6366f1");

  const handleCreateSubSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    createSubSpace.mutate(
      {
        spaceId,
        payload: { name: newSubName.trim(), description: newSubDesc.trim(), color: newSubColor, icon: "layers" },
      },
      {
        onSuccess: () => {
          setShowCreateSub(false);
          setNewSubName("");
          setNewSubDesc("");
        },
      },
    );
  };

  return (
    <motion.div
      key="subspaces"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Sub-spaces</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {subSpaces.length} sub-spaces inside this space
          </p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateSub(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Sub-space
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {showCreateSub && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-5 mb-6 overflow-hidden shadow-md"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">Create Sub-space</h3>
            <form onSubmit={handleCreateSubSpace} className="space-y-4">
              <input
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                placeholder="Sub-space name"
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
                autoFocus
              />
              <input
                value={newSubDesc}
                onChange={(e) => setNewSubDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {SPACE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewSubColor(c)}
                      className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                      style={{ backgroundColor: c, outline: newSubColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSub(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createSubSpace.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60"
                >
                  {createSubSpace.isPending ? t.creating : "Create Sub-space"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {subSpaces.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No sub-spaces yet"
          description="Create sub-spaces to organize this space further."
          action={isAdmin ? { label: "Create Sub-space", onClick: () => setShowCreateSub(true) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subSpaces.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(`/spaces/${sub.id}`)}
              className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md transition-all group shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${sub.color || "#6366f1"}20` }}
                >
                  <Layers className="w-4 h-4" style={{ color: sub.color || "#6366f1" }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {sub.name}
                  </h3>
                  {sub.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sub.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {sub.memberIds?.length || 0} members
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
