import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Bug, Plus, AlertTriangle, CheckCircle2, Clock, XCircle,
  Filter, Layers, UserCheck, Calendar, X, Search,
} from "lucide-react";
import { useAllTasksQuery, useCreateTask } from "@/hooks/useTaskQueries";
import { useSpaces, useSpaceMembers } from "@/hooks/useSpaces";
import { useMembers } from "@/hooks/useMembers";
import { useSenders } from "@/hooks/useSenders";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { TaskStatus, TaskPriority, BugSeverity } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { priorityOptions, statusOptions, severityOptions } from "@/config/status-config";

const SEVERITY_CONFIG: Record<BugSeverity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium: { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  low: { label: "Low", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
};

function SeverityBadge({ severity }: { severity?: BugSeverity }) {
  const cfg = SEVERITY_CONFIG[severity || "medium"];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", cfg.bg, cfg.color, cfg.border)}>
      <AlertTriangle className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function Bugs() {
  const { data: tasks = [], isLoading: loading } = useAllTasksQuery({ type: "bug" });
  const createBug = useCreateTask();
  const { data: spaces = [] } = useSpaces();
  const { members } = useMembers();
  const { senders } = useSenders();
  const { isAdmin } = useAuth();
  const { t } = useLang();
  const [, navigate] = useLocation();

  const [severityFilter, setSeverityFilter] = useState<BugSeverity | "all">("all");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [spaceFilter, setSpaceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    expectedBehavior: "",
    actualBehavior: "",
    status: "todo" as TaskStatus,
    priority: "high" as TaskPriority,
    bugSeverity: "medium" as BugSeverity,
    deadline: "",
    assigneeIds: [] as string[],
    senderId: "",
    spaceId: "",
    estimatedHours: 0,
    progress: 0,
  });

  const stats = useMemo(() => {
    const total = tasks.length;
    const open = tasks.filter((b) => b.status === "todo").length;
    const inProgress = tasks.filter((b) => b.status === "in-progress").length;
    const resolved = tasks.filter((b) => b.status === "done").length;
    const critical = tasks.filter((b) => b.bugSeverity === "critical").length;
    const blocked = tasks.filter((b) => b.status === "blocked").length;
    return { total, open, inProgress, resolved, critical, blocked };
  }, [tasks]);

  const filtered = useMemo(() => {
    let result = tasks;
    if (severityFilter !== "all") result = result.filter((b) => b.bugSeverity === severityFilter);
    if (statusFilter !== "all") result = result.filter((b) => b.status === statusFilter);
    if (spaceFilter !== "all") result = result.filter((b) => b.spaceId === spaceFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((b) => b.title.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, severityFilter, statusFilter, spaceFilter, searchQuery]);

  const { data: spaceMembers = [] } = useSpaceMembers(form.spaceId || undefined);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.spaceId) return;
    createBug.mutate({
      ...form,
      type: "bug",
      deadline: form.deadline || null,
    }, {
      onSuccess: () => {
        toast.success("Bug reported successfully");
        setShowCreate(false);
        setForm({
          title: "", description: "", stepsToReproduce: "", expectedBehavior: "", actualBehavior: "",
          status: "todo", priority: "high", bugSeverity: "medium", deadline: "",
          assigneeIds: [], senderId: "", spaceId: "", estimatedHours: 0, progress: 0,
        });
      },
      onError: () => toast.error("Failed to report bug"),
    });
  };

  const statCards = [
    { label: "Total Bugs", value: stats.total, icon: Bug, color: "text-primary", bg: "bg-primary/10" },
    { label: "Open", value: stats.open, icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "In Progress", value: stats.inProgress, icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Critical", value: stats.critical, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
    { label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Bug className="w-4 h-4 text-red-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.bugTracker}</h1>
          </div>
          <p className="text-sm text-muted-foreground">Track and resolve bugs across all spaces</p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t.newBug}
          </motion.button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Create Bug Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Bug className="w-4 h-4 text-red-500" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">Report a Bug</h2>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Bug title..." required autoFocus
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-all"
                />
                <textarea
                  value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the bug..." rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                />

                {/* Bug-specific fields */}
                <textarea
                  value={form.stepsToReproduce} onChange={(e) => setForm((f) => ({ ...f, stepsToReproduce: e.target.value }))}
                  placeholder="Steps to reproduce: 1. Go to... 2. Click on... 3. See error" rows={3}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <textarea
                    value={form.expectedBehavior} onChange={(e) => setForm((f) => ({ ...f, expectedBehavior: e.target.value }))}
                    placeholder="Expected behavior..." rows={2}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                  />
                  <textarea
                    value={form.actualBehavior} onChange={(e) => setForm((f) => ({ ...f, actualBehavior: e.target.value }))}
                    placeholder="Actual behavior..." rows={2}
                    className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t.bugSeverity}</label>
                    <Select value={form.bugSeverity} onValueChange={(v) => setForm((f) => ({ ...f, bugSeverity: v as BugSeverity }))}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {severityOptions.map((s) => <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t.priority}</label>
                    <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t.status}</label>
                    <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t.deadline}</label>
                    <input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Space</label>
                  <Select value={form.spaceId} onValueChange={(v) => setForm((f) => ({ ...f, spaceId: v, assigneeIds: [] }))}>
                    <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select a space..." /></SelectTrigger>
                    <SelectContent>
                      {spaces.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {form.spaceId && spaceMembers.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5">{t.assignMembers}</label>
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
                              ? "bg-red-500/10 border-red-500/50 text-red-400"
                              : "border-border text-muted-foreground hover:border-red-500/30"
                          )}
                        >
                          <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {(m.displayName || "?")[0].toUpperCase()}
                          </span>
                          {m.displayName || m.email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {senders.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t.senderFrom}</label>
                    <Select value={form.senderId} onValueChange={(v) => setForm((f) => ({ ...f, senderId: v }))}>
                      <SelectTrigger className="w-full text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {senders.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{t.cancel}</button>
                  <button type="submit" disabled={createBug.isPending || !form.spaceId}
                    className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-60 transition-colors">
                    {createBug.isPending ? "Reporting..." : "Report Bug"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-5 shadow-sm space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bugs..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Severity:</span>
          </div>
          {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
            <button
              key={s} onClick={() => setSeverityFilter(s)}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                severityFilter === s
                  ? s === "all" ? "bg-primary text-primary-foreground" : `${SEVERITY_CONFIG[s as BugSeverity]?.bg} ${SEVERITY_CONFIG[s as BugSeverity]?.color} border ${SEVERITY_CONFIG[s as BugSeverity]?.border}`
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : SEVERITY_CONFIG[s as BugSeverity].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">Status:</span>
          </div>
          {(["all", "todo", "in-progress", "review", "done", "blocked"] as const).map((s) => (
            <button
              key={s} onClick={() => setStatusFilter(s as TaskStatus | "all")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "All" : s.replace("-", " ")}
            </button>
          ))}
        </div>

        {spaces.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground font-medium self-center">Space:</span>
            <button
              onClick={() => setSpaceFilter("all")}
              className={cn("px-3 py-1 text-xs font-medium rounded-lg transition-all", spaceFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
            >All</button>
            {spaces.map((space) => (
              <button
                key={space.id} onClick={() => setSpaceFilter(space.id)}
                className={cn("px-3 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5", spaceFilter === space.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: space.color || "#6366f1" }} />
                {space.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bug list */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bug className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">{tasks.length === 0 ? t.noBugsYet : "No bugs match your filters"}</p>
          <p className="text-xs mt-1">{tasks.length === 0 ? t.noBugsDesc : "Try adjusting the filters above."}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((bug, i) => {
            const space = spaces.find((s) => s.id === bug.spaceId);
            const assigned = bug.assigneeIds.map((id) => members.find((m) => m.id === id)).filter(Boolean) as typeof members;
            return (
              <motion.div
                key={bug.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/spaces/${bug.spaceId}/tasks/${bug.id}`)}
                className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <Bug className="w-4 h-4 text-red-400 shrink-0" />
                    <SeverityBadge severity={bug.bugSeverity ?? undefined} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{bug.title}</h3>
                    {bug.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{bug.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {space && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: space.color || "#6366f1" }} />
                          {space.name}
                        </span>
                      )}
                      {assigned.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <UserCheck className="w-3 h-3" />
                          {assigned.map((m) => m.displayName || m.email).join(", ")}
                        </span>
                      )}
                      {bug.deadline && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(bug.deadline), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <TaskStatusBadge status={bug.status} size="sm" />
                    {bug.status === "done" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
