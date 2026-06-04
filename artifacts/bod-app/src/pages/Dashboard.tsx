import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { useLocation } from "wouter";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  UserCheck,
  RefreshCw,
  MessageSquare,
  Search,
  Bug,
  BarChart2,
  Users,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useQueryClient } from "@tanstack/react-query";
import { useAllTasksQuery } from "@/hooks/useTaskQueries";
import { useMembers } from "@/hooks/useMembers";
import { DashboardStatSkeleton } from "@/components/shared/SkeletonLoader";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useDashboard,
  useReassignTask,
  dashboardKeys,
} from "@/hooks/useDashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/date";

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  "in-progress": "#3b82f6",
  review: "#f59e0b",
  done: "#10b981",
  blocked: "#ef4444",
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  }),
};

type DashView = "overview" | "kanban";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { members } = useMembers();
  const [, navigate] = useLocation();
  const { t, lang } = useLang();
  const { isAdmin } = useAuth();
  const [view, setView] = useState<DashView>("overview");
  const [perfSpaceId, setPerfSpaceId] = useState("all");

  const { data, isLoading } = useDashboard(perfSpaceId);
  const reassignMutation = useReassignTask();

  // Kanban only loads when that view is active
  const { data: allTasks = [] } = useAllTasksQuery();

  const [reassigning, setReassigning] = useState<string | null>(null);
  const [reassignTarget, setReassignTarget] = useState<Record<string, string>>(
    {},
  );
  const [reassignReason, setReassignReason] = useState<Record<string, string>>(
    {},
  );
  const [reassignDeadline, setReassignDeadline] = useState<
    Record<string, string>
  >({});
  const [memberSearch, setMemberSearch] = useState<Record<string, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});

  const stats = data?.stats;
  const statusBreakdown = data?.statusBreakdown ?? [];
  const upcoming = data?.upcoming ?? [];
  const overdue = data?.overdue ?? [];
  const recent = data?.recent ?? [];
  const spaces = data?.spaces ?? [];
  const memberPerformance = data?.memberPerformance ?? [];
  const memberPieData = memberPerformance.map((m) => ({
    name: m.name,
    value: m.total,
    color: m.color,
  }));

  const statCards = stats
    ? [
        {
          label: t.totalTasks,
          value: stats.total,
          icon: TrendingUp,
          color: "text-primary",
          bg: "bg-primary/10",
        },
        {
          label: t.inProgress,
          value: stats.inProgress,
          icon: Clock,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        },
        {
          label: t.completed,
          value: stats.done,
          icon: CheckCircle2,
          color: "text-emerald-500",
          bg: "bg-emerald-500/10",
        },
        {
          label: t.blocked,
          value: stats.blocked,
          icon: AlertCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
        },
        {
          label: t.notAssigned,
          value: stats.unassigned,
          icon: Users,
          color: "text-amber-500",
          bg: "bg-amber-500/10",
        },
        ...(isAdmin
          ? [
              {
                label: t.bugs,
                value: stats.bugs,
                icon: Bug,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
            ]
          : []),
      ]
    : [];

  const handleReassign = async (taskId: string) => {
    const newAssigneeId = reassignTarget[taskId];
    if (!newAssigneeId) return;

    const newAssigneeMember = members.find((m) => m.id === newAssigneeId);
    const reason = (reassignReason[taskId] || "").trim() || undefined;
    const newDeadline = reassignDeadline[taskId] || undefined;

    setReassigning(taskId);
    try {
      await reassignMutation.mutateAsync({
        taskId,
        payload: { assigneeId: newAssigneeId, reason, newDeadline },
      });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all() });
      toast.success(
        `Task reassigned to ${newAssigneeMember?.displayName || "member"}`,
      );
      setReassignTarget((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setReassignReason((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setReassignDeadline((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setMemberSearch((prev) => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
    } catch {
      toast.error("Failed to reassign");
    } finally {
      setReassigning(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header + view switcher */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t.dashboard}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t.completion}</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          <button
            onClick={() => setView("overview")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              view === "overview"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {t.overview}
          </button>
          <button
            onClick={() => setView("kanban")}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              view === "kanban"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground",
            )}
          >
            {t.kanban}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {isLoading
          ? Array(5)
              .fill(0)
              .map((_, i) => <DashboardStatSkeleton key={i} />)
          : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">
                    {card.label}
                  </span>
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}
                  >
                    <card.icon
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`}
                    />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {card.value}
                </p>
              </motion.div>
            ))}
      </div>

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            All Tasks — Kanban
          </h3>
          <KanbanBoard tasks={allTasks} members={members} />
        </motion.div>
      )}

      {/* OVERVIEW */}
      {view === "overview" && (
        <>
          <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Status chart */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">
                {t.tasksTab}
              </h3>
              {statusBreakdown.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusBreakdown.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={STATUS_COLORS[entry.key]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {statusBreakdown.map((s) => (
                      <div
                        key={s.key}
                        className="flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[s.key] }}
                          />
                          <span className="text-muted-foreground">
                            {s.name}
                          </span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {s.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
                  <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
                  {t.noTasksYet}
                </div>
              )}
            </motion.div>

            {/* Upcoming deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t.upcomingDeadlines}
                </h3>
                <Calendar className="w-4 h-4 text-muted-foreground" />
              </div>
              {upcoming.length > 0 ? (
                <div className="space-y-2">
                  {upcoming.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() =>
                        navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)
                      }
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <TaskStatusBadge status={task.status} size="sm" />
                        <span className="text-xs text-foreground truncate">
                          {task.title}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {task.deadline &&
                          format(new Date(task.deadline), "MMM d")}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <Calendar className="w-7 h-7 mb-2 opacity-30" />
                  {t.noUpcomingDeadlines}
                </div>
              )}
            </motion.div>

            {/* Spaces summary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {t.spaces}
                </h3>
                <button
                  onClick={() => navigate("/spaces")}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {t.viewAllSpaces}
                </button>
              </div>
              {spaces.length > 0 ? (
                <div className="space-y-2">
                  {spaces.slice(0, 5).map((space) => (
                    <div
                      key={space.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/spaces/${space.id}`)}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: space.color || "#6366f1" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {space.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${space.completionRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {space.completionRate}%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {space.taskCount} {t.tasks}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <Layers className="w-7 h-7 mb-2 opacity-30" />
                  {t.noSpacesFound}
                </div>
              )}
            </motion.div>
          </div>

          {/* OVERDUE TASKS */}
          {overdue.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="mt-5 sm:mt-6 bg-card border border-red-200 dark:border-red-900/30 rounded-xl p-4 sm:p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Overdue Tasks
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {overdue.length} tasks past deadline — review & reassign
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                {overdue.slice(0, 10).map((task) => {
                  const assigned = (task.assigneeIds ?? [])
                    .map(
                      (id) =>
                        members.find((m) => m.id === id)?.displayName || "",
                    )
                    .filter(Boolean);
                  const spaceName =
                    spaces.find((s) => s.id === task.spaceId)?.name || "";
                  const hasTarget = !!reassignTarget[task.id];
                  return (
                    <div
                      key={task.id}
                      className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 space-y-3"
                    >
                      <div className="flex items-start gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className="text-sm font-medium text-foreground cursor-pointer hover:text-primary"
                              onClick={() =>
                                navigate(
                                  `/spaces/${task.spaceId}/tasks/${task.id}`,
                                )
                              }
                            >
                              {task.title}
                            </span>
                            {task.priority && (
                              <TaskPriorityBadge
                                priority={task.priority}
                                size="sm"
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {spaceName && (
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                {spaceName}
                              </span>
                            )}
                            {assigned.length > 0 && (
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                {assigned.join(", ")}
                              </span>
                            )}
                            {task.deadline && (
                              <span className="text-red-500 font-medium">
                                Due {format(new Date(task.deadline), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() =>
                                setDropdownOpen((prev) => ({
                                  ...prev,
                                  [task.id]: !prev[task.id],
                                }))
                              }
                              className="w-full text-left text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 flex items-center justify-between gap-2"
                            >
                              <span
                                className={
                                  reassignTarget[task.id]
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {reassignTarget[task.id]
                                  ? members.find(
                                      (m) => m.id === reassignTarget[task.id],
                                    )?.displayName ||
                                    members.find(
                                      (m) => m.id === reassignTarget[task.id],
                                    )?.email ||
                                    "Member"
                                  : "Reassign to..."}
                              </span>
                              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
                            </button>
                            {dropdownOpen[task.id] && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                                <div className="p-2 border-b border-border">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
                                    <input
                                      autoFocus
                                      type="text"
                                      value={memberSearch[task.id] || ""}
                                      onChange={(e) =>
                                        setMemberSearch((prev) => ({
                                          ...prev,
                                          [task.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Search by name..."
                                      className="w-full text-xs pl-6 pr-2 py-1.5 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                  {(() => {
                                    const q = (
                                      memberSearch[task.id] || ""
                                    ).toLowerCase();
                                    const filtered = q
                                      ? members.filter((m) =>
                                          (m.displayName || m.email || "")
                                            .toLowerCase()
                                            .includes(q),
                                        )
                                      : members;
                                    return filtered.length > 0 ? (
                                      filtered.map((m) => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          onClick={() => {
                                            setReassignTarget((prev) => ({
                                              ...prev,
                                              [task.id]: m.id,
                                            }));
                                            setDropdownOpen((prev) => ({
                                              ...prev,
                                              [task.id]: false,
                                            }));
                                            setMemberSearch((prev) => ({
                                              ...prev,
                                              [task.id]: "",
                                            }));
                                          }}
                                          className={`w-full text-left text-xs px-3 py-2 hover:bg-muted transition-colors ${reassignTarget[task.id] === m.id ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                                        >
                                          {m.displayName || m.email}
                                        </button>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground text-center py-3">
                                        No members found
                                      </p>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleReassign(task.id)}
                            disabled={!hasTarget || reassigning === task.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                            {reassigning === task.id ? "..." : "Assign"}
                          </button>
                        </div>
                        {hasTarget && (
                          <>
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-2 shrink-0" />
                              <textarea
                                value={reassignReason[task.id] || ""}
                                onChange={(e) =>
                                  setReassignReason((prev) => ({
                                    ...prev,
                                    [task.id]: e.target.value,
                                  }))
                                }
                                placeholder="Reason for reassigning... (optional)"
                                rows={2}
                                className="flex-1 text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <div className="flex-1 flex items-center gap-2">
                                <label className="text-xs text-muted-foreground shrink-0">
                                  New deadline
                                </label>
                                <input
                                  type="date"
                                  value={reassignDeadline[task.id] || ""}
                                  onChange={(e) =>
                                    setReassignDeadline((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  className="flex-1 text-xs px-2.5 py-1.5 bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
                                />
                                {reassignDeadline[task.id] && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setReassignDeadline((prev) => {
                                        const n = { ...prev };
                                        delete n[task.id];
                                        return n;
                                      })
                                    }
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {overdue.length > 10 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{overdue.length - 10} more overdue tasks
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Recent tasks */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-5 sm:mt-6 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                {t.tasksTab}
              </h3>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="h-10 bg-muted rounded-lg animate-pulse"
                    />
                  ))}
              </div>
            ) : recent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-125">
                  <thead>
                    <tr className="border-b border-border">
                      {[
                        t.tasksTab,
                        "Type",
                        t.status,
                        t.priority,
                        t.assignMembers,
                        t.deadline,
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-start text-xs font-semibold text-muted-foreground pb-2.5 pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recent.map((task) => {
                      const assigned = (task.assigneeIds ?? [])
                        .map(
                          (id) =>
                            members.find((m) => m.id === id)?.displayName || "",
                        )
                        .filter(Boolean);
                      return (
                        <tr
                          key={task.id}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() =>
                            navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)
                          }
                        >
                          <td className="py-2.5 pr-4">
                            <span className="font-medium text-foreground line-clamp-1">
                              {task.title}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                task.type === "bug"
                                  ? "bg-red-500/10 text-red-500"
                                  : task.type === "feature"
                                    ? "bg-purple-500/10 text-purple-500"
                                    : task.type === "improvement"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : "bg-muted text-muted-foreground",
                              )}
                            >
                              {task.type === "bug" && (
                                <Bug className="w-3 h-3" />
                              )}
                              {task.type}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <TaskStatusBadge status={task.status} size="sm" />
                          </td>
                          <td className="py-2.5 pr-4">
                            {task.priority && (
                              <TaskPriorityBadge
                                priority={task.priority}
                                size="sm"
                              />
                            )}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs text-muted-foreground">
                              {assigned.slice(0, 2).join(", ") || "—"}
                            </span>
                          </td>
                          <td className="py-2.5 text-xs text-muted-foreground">
                            {task.deadline
                              ? formatDate(task.deadline, "MMMMMM d, yyyy", lang)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t.noTasksYet}
              </p>
            )}
          </motion.div>

          {/* ADMIN: TEAM PERFORMANCE */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-5 sm:mt-6"
            >
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {t.teamPerformance}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {t.employeeStats}
                    </p>
                  </div>
                </div>
                <Select value={perfSpaceId} onValueChange={setPerfSpaceId}>
                  <SelectTrigger className="w-36 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Spaces</SelectItem>
                    {spaces.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {memberPerformance.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  No task data for this space
                </div>
              )}

              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    {t.tasksByMember}
                  </h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={memberPerformance}
                      margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 11,
                          fill: "var(--color-muted-foreground)",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "var(--color-muted-foreground)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                        cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                      />
                      <Bar
                        dataKey="todo"
                        name={t.todo}
                        stackId="a"
                        fill={STATUS_COLORS.todo}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="inProgress"
                        name={t.inProgress}
                        stackId="a"
                        fill={STATUS_COLORS["in-progress"]}
                      />
                      <Bar
                        dataKey="review"
                        name={t.review}
                        stackId="a"
                        fill={STATUS_COLORS.review}
                      />
                      <Bar
                        dataKey="blocked"
                        name={t.blocked}
                        stackId="a"
                        fill={STATUS_COLORS.blocked}
                      />
                      <Bar
                        dataKey="done"
                        name={t.done}
                        stackId="a"
                        fill={STATUS_COLORS.done}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      {t.taskDistribution}
                    </h4>
                    <ResponsiveContainer width="100%" height={130}>
                      <PieChart>
                        <Pie
                          data={memberPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={55}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {memberPieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                      {memberPieData.map((m) => (
                        <div
                          key={m.name}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: m.color }}
                            />
                            <span className="text-muted-foreground truncate">
                              {m.name}
                            </span>
                          </div>
                          <span className="font-semibold text-foreground">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {t.completionRate}
                      </h4>
                    </div>
                    <div className="space-y-2.5">
                      {memberPerformance.slice(0, 6).map((m) => (
                        <div key={m.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground font-medium truncate flex-1">
                              {m.name}
                            </span>
                            <span className="text-xs font-bold text-emerald-500 shrink-0 ml-2">
                              {m.completionRate}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${m.completionRate}%`,
                                backgroundColor:
                                  m.completionRate >= 70
                                    ? "#10b981"
                                    : m.completionRate >= 40
                                      ? "#f59e0b"
                                      : "#ef4444",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
