import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, CheckCircle2, Clock, Users, LayoutDashboard,
  Calendar, FolderOpen, Trash2, Link2, FolderPlus, ExternalLink,
  ChevronRight, ChevronDown, UserPlus, UserMinus, Filter,
} from "lucide-react";
import {
  doc, getDoc, addDoc, collection, serverTimestamp, Timestamp,
  updateDoc, arrayUnion, arrayRemove, deleteDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useTasks, TaskStatus, TaskPriority } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useSenders } from "@/hooks/useSenders";
import { useSpaceData, SpaceDataItem } from "@/hooks/useSpaceData";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskStatusBadge, statusOptions } from "@/components/tasks/TaskStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TaskCardSkeleton } from "@/components/shared/SkeletonLoader";
import { Space } from "@/hooks/useSpaces";
import { UserDoc } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, isWithinInterval, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

type Tab = "overview" | "tasks" | "timeline" | "members" | "data";

export default function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const { tasks, loading: tasksLoading } = useTasks(spaceId);
  const { members } = useMembers();
  const { senders } = useSenders();
  const { items: dataItems, loading: dataLoading } = useSpaceData(spaceId);
  const { userDoc, isAdmin } = useAuth();
  const { t } = useLang();
  const [, navigate] = useLocation();

  // Task creation
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority, deadline: "", estimatedHours: 0,
    assigneeIds: [] as string[], senderId: "", progress: 0,
  });

  // Space member management
  const [addingMember, setAddingMember] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState("");

  // Data tab
  const [showAddData, setShowAddData] = useState(false);
  const [dataType, setDataType] = useState<"folder" | "link">("link");
  const [dataName, setDataName] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [dataNotes, setDataNotes] = useState("");
  const [dataParentId, setDataParentId] = useState<string | null>(null);
  const [addingData, setAddingData] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!spaceId) return;
    getDoc(doc(db, "spaces", spaceId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSpace({
          name: "", description: "", color: "#6366f1", icon: "", memberIds: [], createdBy: "",
          ...d, id: snap.id, createdAt: toDate(d.createdAt),
        } as Space);
      }
      setSpaceLoading(false);
    });
  }, [spaceId]);

  const spaceMembers = members.filter((m) => space?.memberIds?.includes(m.id));
  const nonSpaceMembers = members.filter((m) => !space?.memberIds?.includes(m.id));
  const filtered = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);

  const statusCounts = statusOptions.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

  // Check if current user is in this space
  const isInSpace = isAdmin || (userDoc && space?.memberIds?.includes(userDoc.id));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "tasks"), {
        ...form,
        spaceId,
        deadline: form.deadline ? new Date(form.deadline) : null,
        createdAt: serverTimestamp(),
        createdBy: userDoc?.id,
        completedAt: null,
      });
      toast.success("Task created");
      setShowCreate(false);
      setForm({ title: "", description: "", status: "todo", priority: "medium", deadline: "", estimatedHours: 0, assigneeIds: [], senderId: "", progress: 0 });
    } catch {
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedNewMember || !spaceId) return;
    setAddingMember(true);
    try {
      await updateDoc(doc(db, "spaces", spaceId), {
        memberIds: arrayUnion(selectedNewMember),
      });
      setSpace((prev) => prev ? { ...prev, memberIds: [...(prev.memberIds || []), selectedNewMember] } : prev);
      setSelectedNewMember("");
      toast.success("Member added to space");
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!spaceId) return;
    try {
      await updateDoc(doc(db, "spaces", spaceId), {
        memberIds: arrayRemove(memberId),
      });
      setSpace((prev) => prev ? { ...prev, memberIds: (prev.memberIds || []).filter((id) => id !== memberId) } : prev);
      toast.success("Member removed from space");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataName.trim() || !spaceId) return;
    if (dataType === "link" && !dataUrl.trim()) return;
    setAddingData(true);
    try {
      await addDoc(collection(db, "spaces", spaceId, "data"), {
        type: dataType,
        name: dataName.trim(),
        url: dataType === "link" ? dataUrl.trim() : "",
        notes: dataNotes.trim(),
        parentId: dataParentId,
        createdAt: serverTimestamp(),
        createdBy: userDoc?.id || "",
      });
      toast.success(`${dataType === "folder" ? "Folder" : "Link"} added`);
      setShowAddData(false);
      setDataName("");
      setDataUrl("");
      setDataNotes("");
      setDataParentId(null);
    } catch {
      toast.error("Failed to add item");
    } finally {
      setAddingData(false);
    }
  };

  const handleDeleteData = async (itemId: string) => {
    if (!spaceId) return;
    try {
      await deleteDoc(doc(db, "spaces", spaceId, "data", itemId));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteSpace = async () => {
    if (!spaceId) return;
    if (!confirm(t.deleteSpace + "?")) return;
    try {
      await deleteDoc(doc(db, "spaces", spaceId));
      toast.success(t.deleteSpace);
      navigate("/spaces");
    } catch {
      toast.error("Failed to delete space");
    }
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (spaceLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded-lg w-48" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: t.overview, icon: LayoutDashboard },
    { id: "tasks", label: t.tasksTab, icon: CheckCircle2 },
    { id: "timeline", label: t.timelineTab, icon: Calendar },
    { id: "members", label: t.membersTab, icon: Users },
    { id: "data", label: t.data, icon: FolderOpen },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Space header */}
      <div className="px-6 pt-5 pb-0 border-b border-border bg-background">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/spaces")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {space && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${space.color || "#6366f1"}20` }}>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: space.color || "#6366f1" }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{space.name}</h1>
                {space.description && <p className="text-xs text-muted-foreground truncate">{space.description}</p>}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {/* Member avatars */}
            <div className="flex -space-x-2">
              {spaceMembers.slice(0, 4).map((m) => (
                <div key={m.id} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary" title={m.displayName}>
                  {(m.displayName || m.email || "?")[0].toUpperCase()}
                </div>
              ))}
              {spaceMembers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  +{spaceMembers.length - 4}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteSpace}
                  className="flex items-center gap-2 px-3 py-2 border border-destructive/30 text-destructive text-sm font-semibold rounded-xl hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> {t.deleteSpace}
                </motion.button>
              )}
              {isInSpace && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setActiveTab("tasks"); setShowCreate(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-4 h-4" /> {t.newTask}
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "tasks" && tasks.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                  {tasks.length}
                </span>
              )}
              {tab.id === "members" && spaceMembers.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none">
                  {spaceMembers.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW ─── */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 max-w-5xl mx-auto">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: t.totalTasks, value: tasks.length, color: "text-primary", bg: "bg-primary/10" },
                  { label: t.inProgress, value: statusCounts["in-progress"] || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: t.done, value: statusCounts["done"] || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: t.membersLabel, value: spaceMembers.length, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Progress overview */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{t.completion}</h3>
                  {statusOptions.map((s) => {
                    const count = statusCounts[s] || 0;
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                    const colors: Record<string, string> = { "todo": "#94a3b8", "in-progress": "#3b82f6", "review": "#f59e0b", "done": "#10b981", "blocked": "#ef4444" };
                    return (
                      <div key={s} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-muted-foreground w-20 capitalize">{s.replace("-", " ")}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[s] }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{t.upcomingDeadlines}</h3>
                  {tasks.filter((task) => task.deadline && task.status !== "done" && isWithinInterval(task.deadline, { start: new Date(), end: addDays(new Date(), 14) }))
                    .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
                    .slice(0, 5)
                    .map((task) => {
                      const days = task.deadline ? differenceInDays(task.deadline, new Date()) : 0;
                      return (
                        <div key={task.id} className="flex items-center justify-between py-1.5 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)}>
                          <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                          <span className={cn("text-xs font-medium shrink-0 ms-2", days <= 2 ? "text-red-500" : "text-muted-foreground")}>
                            {days === 0 ? t.today : days === 1 ? t.tomorrow : `${days}d`}
                          </span>
                        </div>
                      );
                    })}
                  {tasks.filter((task) => task.deadline && task.status !== "done").length === 0 && (
                    <p className="text-xs text-muted-foreground">{t.noUpcomingDeadlines}</p>
                  )}
                </div>
              </div>

              {/* Members */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">{t.teamMembers}</h3>
                  {isAdmin && (
                    <button onClick={() => setActiveTab("members")} className="text-xs text-primary hover:underline">{t.manage}</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {spaceMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {(m.displayName || m.email || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-foreground">{m.displayName || m.email}</span>
                    </div>
                  ))}
                  {spaceMembers.length === 0 && <p className="text-xs text-muted-foreground">{t.noMembersYet}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── TASKS ─── */}
          {activeTab === "tasks" && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 max-w-6xl mx-auto">
              {/* Create form */}
              <AnimatePresence>
                {showCreate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-border rounded-xl p-5 mb-6 overflow-hidden"
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-4">{t.createTask}</h3>
                    <form onSubmit={handleCreate} className="space-y-4">
                      <input
                        value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder={t.taskTitle}
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        required autoFocus
                      />
                      <textarea
                        value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        placeholder={t.description}
                        rows={2}
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">{t.status}</label>
                          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">{t.priority}</label>
                          <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                            {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">{t.deadline}</label>
                          <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">{t.estimatedHours}</label>
                          <input type="number" value={form.estimatedHours} onChange={(e) => setForm((f) => ({ ...f, estimatedHours: Number(e.target.value) }))}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none" min={0} />
                        </div>
                      </div>

                      {/* Assignees — space members only */}
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1.5">{t.assignMembers}</label>
                        {spaceMembers.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No members in this space yet</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {spaceMembers.map((m) => (
                              <button
                                key={m.id} type="button"
                                onClick={() => setForm((f) => ({
                                  ...f,
                                  assigneeIds: f.assigneeIds.includes(m.id)
                                    ? f.assigneeIds.filter((id) => id !== m.id)
                                    : [...f.assigneeIds, m.id],
                                }))}
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all",
                                  form.assigneeIds.includes(m.id)
                                    ? "bg-primary/10 border-primary text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/50"
                                )}
                              >
                                <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                  {(m.displayName || m.email || "?")[0].toUpperCase()}
                                </span>
                                {m.displayName || m.email}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {senders.length > 0 && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Sender (from manager)</label>
                          <select value={form.senderId} onChange={(e) => setForm((f) => ({ ...f, senderId: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                            <option value="">None</option>
                            {senders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}

                      <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60">
                          {creating ? "Creating..." : "Create Task"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status filter */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                <button onClick={() => setStatusFilter("all")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all", statusFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                  <Filter className="w-3 h-3" /> All ({tasks.length})
                </button>
                {statusOptions.map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all", statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")} ({statusCounts[s] || 0})
                  </button>
                ))}
              </div>

              {/* Tasks grid */}
              {tasksLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => <TaskCardSkeleton key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title={statusFilter === "all" ? "No tasks yet" : `No ${statusFilter} tasks`}
                  description={isInSpace ? "Create your first task to get started." : "No tasks match this filter."}
                  action={isInSpace && statusFilter === "all" ? { label: "Create Task", onClick: () => setShowCreate(true) } : undefined}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((task, i) => (
                    <TaskCard key={task.id} task={task} members={members} index={i} onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── TIMELINE ─── */}
          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 max-w-5xl mx-auto">
              <h2 className="text-sm font-semibold text-foreground mb-4">{t.taskTimeline}</h2>
              {tasks.filter((task) => task.deadline).length === 0 ? (
                <EmptyState icon={Calendar} title={t.noDeadlinesSet} description={t.noUpcomingDeadlines} />
              ) : (
                <div className="space-y-2">
                  {tasks
                    .filter((t) => t.deadline)
                    .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
                    .map((task) => {
                      const isOverdue = task.deadline && task.deadline < new Date() && task.status !== "done";
                      const days = task.deadline ? differenceInDays(task.deadline, new Date()) : 0;
                      const assigned = task.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean) as typeof members;
                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
                          onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                        >
                          <div className="flex items-start gap-4">
                            <div className={cn("text-center shrink-0 w-12", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                              <p className="text-xs font-medium">{task.deadline ? format(task.deadline, "MMM") : ""}</p>
                              <p className="text-xl font-bold leading-tight">{task.deadline ? format(task.deadline, "d") : ""}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{task.title}</h4>
                                <TaskStatusBadge status={task.status} size="sm" />
                              </div>
                              <div className="flex items-center gap-3">
                                {assigned.length > 0 && (
                                  <div className="flex -space-x-1.5">
                                    {assigned.slice(0, 3).map((m) => (
                                      <div key={m.id} className="w-5 h-5 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[10px] font-bold text-primary" title={m.displayName}>
                                        {(m.displayName || "?")[0].toUpperCase()}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
                                {!isOverdue && task.status !== "done" && (
                                  <span className="text-xs text-muted-foreground">
                                    {days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `${days} days left`}
                                  </span>
                                )}
                              </div>
                            </div>
                            {task.progress > 0 && (
                              <div className="shrink-0 text-right">
                                <span className="text-xs font-bold text-foreground">{task.progress}%</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── MEMBERS ─── */}
          {activeTab === "members" && (
            <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">Space Members ({spaceMembers.length})</h2>
              </div>

              {/* Add member (admin only) */}
              {isAdmin && nonSpaceMembers.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mb-5">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Member</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedNewMember}
                      onChange={(e) => setSelectedNewMember(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Select a member...</option>
                      {nonSpaceMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.displayName || m.email} ({m.email})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember}
                      disabled={!selectedNewMember || addingMember}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              )}

              {/* Member list */}
              {spaceMembers.length === 0 ? (
                <EmptyState icon={Users} title="No members yet" description={isAdmin ? "Add members from the section above." : "No members have been added to this space."} />
              ) : (
                <div className="space-y-2">
                  {spaceMembers.map((m) => {
                    const memberTasks = tasks.filter((t) => t.assigneeIds.includes(m.id));
                    const doneTasks = memberTasks.filter((t) => t.status === "done").length;
                    return (
                      <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {(m.displayName || m.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{m.displayName || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{memberTasks.length} tasks</p>
                          <p className="text-xs text-emerald-500 font-medium">{doneTasks} done</p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                          m.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {m.role}
                        </span>
                        {isAdmin && m.role !== "admin" && (
                          <button
                            onClick={() => handleRemoveMember(m.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0"
                            title="Remove from space"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── DATA ─── */}
          {activeTab === "data" && (
            <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">{t.filesLinks}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setDataType("folder"); setDataParentId(null); setShowAddData(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> {t.newFolder}
                  </button>
                  <button
                    onClick={() => { setDataType("link"); setDataParentId(null); setShowAddData(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Link2 className="w-3.5 h-3.5" /> {t.addLink}
                  </button>
                </div>
              </div>

              {/* Add data form */}
              <AnimatePresence>
                {showAddData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-border rounded-xl p-5 mb-5 overflow-hidden"
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      {dataType === "folder" ? t.createFolder : t.addLink}
                    </h3>
                    <form onSubmit={handleAddData} className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Name</label>
                        <input
                          value={dataName} onChange={(e) => setDataName(e.target.value)}
                          placeholder={dataType === "folder" ? "Folder name..." : "Link title..."}
                          className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                          required autoFocus
                        />
                      </div>
                      {dataType === "link" && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">URL</label>
                          <input
                            value={dataUrl} onChange={(e) => setDataUrl(e.target.value)}
                            placeholder="https://..."
                            type="url"
                            className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                            required
                          />
                        </div>
                      )}
                      {/* Notes field */}
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Notes (optional)</label>
                        <textarea
                          value={dataNotes} onChange={(e) => setDataNotes(e.target.value)}
                          placeholder="Add a note or description..."
                          rows={2}
                          className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                      </div>
                      {/* Add to folder option */}
                      {dataType === "link" && dataItems.filter((i) => i.type === "folder").length > 0 && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">Add to folder (optional)</label>
                          <select
                            value={dataParentId || ""}
                            onChange={(e) => setDataParentId(e.target.value || null)}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                          >
                            <option value="">Root (no folder)</option>
                            {dataItems.filter((i) => i.type === "folder").map((f) => (
                              <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => { setShowAddData(false); setDataName(""); setDataUrl(""); setDataNotes(""); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        <button type="submit" disabled={addingData} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60">
                          {addingData ? "Adding..." : dataType === "folder" ? "Create Folder" : "Add Link"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Data tree */}
              {dataLoading ? (
                <div className="space-y-2">
                  {Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
                </div>
              ) : dataItems.length === 0 ? (
                <EmptyState icon={FolderOpen} title="No files or links yet" description={isAdmin ? "Create folders and add links to organize your space resources." : "No files or links have been added yet."} />
              ) : (
                <DataTree items={dataItems} parentId={null} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} isAdmin={isAdmin} onDelete={handleDeleteData} onAddToFolder={(folderId) => { setDataType("link"); setDataParentId(folderId); setShowAddData(true); }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function DataTree({
  items,
  parentId,
  expandedFolders,
  onToggleFolder,
  isAdmin,
  onDelete,
  onAddToFolder,
  depth = 0,
}: {
  items: SpaceDataItem[];
  parentId: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onAddToFolder: (folderId: string) => void;
  depth?: number;
}) {
  const children = items.filter((i) => i.parentId === parentId);
  if (children.length === 0 && depth > 0) {
    return <p className="text-xs text-muted-foreground pl-2 py-1">Empty folder</p>;
  }

  return (
    <div className={cn("space-y-2", depth > 0 && "pl-5 border-l border-border ml-3 mt-2")}>
      {children.map((item) => {
        const isOpen = expandedFolders.has(item.id);
        const hasChildren = items.some((i) => i.parentId === item.id);
        return (
          <div key={item.id}>
            {item.type === "folder" ? (
              <div className="bg-muted/50 hover:bg-muted rounded-xl transition-all group">
                <button onClick={() => onToggleFolder(item.id)} className="flex items-center gap-2 w-full p-3 text-left">
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                  <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate flex-1">{item.name}</span>
                  {hasChildren && <span className="text-xs text-muted-foreground">({items.filter((i) => i.parentId === item.id).length})</span>}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    <button onClick={(e) => { e.stopPropagation(); onAddToFolder(item.id); }} className="p-1 text-muted-foreground hover:text-primary transition-colors" title="Add link to folder">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </button>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl hover:border-primary/30 transition-all group p-3">
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block"
                    >
                      {item.name}
                      <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-70 transition-opacity" />
                    </a>
                    {item.url && (
                      <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-lg px-2 py-1">{item.notes}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button onClick={() => onDelete(item.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
            {item.type === "folder" && isOpen && (
              <DataTree items={items} parentId={item.id} expandedFolders={expandedFolders} onToggleFolder={onToggleFolder} isAdmin={isAdmin} onDelete={onDelete} onAddToFolder={onAddToFolder} depth={depth + 1} />
            )}
          </div>
        );
      })}
    </div>
  );
}
