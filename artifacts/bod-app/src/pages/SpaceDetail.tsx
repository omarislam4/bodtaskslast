import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, CheckCircle2, Clock, Users, LayoutDashboard,
  Calendar, FolderOpen, Trash2, Link2, FolderPlus, ExternalLink,
  ChevronRight, ChevronDown, UserPlus, UserMinus, Filter,
  Kanban, Layers, Bug, AlertTriangle, MessageCircle,
} from "lucide-react";
import {
  doc, getDoc, addDoc, collection, serverTimestamp, Timestamp,
  updateDoc, arrayUnion, arrayRemove, deleteDoc, onSnapshot, query, where,
} from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useTasks, Task, TaskStatus, TaskPriority, TaskType, BugSeverity } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useSenders } from "@/hooks/useSenders";
import { useSpaceData, SpaceDataItem } from "@/hooks/useSpaceData";
import { TaskCard } from "@/components/tasks/TaskCard";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskStatusBadge, statusOptions } from "@/components/tasks/TaskStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { TaskCardSkeleton } from "@/components/shared/SkeletonLoader";
import { Space } from "@/hooks/useSpaces";
import { UserDoc } from "@/contexts/AuthContext";
import { ChatPanel } from "@/components/chat/ChatPanel";
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

type Tab = "overview" | "tasks" | "bugs" | "kanban" | "timeline" | "members" | "data" | "subspaces" | "calendar" | "workload" | "table" | "gantt" | "chat";

const SEVERITY_CONFIG: Record<BugSeverity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium: { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  low: { label: "Low", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
};

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

  // Space chat channels
  const [spaceChannels, setSpaceChannels] = useState<{ id: string; name: string }[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [creatingChannel, setCreatingChannel] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
    const q = query(collection(db, "chatChannels"), where("spaceId", "==", spaceId));
    const unsub = onSnapshot(q, async (snap) => {
      const channels = snap.docs.map(d => ({ id: d.id, name: (d.data().name as string) || "channel" }));
      setSpaceChannels(channels);
      if (channels.length === 0 && activeTab === "chat") {
        try {
          const ref = await addDoc(collection(db, "chatChannels"), {
            name: "general",
            description: "Space discussion",
            spaceId,
            isPrivate: false,
            memberIds: [],
            createdBy: userDoc?.id || "",
            createdAt: serverTimestamp(),
          });
          setSelectedChannelId(ref.id);
        } catch { }
      } else if (channels.length > 0 && !selectedChannelId) {
        setSelectedChannelId(channels[0].id);
      }
    }, () => { });
    return () => unsub();
  }, [spaceId, activeTab, userDoc?.id]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !spaceId) return;
    setCreatingChannel(true);
    try {
      const ref = await addDoc(collection(db, "chatChannels"), {
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        description: "",
        spaceId,
        isPrivate: false,
        memberIds: [],
        createdBy: userDoc?.id || "",
        createdAt: serverTimestamp(),
      });
      setSelectedChannelId(ref.id);
      setNewChannelName("");
      setShowCreateChannel(false);
    } catch { toast.error("Failed to create channel"); }
    finally { setCreatingChannel(false); }
  };

  // Sub-spaces
  const [subSpaces, setSubSpaces] = useState<Space[]>([]);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");
  const [newSubColor, setNewSubColor] = useState("#6366f1");
  const [creatingSubSpace, setCreatingSubSpace] = useState(false);

  // Task creation
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority, deadline: "", estimatedHours: 0,
    assigneeIds: [] as string[], senderId: "", progress: 0,
    type: "task" as TaskType, bugSeverity: "medium" as BugSeverity,
    stepsToReproduce: "", expectedBehavior: "", actualBehavior: "",
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

  // Load sub-spaces (sort client-side to avoid composite index requirement)
  useEffect(() => {
    if (!spaceId) return;
    const q = query(
      collection(db, "spaces"),
      where("parentSpaceId", "==", spaceId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        name: "", description: "", color: "#6366f1", icon: "", memberIds: [], createdBy: "",
        ...d.data(), id: d.id, createdAt: toDate(d.data().createdAt),
      })) as Space[];
      data.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setSubSpaces(data);
    });
    return () => unsub();
  }, [spaceId]);

  const spaceMembers = members.filter((m) => space?.memberIds?.includes(m.id));
  const nonSpaceMembers = members.filter((m) => !space?.memberIds?.includes(m.id));
  const filtered = statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);

  const statusCounts = statusOptions.reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<TaskStatus, number>);

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
      setForm({ title: "", description: "", status: "todo", priority: "medium", deadline: "", estimatedHours: 0, assigneeIds: [], senderId: "", progress: 0, type: "task", bugSeverity: "medium", stepsToReproduce: "", expectedBehavior: "", actualBehavior: "" });
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
      await updateDoc(doc(db, "spaces", spaceId), { memberIds: arrayUnion(selectedNewMember) });
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
      await updateDoc(doc(db, "spaces", spaceId), { memberIds: arrayRemove(memberId) });
      setSpace((prev) => prev ? { ...prev, memberIds: (prev.memberIds || []).filter((id) => id !== memberId) } : prev);
      toast.success("Member removed from space");
    } catch {
      toast.error("Failed to remove member");
    }
  };

  const handleAddData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataName.trim() || !spaceId) return;
    setAddingData(true);
    try {
      await addDoc(collection(db, "spaces", spaceId, "data"), {
        type: dataType, name: dataName.trim(), url: dataType === "link" ? dataUrl.trim() : "",
        notes: dataNotes.trim(), parentId: dataParentId, createdAt: serverTimestamp(), createdBy: userDoc?.id || "",
      });
      toast.success(`${dataType === "folder" ? "Folder" : "Link"} added`);
      setShowAddData(false);
      setDataName(""); setDataUrl(""); setDataNotes(""); setDataParentId(null);
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Create sub-space
  const handleCreateSubSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !spaceId) return;
    setCreatingSubSpace(true);
    try {
      await addDoc(collection(db, "spaces"), {
        name: newSubName.trim(),
        description: newSubDesc.trim(),
        color: newSubColor,
        icon: "layers",
        memberIds: [],
        parentSpaceId: spaceId,
        createdAt: serverTimestamp(),
        createdBy: userDoc?.id,
      });
      toast.success("Sub-space created");
      setShowCreateSub(false);
      setNewSubName(""); setNewSubDesc("");
    } catch {
      toast.error("Failed to create sub-space");
    } finally {
      setCreatingSubSpace(false);
    }
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

  const SPACE_COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  const bugs = tasks.filter((tk) => tk.type === "bug");
  const bugCounts = {
    total: bugs.length,
    open: bugs.filter((b) => b.status === "todo").length,
    critical: bugs.filter((b) => b.bugSeverity === "critical").length,
  };

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
    { id: "overview",  label: t.overview,     icon: LayoutDashboard },
    { id: "tasks",     label: t.tasksTab,     icon: CheckCircle2 },
    { id: "bugs",      label: t.bugTab,       icon: Bug },
    { id: "kanban",    label: t.kanbanView,   icon: Kanban },
    { id: "calendar",  label: t.calendarView, icon: Calendar },
    { id: "table",     label: t.tableView,    icon: LayoutDashboard },
    { id: "gantt",     label: t.ganttView,    icon: Layers },
    { id: "workload",  label: t.workloadView, icon: Users },
    { id: "timeline",  label: t.timelineTab,  icon: Calendar },
    { id: "members",   label: t.membersTab,   icon: Users },
    { id: "data",      label: t.data,         icon: FolderOpen },
    { id: "subspaces", label: t.subspacesTab, icon: Layers },
    { id: "chat",      label: "Chat",         icon: MessageCircle },
  ];

  const visibleTabs = tabs.filter((tab) => !tab.adminOnly || isAdmin);

  return (
    <div className="flex flex-col h-full">
      {/* Space header */}
      <div className="px-3 sm:px-6 pt-4 sm:pt-5 pb-0 border-b border-border bg-background">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
          <button
            onClick={() => navigate("/spaces")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {space && (
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${space.color || "#6366f1"}20` }}>
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: space.color || "#6366f1" }} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">{space.name}</h1>
                {space.description && <p className="text-xs text-muted-foreground truncate hidden sm:block">{space.description}</p>}
              </div>
            </div>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Member avatars */}
            <div className="hidden sm:flex -space-x-2">
              {spaceMembers.slice(0, 4).map((m) => (
                <div key={m.id} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-xs font-bold text-primary shadow-sm" title={m.displayName}>
                  {(m.displayName || m.email || "?")[0].toUpperCase()}
                </div>
              ))}
              {spaceMembers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs text-muted-foreground">
                  +{spaceMembers.length - 4}
                </div>
              )}
            </div>
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleDeleteSpace}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 border border-destructive/30 text-destructive text-xs sm:text-sm font-semibold rounded-xl hover:bg-destructive/10 transition-colors shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{t.deleteSpace}</span>
              </motion.button>
            )}
            {isInSpace && (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setActiveTab("tasks"); setShowCreate(true); }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t.newTask}</span><span className="sm:hidden">Task</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-150",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              {tab.id === "tasks" && tasks.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 leading-none hidden sm:inline">
                  {tasks.length}
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
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                {[
                  { label: t.totalTasks, value: tasks.length, color: "text-primary", bg: "bg-primary/10" },
                  { label: t.inProgress, value: statusCounts["in-progress"] || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: t.done, value: statusCounts["done"] || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Not Assigned", value: tasks.filter(tk => !tk.assigneeIds || tk.assigneeIds.length === 0).length, color: "text-amber-500", bg: "bg-amber-500/10" },
                  { label: t.membersLabel, value: spaceMembers.length, color: "text-purple-500", bg: "bg-purple-500/10" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{t.completion}</h3>
                  {statusOptions.map((s) => {
                    const count = statusCounts[s] || 0;
                    const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
                    const colors: Record<string, string> = { "todo": "#94a3b8", "in-progress": "#3b82f6", "review": "#f59e0b", "done": "#10b981", "blocked": "#ef4444" };
                    return (
                      <div key={s} className="flex items-center gap-3 mb-2">
                        <span className="text-xs text-muted-foreground w-16 sm:w-20 capitalize">{s.replace("-", " ")}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[s] }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
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
              <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
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
            <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-6xl mx-auto">
              <AnimatePresence>
                {showCreate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-6 overflow-hidden shadow-md"
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
                        placeholder={t.description} rows={2}
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                      />
                      {/* Type selector */}
                      <div className="flex gap-2 flex-wrap">
                        {(["task", "bug", "feature", "improvement"] as TaskType[]).map((tp) => (
                          <button
                            key={tp} type="button"
                            onClick={() => setForm((f) => ({ ...f, type: tp }))}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
                              form.type === tp
                                ? tp === "bug" ? "bg-red-500/10 border-red-500/50 text-red-400"
                                  : tp === "feature" ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                                  : tp === "improvement" ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                                  : "bg-primary/10 border-primary/50 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/30"
                            )}
                          >
                            {tp === "bug" && <Bug className="w-3 h-3" />}
                            {tp.charAt(0).toUpperCase() + tp.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Bug-specific fields */}
                      {form.type === "bug" && (
                        <div className="space-y-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                          <div>
                            <label className="text-xs text-muted-foreground block mb-1">{t.bugSeverity}</label>
                            <div className="flex gap-2 flex-wrap">
                              {(["critical", "high", "medium", "low"] as BugSeverity[]).map((sv) => (
                                <button key={sv} type="button"
                                  onClick={() => setForm((f) => ({ ...f, bugSeverity: sv }))}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                                    form.bugSeverity === sv
                                      ? `${SEVERITY_CONFIG[sv].bg} ${SEVERITY_CONFIG[sv].color} ${SEVERITY_CONFIG[sv].border}`
                                      : "border-border text-muted-foreground hover:border-border"
                                  )}
                                >
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  {SEVERITY_CONFIG[sv].label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            value={form.stepsToReproduce} onChange={(e) => setForm((f) => ({ ...f, stepsToReproduce: e.target.value }))}
                            placeholder="Steps to reproduce..." rows={2}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none resize-none"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <textarea value={form.expectedBehavior} onChange={(e) => setForm((f) => ({ ...f, expectedBehavior: e.target.value }))}
                              placeholder="Expected behavior..." rows={2}
                              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none resize-none" />
                            <textarea value={form.actualBehavior} onChange={(e) => setForm((f) => ({ ...f, actualBehavior: e.target.value }))}
                              placeholder="Actual behavior..." rows={2}
                              className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none resize-none" />
                          </div>
                        </div>
                      )}

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
                                  {(m.displayName || "?")[0].toUpperCase()}
                                </span>
                                {m.displayName || m.email}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      {senders.length > 0 && (
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">{t.senderFrom}</label>
                          <select value={form.senderId} onChange={(e) => setForm((f) => ({ ...f, senderId: e.target.value }))}
                            className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                            <option value="">None</option>
                            {senders.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t.cancel}</button>
                        <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60">
                          {creating ? t.creating : t.createTask}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status filter */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                <button onClick={() => setStatusFilter("all")}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all", statusFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
                  <Filter className="w-3 h-3" /> All ({tasks.length})
                </button>
                {statusOptions.map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={cn("px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all", statusFilter === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground")}>
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

          {/* ─── BUGS ─── */}
          {activeTab === "bugs" && (
            <motion.div key="bugs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-6xl mx-auto">
              {/* Bug stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Total Bugs", value: bugCounts.total, color: "text-red-400", bg: "bg-red-400/10" },
                  { label: "Open", value: bugCounts.open, color: "text-blue-400", bg: "bg-blue-400/10" },
                  { label: "Critical", value: bugCounts.critical, color: "text-red-600", bg: "bg-red-600/10" },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-3 shadow-sm text-center">
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* New Bug button */}
              {isInSpace && (
                <div className="flex justify-end mb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setForm((f) => ({ ...f, type: "bug" })); setActiveTab("tasks"); setShowCreate(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 transition-colors"
                  >
                    <Bug className="w-3.5 h-3.5" /> Report Bug
                  </motion.button>
                </div>
              )}

              {bugs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bug className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No bugs in this space</p>
                  <p className="text-xs mt-1">Report a bug to start tracking issues.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {bugs.map((bug) => {
                    const assigned = bug.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean) as typeof members;
                    const cfg = SEVERITY_CONFIG[bug.bugSeverity || "medium"];
                    return (
                      <motion.div
                        key={bug.id}
                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        onClick={() => navigate(`/spaces/${spaceId}/tasks/${bug.id}`)}
                        className="bg-card border border-border rounded-xl p-3 sm:p-4 cursor-pointer hover:border-primary/30 transition-all group flex items-center gap-3 flex-wrap sm:flex-nowrap"
                      >
                        <Bug className="w-4 h-4 text-red-400 shrink-0" />
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0", cfg.bg, cfg.color, cfg.border)}>
                          <AlertTriangle className="w-3 h-3" />{cfg.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">{bug.title}</p>
                          {assigned.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">{assigned.map((m) => m.displayName || m.email).join(", ")}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <TaskStatusBadge status={bug.status} size="sm" />
                          {bug.deadline && <span className="text-xs text-muted-foreground hidden sm:block">{format(bug.deadline, "MMM d")}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── KANBAN ─── */}
          {activeTab === "kanban" && (
            <motion.div key="kanban" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">Kanban Board</h2>
                <span className="text-xs text-muted-foreground">{tasks.length} total tasks</span>
              </div>
              {tasksLoading ? (
                <div className="flex gap-4 overflow-x-auto">
                  {Array(5).fill(0).map((_, i) => <div key={i} className="w-72 h-64 bg-muted rounded-2xl animate-pulse shrink-0" />)}
                </div>
              ) : (
                <KanbanBoard tasks={tasks} members={members} spaceId={spaceId} />
              )}
            </motion.div>
          )}

          {/* ─── TIMELINE ─── */}
          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-5xl mx-auto">
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
                          className="bg-card border border-border rounded-xl p-3 sm:p-4 cursor-pointer hover:border-primary/30 transition-all group shadow-sm"
                          onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                        >
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className={cn("text-center shrink-0 w-10 sm:w-12", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                              <p className="text-xs font-medium">{task.deadline ? format(task.deadline, "MMM") : ""}</p>
                              <p className="text-lg sm:text-xl font-bold leading-tight">{task.deadline ? format(task.deadline, "d") : ""}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{task.title}</h4>
                                <TaskStatusBadge status={task.status} size="sm" />
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
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
            <motion.div key="members" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-semibold text-foreground">Space Members ({spaceMembers.length})</h2>
              </div>
              {isAdmin && nonSpaceMembers.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mb-5 shadow-sm">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Member</h3>
                  <div className="flex gap-2">
                    <select
                      value={selectedNewMember} onChange={(e) => setSelectedNewMember(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                    >
                      <option value="">Select a member...</option>
                      {nonSpaceMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.displayName || m.email} ({m.email})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddMember} disabled={!selectedNewMember || addingMember}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-colors shrink-0 shadow-sm"
                    >
                      <UserPlus className="w-4 h-4" /><span className="hidden sm:inline">Add</span>
                    </button>
                  </div>
                </div>
              )}
              {spaceMembers.length === 0 ? (
                <EmptyState icon={Users} title="No members yet" description={isAdmin ? "Add members from the section above." : "No members have been added to this space."} />
              ) : (
                <div className="space-y-2">
                  {spaceMembers.map((m) => {
                    const memberTasks = tasks.filter((t) => t.assigneeIds.includes(m.id));
                    const doneTasks = memberTasks.filter((t) => t.status === "done").length;
                    return (
                      <div key={m.id} className="bg-card border border-border rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 shadow-sm">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {(m.displayName || m.email || "?")[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{m.displayName || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                        </div>
                        <div className="text-right shrink-0 hidden sm:block">
                          <p className="text-xs text-muted-foreground">{memberTasks.length} tasks</p>
                          <p className="text-xs text-emerald-500 font-medium">{doneTasks} done</p>
                        </div>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                          m.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>{m.role}</span>
                        {isAdmin && m.role !== "admin" && (
                          <button onClick={() => handleRemoveMember(m.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1 shrink-0" title="Remove from space">
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
            <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
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
              <AnimatePresence>
                {showAddData && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-5 overflow-hidden shadow-md"
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      {dataType === "folder" ? t.createFolder : t.addLink}
                    </h3>
                    <form onSubmit={handleAddData} className="space-y-3">
                      <input value={dataName} onChange={(e) => setDataName(e.target.value)} placeholder={dataType === "folder" ? "Folder name..." : "Link title..."}
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required autoFocus />
                      {dataType === "link" && (
                        <input value={dataUrl} onChange={(e) => setDataUrl(e.target.value)} placeholder="https://... (optional)" type="url"
                          className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      )}
                      <textarea value={dataNotes} onChange={(e) => setDataNotes(e.target.value)} placeholder="Add a note or description..." rows={2}
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                      {dataType === "link" && dataItems.filter((i) => i.type === "folder").length > 0 && (
                        <select value={dataParentId || ""} onChange={(e) => setDataParentId(e.target.value || null)}
                          className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                          <option value="">Root (no folder)</option>
                          {dataItems.filter((i) => i.type === "folder").map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                        </select>
                      )}
                      <div className="flex gap-3 justify-end">
                        <button type="button" onClick={() => { setShowAddData(false); setDataName(""); setDataUrl(""); setDataNotes(""); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t.cancel}</button>
                        <button type="submit" disabled={addingData} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60">
                          {addingData ? t.adding : dataType === "folder" ? t.createFolder : t.addLink}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
              {dataLoading ? (
                <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
              ) : dataItems.length === 0 ? (
                <EmptyState icon={FolderOpen} title="No files or links yet" description={isAdmin ? "Create folders and add links to organize your space resources." : "No files or links have been added yet."} />
              ) : (
                <DataTree items={dataItems} parentId={null} expandedFolders={expandedFolders} onToggleFolder={toggleFolder} isAdmin={isAdmin} onDelete={handleDeleteData} onAddToFolder={(folderId) => { setDataType("link"); setDataParentId(folderId); setShowAddData(true); }} />
              )}
            </motion.div>
          )}

          {/* ─── SUB-SPACES (Visible to all, create admin-only) ─── */}
          {/* ─── CALENDAR VIEW ─── */}
          {activeTab === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6">
              <CalendarView tasks={tasks} spaceId={spaceId} onNavigate={navigate} />
            </motion.div>
          )}

          {/* ─── TABLE VIEW ─── */}
          {activeTab === "table" && (
            <motion.div key="table" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 overflow-x-auto">
              <TableView tasks={tasks} members={members} spaceId={spaceId} onNavigate={navigate} />
            </motion.div>
          )}

          {/* ─── GANTT VIEW ─── */}
          {activeTab === "gantt" && (
            <motion.div key="gantt" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 overflow-x-auto">
              <GanttView tasks={tasks} spaceId={spaceId} onNavigate={navigate} />
            </motion.div>
          )}

          {/* ─── WORKLOAD VIEW ─── */}
          {activeTab === "workload" && (
            <motion.div key="workload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6">
              <WorkloadView tasks={tasks} members={members.filter(m => space?.memberIds?.includes(m.id))} />
            </motion.div>
          )}

          {activeTab === "subspaces" && (
            <motion.div key="subspaces" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 sm:p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Sub-spaces</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{subSpaces.length} sub-spaces inside this space</p>
                </div>
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateSub(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Sub-space
                  </motion.button>
                )}
              </div>

              {/* Create sub-space form */}
              <AnimatePresence>
                {showCreateSub && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-card border border-border rounded-xl p-5 mb-6 overflow-hidden shadow-md"
                  >
                    <h3 className="text-sm font-semibold text-foreground mb-4">Create Sub-space</h3>
                    <form onSubmit={handleCreateSubSpace} className="space-y-4">
                      <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Sub-space name"
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" required autoFocus />
                      <input value={newSubDesc} onChange={(e) => setNewSubDesc(e.target.value)} placeholder="Description (optional)"
                        className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">Color</label>
                        <div className="flex gap-2 flex-wrap">
                          {SPACE_COLORS.map((c) => (
                            <button key={c} type="button" onClick={() => setNewSubColor(c)}
                              className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                              style={{ backgroundColor: c, outline: newSubColor === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={() => setShowCreateSub(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t.cancel}</button>
                        <button type="submit" disabled={creatingSubSpace} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60">
                          {creatingSubSpace ? t.creating : "Create Sub-space"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {subSpaces.length === 0 ? (
                <EmptyState icon={Layers} title="No sub-spaces yet" description="Create sub-spaces to organize this space further." action={{ label: "Create Sub-space", onClick: () => setShowCreateSub(true) }} />
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
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${sub.color || "#6366f1"}20` }}>
                          <Layers className="w-4 h-4" style={{ color: sub.color || "#6366f1" }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{sub.name}</h3>
                          {sub.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sub.description}</p>}
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
          )}

          {/* ─── CHAT ─── */}
          {activeTab === "chat" && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex min-h-0">
              {/* Channels sidebar */}
              <div className="w-44 shrink-0 border-r border-border flex flex-col bg-muted/20">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Channels</span>
                  {isAdmin && (
                    <button onClick={() => setShowCreateChannel(v => !v)} className="text-muted-foreground hover:text-primary transition-colors" title="Add channel">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {showCreateChannel && (
                  <div className="px-2 py-2 border-b border-border space-y-1.5">
                    <input autoFocus value={newChannelName} onChange={e => setNewChannelName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleCreateChannel(); if (e.key === "Escape") setShowCreateChannel(false); }}
                      placeholder="channel-name" className="w-full px-2 py-1 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    <button onClick={handleCreateChannel} disabled={creatingChannel || !newChannelName.trim()}
                      className="w-full py-1 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                      {creatingChannel ? "Creating..." : "Create"}
                    </button>
                  </div>
                )}
                <div className="flex-1 overflow-y-auto py-1">
                  {spaceChannels.map(ch => (
                    <button key={ch.id} onClick={() => setSelectedChannelId(ch.id)}
                      className={cn("w-full text-left px-3 py-1.5 text-xs transition-colors rounded-md mx-1 my-0.5",
                        selectedChannelId === ch.id ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}>
                      # {ch.name}
                    </button>
                  ))}
                  {spaceChannels.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No channels yet</p>
                  )}
                </div>
              </div>
              {/* Chat panel */}
              <div className="flex-1 min-w-0 flex flex-col">
                {selectedChannelId ? (
                  <ChatPanel
                    channelId={selectedChannelId}
                    channelName={spaceChannels.find(c => c.id === selectedChannelId)?.name}
                    spaceId={spaceId}
                    spaceMembers={spaceMembers.map(m => ({ id: m.id, displayName: m.displayName, email: m.email }))}
                    className="flex-1 min-h-0 h-[calc(100vh-12rem)]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-sm">Select a channel to start chatting</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────
function CalendarView({ tasks, spaceId, onNavigate }: { tasks: Task[]; spaceId?: string; onNavigate: (p: string) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const getTasksForDay = (day: number) => {
    const d = new Date(year, month, day);
    return tasks.filter(t => {
      if (!t.deadline) return false;
      const dl = t.deadline;
      return dl.getFullYear() === year && dl.getMonth() === month && dl.getDate() === day;
    });
  };

  const STATUS_COLORS: Record<string, string> = {
    "todo": "bg-muted-foreground/60",
    "in-progress": "bg-blue-400",
    "review": "bg-yellow-400",
    "done": "bg-emerald-500",
    "blocked": "bg-red-500",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-all">← Prev</button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">Today</button>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-all">Next →</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 bg-muted/50">{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`empty-${i}`} className="bg-card min-h-[80px]" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayTasks = getTasksForDay(day);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return (
            <div key={day} className={cn("bg-card min-h-[80px] p-2 border-0", isToday && "bg-primary/5")}>
              <div className={cn("text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full", isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>{day}</div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <div key={task.id} onClick={() => onNavigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                    className={cn("text-[10px] px-1.5 py-0.5 rounded text-white cursor-pointer truncate font-medium", STATUS_COLORS[task.status] || "bg-primary")}>
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────
function TableView({ tasks, members, spaceId, onNavigate }: { tasks: Task[]; members: { id: string; displayName?: string; email?: string }[]; spaceId?: string; onNavigate: (p: string) => void }) {
  const { t } = useLang();
  const [sortField, setSortField] = useState<"title" | "status" | "priority" | "deadline" | "progress">("deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortField === "title")    cmp = a.title.localeCompare(b.title);
    if (sortField === "status")   cmp = a.status.localeCompare(b.status);
    if (sortField === "priority") cmp = a.priority.localeCompare(b.priority);
    if (sortField === "deadline") cmp = (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0);
    if (sortField === "progress") cmp = a.progress - b.progress;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortBtn = ({ field, label }: { field: typeof sortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}{sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  const PRIORITY_COLORS: Record<string, string> = { low: "text-blue-400", medium: "text-yellow-400", high: "text-orange-400", urgent: "text-red-500" };
  const STATUS_COLORS: Record<string, string> = { "todo": "text-muted-foreground", "in-progress": "text-blue-400", "review": "text-yellow-400", "done": "text-emerald-500", "blocked": "text-red-500" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">{t.tableView}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length} tasks</span>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs font-semibold text-muted-foreground border-b border-border">
              <th className="text-start px-4 py-2.5"><SortBtn field="title" label="Title" /></th>
              <th className="text-start px-3 py-2.5 hidden sm:table-cell"><SortBtn field="status" label="Status" /></th>
              <th className="text-start px-3 py-2.5 hidden md:table-cell"><SortBtn field="priority" label="Priority" /></th>
              <th className="text-start px-3 py-2.5 hidden md:table-cell"><SortBtn field="deadline" label="Deadline" /></th>
              <th className="text-start px-3 py-2.5 hidden lg:table-cell">Assignees</th>
              <th className="text-start px-3 py-2.5 hidden lg:table-cell"><SortBtn field="progress" label="%" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map(task => {
              const assignees = task.assigneeIds.map(id => members.find(m => m.id === id)).filter(Boolean) as { id: string; displayName?: string; email?: string }[];
              return (
                <tr key={task.id} onClick={() => onNavigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                  className="hover:bg-muted/30 cursor-pointer transition-colors group">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-foreground group-hover:text-primary truncate max-w-[200px] transition-colors">{task.title}</p>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className={cn("text-xs font-medium capitalize", STATUS_COLORS[task.status])}>{task.status.replace("-", " ")}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span className={cn("text-xs font-medium capitalize", PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-xs text-muted-foreground">
                    {task.deadline ? format(task.deadline, "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <div className="flex -space-x-1.5">
                      {assignees.slice(0, 3).map(m => (
                        <div key={m.id} className="w-5 h-5 rounded-full bg-primary/30 border border-card flex items-center justify-center text-[9px] font-bold text-primary">
                          {(m.displayName || m.email || "U")[0].toUpperCase()}
                        </div>
                      ))}
                      {assignees.length > 3 && <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[9px] text-muted-foreground">+{assignees.length - 3}</div>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Gantt View ───────────────────────────────────────────────────────────────
function GanttView({ tasks, spaceId, onNavigate }: { tasks: Task[]; spaceId?: string; onNavigate: (p: string) => void }) {
  const tasksWithDates = tasks.filter(t => t.deadline).sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0));
  if (tasksWithDates.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
      <Layers className="w-12 h-12 opacity-20 mb-3" /><p className="font-semibold">No tasks with deadlines</p>
    </div>
  );

  const minDate = tasksWithDates[0].startDate || tasksWithDates[0].createdAt;
  const maxDate = tasksWithDates[tasksWithDates.length - 1].deadline!;
  const totalDays = Math.max(1, differenceInDays(maxDate, minDate) + 7);
  const today = new Date();

  const STATUS_COLORS: Record<string, string> = {
    "todo": "#6b7280", "in-progress": "#3b82f6", "review": "#f59e0b",
    "done": "#10b981", "blocked": "#ef4444",
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">Gantt Chart</h2>
      <div className="min-w-[600px]">
        {tasksWithDates.map(task => {
          const start = task.startDate || task.createdAt;
          const end = task.deadline!;
          const startOffset = Math.max(0, differenceInDays(start, minDate));
          const duration = Math.max(1, differenceInDays(end, start));
          const leftPct = (startOffset / totalDays) * 100;
          const widthPct = (duration / totalDays) * 100;
          const isOverdue = end < today && task.status !== "done";
          const color = isOverdue ? "#ef4444" : STATUS_COLORS[task.status] || "#6366f1";

          return (
            <div key={task.id} className="flex items-center gap-3 mb-2 group cursor-pointer" onClick={() => onNavigate(`/spaces/${spaceId}/tasks/${task.id}`)}>
              <div className="w-40 shrink-0 text-xs text-foreground font-medium truncate group-hover:text-primary transition-colors">{task.title}</div>
              <div className="flex-1 h-7 relative bg-muted/50 rounded-lg overflow-hidden">
                <div className="absolute h-full rounded-lg transition-all flex items-center px-2 overflow-hidden" style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: color + "30", borderLeft: `3px solid ${color}` }}>
                  <span className="text-[10px] font-semibold truncate" style={{ color }}>{task.progress}%</span>
                </div>
                {/* Today marker */}
                {today >= minDate && today <= maxDate && (
                  <div className="absolute h-full w-0.5 bg-primary/60" style={{ left: `${(differenceInDays(today, minDate) / totalDays) * 100}%` }} />
                )}
              </div>
              <div className="w-16 text-xs text-muted-foreground shrink-0">{format(end, "MMM d")}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Workload View ────────────────────────────────────────────────────────────
function WorkloadView({ tasks, members }: { tasks: Task[]; members: { id: string; displayName?: string; email?: string }[] }) {
  const capacityPerDay = 8;
  const workDaysInMonth = 22;
  const totalCapacity = capacityPerDay * workDaysInMonth;

  const getMemberLoad = (memberId: string) => {
    const memberTasks = tasks.filter(t => t.assigneeIds.includes(memberId) && t.status !== "done");
    const totalHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0);
    return { totalHours, taskCount: memberTasks.length, tasks: memberTasks };
  };

  const getHealthStatus = (hours: number) => {
    if (hours > totalCapacity * 1.2) return { label: "Overloaded", color: "text-red-500", bg: "bg-red-500" };
    if (hours > totalCapacity * 0.8) return { label: "Balanced", color: "text-emerald-500", bg: "bg-emerald-500" };
    return { label: "Underloaded", color: "text-blue-400", bg: "bg-blue-400" };
  };

  const showMembers = members.length > 0 ? members : [];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">Workload</h2>
        <span className="text-xs text-muted-foreground">Capacity: {totalCapacity}h/month ({capacityPerDay}h/day)</span>
      </div>
      {showMembers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">No members assigned to this space</div>
      ) : (
        <div className="space-y-4">
          {showMembers.map(member => {
            const { totalHours, taskCount, tasks: memberTasks } = getMemberLoad(member.id);
            const pct = Math.min(100, Math.round((totalHours / totalCapacity) * 100));
            const health = getHealthStatus(totalHours);
            return (
              <div key={member.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {(member.displayName || member.email || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{member.displayName || member.email}</p>
                    <p className="text-xs text-muted-foreground">{taskCount} active tasks · {totalHours}h estimated</p>
                  </div>
                  <span className={cn("text-xs font-semibold", health.color)}>{health.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", health.bg)} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground w-8 text-end">{pct}%</span>
                </div>
                {memberTasks.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {memberTasks.slice(0, 5).map(t => (
                      <span key={t.id} className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full truncate max-w-[120px]">{t.title}</span>
                    ))}
                    {memberTasks.length > 5 && <span className="text-[10px] text-muted-foreground">+{memberTasks.length - 5} more</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DataTree({
  items, parentId, expandedFolders, onToggleFolder, isAdmin, onDelete, onAddToFolder, depth = 0,
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
              <div className="bg-card border border-border rounded-xl hover:border-primary/30 transition-all group p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block">
                      {item.name}
                      <ExternalLink className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-70 transition-opacity" />
                    </a>
                    {item.url && <p className="text-xs text-muted-foreground truncate">{item.url}</p>}
                    {item.notes && <p className="text-xs text-muted-foreground mt-1 bg-muted rounded-lg px-2 py-1">{item.notes}</p>}
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
