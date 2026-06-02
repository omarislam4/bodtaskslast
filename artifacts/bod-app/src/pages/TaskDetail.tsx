import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  Activity,
  Loader2,
  MessageSquare,
  Trash2,
  Plus,
  X,
  Timer,
  Eye,
  EyeOff,
  Repeat,
  ChevronDown,
  GitBranch,
  Star,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useMembers } from "@/hooks/useMembers";
import { useSenders } from "@/hooks/useSenders";
import { useSpaces, useSpaceMembers } from "@/hooks/useSpaces";
import {
  useTaskQuery,
  useUpdateTask,
  useDeleteTask,
  useAddComment,
  useSendReminder,
  useAddChecklistItem,
  useUpdateChecklistItem,
  useDeleteChecklistItem,
  useAddSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useAddTimeEntry,
  useDeleteTimeEntry,
  useAddDependency,
  useDeleteDependency,
  useAddTag,
  useDeleteTag,
  useAddWatcher,
  useRemoveWatcher,
  useAllTasksQuery,
} from "@/hooks/useTaskQueries";
import type {
  TaskStatus,
  TaskPriority,
  DependencyType,
  RecurrenceFrequency,
} from "@/types";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import {
  TaskPriorityBadge,
  priorityOptions,
} from "@/components/tasks/TaskPriorityBadge";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { taskStatusConfig } from "@/config/status-config";

const DEP_TYPE_CONFIG: Record<
  DependencyType,
  { label: string; color: string }
> = {
  blocking: { label: "Blocking", color: "text-red-500" },
  blocked_by: { label: "Blocked By", color: "text-orange-400" },
  related: { label: "Related", color: "text-blue-400" },
  duplicate: { label: "Duplicate", color: "text-muted-foreground" },
};

export default function TaskDetail() {
  const { spaceId, taskId } = useParams<{ spaceId: string; taskId: string }>();
  const { isAdmin, userDoc } = useAuth();
  const { t } = useLang();
  const { members } = useMembers();
  const { senders } = useSenders();
  const { data: spaces = [] } = useSpaces();
  const { data: allTasks = [] } = useAllTasksQuery();
  const [, navigate] = useLocation();
  const editTitleRef = useRef<HTMLHeadingElement>(null);
  const statusConfig = taskStatusConfig(t);

  const { data: task, isLoading } = useTaskQuery(taskId ?? "");
  const { data: spaceMembers = [] } = useSpaceMembers(spaceId);

  // Mutations
  const updateTask = useUpdateTask(taskId ?? "");
  const deleteTask = useDeleteTask();
  const addComment = useAddComment(taskId ?? "");
  const sendReminder = useSendReminder(taskId ?? "");
  const addChecklistItem = useAddChecklistItem(taskId ?? "");
  const updateChecklistItem = useUpdateChecklistItem(taskId ?? "");
  const deleteChecklistItem = useDeleteChecklistItem(taskId ?? "");
  const addSubtask = useAddSubtask(taskId ?? "");
  const updateSubtask = useUpdateSubtask(taskId ?? "");
  const deleteSubtask = useDeleteSubtask(taskId ?? "");
  const addTimeEntry = useAddTimeEntry(taskId ?? "");
  const deleteTimeEntry = useDeleteTimeEntry(taskId ?? "");
  const addDependency = useAddDependency(taskId ?? "");
  const deleteDependency = useDeleteDependency(taskId ?? "");
  const addTag = useAddTag(taskId ?? "");
  const deleteTag = useDeleteTag(taskId ?? "");
  const addWatcher = useAddWatcher(taskId ?? "");
  const removeWatcher = useRemoveWatcher(taskId ?? "");

  // Comment state
  const [newComment, setNewComment] = useState("");
  const [commentMentionQuery, setCommentMentionQuery] = useState<string | null>(
    null,
  );

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [timerElapsed, setTimerElapsed] = useState(0);

  // Progress local state (smooth slider interaction)
  const [progressLocal, setProgressLocal] = useState(0);
  useEffect(() => {
    if (task) setProgressLocal(task.progress);
  }, [task?.progress]);

  // Subtask state
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Checklist state
  const [showChecklistInput, setShowChecklistInput] = useState(false);
  const [newChecklistText, setNewChecklistText] = useState("");

  // Time entry state
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [timeHours, setTimeHours] = useState(0);
  const [timeMins, setTimeMins] = useState(0);
  const [timeNote, setTimeNote] = useState("");
  const [timeBillable, setTimeBillable] = useState(false);

  // Dependency state
  const [showDepForm, setShowDepForm] = useState(false);
  const [depTaskId, setDepTaskId] = useState("");
  const [depType, setDepType] = useState<DependencyType>("related");

  // Tag state
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  // Recurrence
  const [showRecurrence, setShowRecurrence] = useState(false);

  const space = spaces.find((s) => s.id === spaceId);

  // Timer interval
  useEffect(() => {
    if (!timerRunning || timerStartTime === null) return;
    const interval = setInterval(
      () => setTimerElapsed(Math.floor((Date.now() - timerStartTime) / 1000)),
      1000,
    );
    return () => clearInterval(interval);
  }, [timerRunning, timerStartTime]);

  const handleDeleteTask = () => {
    if (!taskId || !confirm(t.deleteTask + "?")) return;
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        toast.success(t.deleteTask);
        navigate(`/spaces/${spaceId}`);
      },
      onError: () => toast.error(t.errDeleteTask),
    });
  };

  const handleSendReminder = () => {
    if (!task) return;
    sendReminder.mutate(
      { target: "assignees" },
      {
        onSuccess: () => toast.success(`${t.sendReminder}`),
      },
    );
  };

  const parseMentionIds = (txt: string): string[] => {
    const regex = /@(\S+)/g;
    const ids: string[] = [];
    let m;
    while ((m = regex.exec(txt)) !== null) {
      const q = m[1].toLowerCase().replace(/[.,!?]+$/, "");
      const found = spaceMembers.find((mb) =>
        (mb.displayName || mb.email || "").toLowerCase().startsWith(q),
      );
      if (found && found.id !== (userDoc?.id || "")) ids.push(found.id);
    }
    return [...new Set(ids)];
  };

  const handleCommentTextChange = (val: string) => {
    setNewComment(val);
    const words = val.split(/\s/);
    const last = words[words.length - 1];
    if (last.startsWith("@") && last.length >= 1) {
      setCommentMentionQuery(last.slice(1));
    } else {
      setCommentMentionQuery(null);
    }
  };

  const insertCommentMention = (m: {
    id: string;
    displayName?: string;
    email?: string;
  }) => {
    const name = m.displayName || m.email || "User";
    const parts = newComment.split(/(\s+)/);
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].startsWith("@")) {
        parts[i] = `@${name}`;
        break;
      }
    }
    setNewComment(parts.join("") + " ");
    setCommentMentionQuery(null);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !taskId || !task) return;
    const mentions = parseMentionIds(newComment);
    addComment.mutate(
      { text: newComment.trim(), mentions },
      {
        onSuccess: () => {
          setNewComment("");
          setCommentMentionQuery(null);
        },
      },
    );
  };

  // Subtasks
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    addSubtask.mutate(
      { title: newSubtaskTitle.trim() },
      {
        onSuccess: () => {
          setNewSubtaskTitle("");
          setShowSubtaskInput(false);
        },
      },
    );
  };

  const handleToggleSubtask = (subtaskId: string, currentStatus: string) => {
    updateSubtask.mutate({
      subtaskId,
      payload: { status: currentStatus === "done" ? "todo" : "done" },
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask.mutate(subtaskId);
  };

  // Checklist
  const handleAddChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    addChecklistItem.mutate(
      { text: newChecklistText.trim() },
      {
        onSuccess: () => {
          setNewChecklistText("");
          setShowChecklistInput(false);
        },
      },
    );
  };

  const handleToggleChecklistItem = (itemId: string, currentDone: boolean) => {
    updateChecklistItem.mutate({ itemId, payload: { done: !currentDone } });
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    deleteChecklistItem.mutate(itemId);
  };

  // Timer
  const startTimer = () => {
    const now = Date.now();
    setTimerRunning(true);
    setTimerStartTime(now);
    setTimerElapsed(0);
  };

  const stopTimer = () => {
    if (!timerStartTime || !userDoc) return;
    const endTime = Date.now();
    const duration = Math.max(
      1,
      Math.floor((endTime - timerStartTime) / 60000),
    );
    addTimeEntry.mutate(
      { duration, startTime: timerStartTime, endTime, billable: false },
      {
        onSuccess: () => {
          setTimerRunning(false);
          setTimerStartTime(null);
          setTimerElapsed(0);
        },
      },
    );
  };

  const handleLogTimeEntry = () => {
    const duration = timeHours * 60 + timeMins;
    if (duration === 0) return;
    addTimeEntry.mutate(
      {
        duration,
        startTime: Date.now() - duration * 60000,
        endTime: Date.now(),
        note: timeNote || undefined,
        billable: timeBillable,
      },
      {
        onSuccess: () => {
          setTimeHours(0);
          setTimeMins(0);
          setTimeNote("");
          setTimeBillable(false);
          setShowTimeForm(false);
        },
      },
    );
  };

  // Dependencies
  const handleAddDependency = () => {
    if (!depTaskId || !task) return;
    if ((task.dependencies || []).some((d) => d.taskId === depTaskId)) {
      toast.error(t.errAlreadyLinked);
      return;
    }
    addDependency.mutate(
      { taskId: depTaskId, type: depType },
      {
        onSuccess: () => {
          setDepTaskId("");
          setShowDepForm(false);
        },
      },
    );
  };

  // Tags
  const handleAddTag = (tag: string) => {
    if (!tag.trim() || !task) return;
    if ((task.tags || []).includes(tag.trim())) return;
    addTag.mutate(tag.trim(), {
      onSuccess: () => {
        setTagInput("");
        setShowTagInput(false);
      },
    });
  };

  // Watchers
  const handleToggleWatcher = () => {
    if (!userDoc) return;
    const uid = userDoc.id;
    const isWatching = (task?.watchers || []).includes(uid);
    if (isWatching) {
      removeWatcher.mutate(uid);
    } else {
      addWatcher.mutate(uid);
    }
  };

  // Helpers
  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600),
      m = Math.floor((s % 3600) / 60),
      sec = s % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${m}:${String(sec).padStart(2, "0")}`;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60),
      m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
  };

  if (isLoading)
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-10 bg-muted rounded w-3/4" />
          <div className="grid grid-cols-3 gap-4">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl" />
              ))}
          </div>
        </div>
      </div>
    );

  if (!task)
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-foreground font-semibold">{t.noTaskFound}</p>
        <button
          onClick={() => navigate(`/spaces/${spaceId}`)}
          className="mt-4 text-sm text-primary hover:underline"
        >
          {t.backToSpace}
        </button>
      </div>
    );

  const sender = senders.find((s) => s.id === task.senderId);
  const sortedActivity = [...(task.activityLog || [])].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
  const activityIcon: Record<string, string> = {
    reply: "💬",
    notification: "🔔",
    message: "📨",
    comment: "✏️",
  };
  const totalTimeLogged = (task.timeEntries || []).reduce(
    (sum, e) => sum + e.duration,
    0,
  );
  const checklistDone = (task.checklistItems || []).filter(
    (i) => i.done,
  ).length;
  const checklistTotal = (task.checklistItems || []).length;
  const subtaskDone = (task.subtasks || []).filter(
    (s) => s.status === "done",
  ).length;
  const subtaskTotal = (task.subtasks || []).length;
  const isWatching = (task.watchers || []).includes(userDoc?.id || "");
  const otherTasks = allTasks.filter((t) => t.id !== taskId);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => navigate(`/spaces/${spaceId}`)}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 text-xs text-muted-foreground flex items-center gap-1 min-w-0">
          <span
            className="hover:text-foreground cursor-pointer truncate"
            onClick={() => navigate("/spaces")}
          >
            {t.spaces}
          </span>
          <span>/</span>
          <span
            className="hover:text-foreground cursor-pointer truncate"
            onClick={() => navigate(`/spaces/${spaceId}`)}
          >
            {space?.name}
          </span>
          <span>/</span>
          <span className="text-foreground font-medium truncate">
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleWatcher}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-xl transition-all",
              isWatching
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {isWatching ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            {isWatching ? t.watching : t.watchTask}
          </button>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendReminder}
              disabled={sendReminder.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-border bg-card text-foreground rounded-xl hover:bg-muted transition-all disabled:opacity-60"
            >
              {sendReminder.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bell className="w-4 h-4" />
              )}{" "}
              {t.sendReminder}
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDeleteTask}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-destructive/30 bg-card text-destructive rounded-xl hover:bg-destructive/10 transition-all"
          >
            <Trash2 className="w-4 h-4" /> {t.deleteTask}
          </motion.button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── Left column ─── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <h1
            ref={editTitleRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => {
              const v = e.currentTarget.textContent?.trim();
              if (v && v !== task.title) updateTask.mutate({ title: v });
            }}
            className="text-2xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30 rounded-lg px-1 -mx-1 cursor-text"
          >
            {task.title}
          </h1>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              {t.description}
            </label>
            <textarea
              defaultValue={task.description || ""}
              placeholder={t.description}
              rows={3}
              onBlur={(e) => {
                if (e.target.value !== task.description)
                  updateTask.mutate({ description: e.target.value });
              }}
              className="w-full px-3 py-2.5 text-sm bg-card border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* ─── Subtasks ─── */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  {t.subtasks}
                </h3>
                {subtaskTotal > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {subtaskDone}/{subtaskTotal}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSubtaskInput(true)}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {t.addSubtask}
              </button>
            </div>
            {subtaskTotal > 0 && (
              <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${Math.round((subtaskDone / subtaskTotal) * 100)}%`,
                  }}
                />
              </div>
            )}
            <div className="space-y-1.5">
              {(task.subtasks || []).map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 group">
                  <button
                    onClick={() => handleToggleSubtask(sub.id, sub.status)}
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                      sub.status === "done"
                        ? "bg-emerald-500 border-emerald-500"
                        : "border-border hover:border-primary",
                    )}
                  >
                    {sub.status === "done" && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-sm flex-1",
                      sub.status === "done" &&
                        "line-through text-muted-foreground",
                    )}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {showSubtaskInput && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  autoFocus
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddSubtask();
                    if (e.key === "Escape") {
                      setShowSubtaskInput(false);
                      setNewSubtaskTitle("");
                    }
                  }}
                  placeholder={t.subtaskPlaceholder}
                  className="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t.add}
                </button>
                <button
                  onClick={() => {
                    setShowSubtaskInput(false);
                    setNewSubtaskTitle("");
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {subtaskTotal === 0 && !showSubtaskInput && (
              <p className="text-xs text-muted-foreground text-center py-2">
                {t.noSubtasks}
              </p>
            )}
          </div>

          {/* ─── Checklist ─── */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  {t.checklist}
                </h3>
                {checklistTotal > 0 && (
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                    {checklistDone}/{checklistTotal}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowChecklistInput(true)}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {t.add}
              </button>
            </div>
            {checklistTotal > 0 && (
              <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.round((checklistDone / checklistTotal) * 100)}%`,
                  }}
                />
              </div>
            )}
            <div className="space-y-1.5">
              {(task.checklistItems || []).map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      handleToggleChecklistItem(item.id, item.done)
                    }
                    className="accent-primary shrink-0 cursor-pointer"
                  />
                  <span
                    className={cn(
                      "text-sm flex-1",
                      item.done && "line-through text-muted-foreground",
                    )}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            {showChecklistInput && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  autoFocus
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddChecklistItem();
                    if (e.key === "Escape") {
                      setShowChecklistInput(false);
                      setNewChecklistText("");
                    }
                  }}
                  placeholder={t.addChecklistItem}
                  className="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t.add}
                </button>
                <button
                  onClick={() => {
                    setShowChecklistInput(false);
                    setNewChecklistText("");
                  }}
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {checklistTotal === 0 && !showChecklistInput && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No checklist items yet
              </p>
            )}
          </div>

          {/* Progress */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t.progress}
              </label>
              <span className="text-sm font-bold text-foreground">
                {progressLocal}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={progressLocal}
              onChange={(e) => setProgressLocal(Number(e.target.value))}
              onPointerUp={(e) =>
                updateTask.mutate({
                  progress: Number((e.target as HTMLInputElement).value),
                })
              }
              className="w-full accent-primary cursor-pointer"
            />
            <div className="mt-2">
              <ProgressBar value={progressLocal} color="primary" />
            </div>
          </div>

          {/* Activity */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                {t.activity}
              </h3>
              {sortedActivity.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 ms-auto">
                  {sortedActivity.length}
                </span>
              )}
            </div>
            <form
              onSubmit={handleAddComment}
              className="flex gap-2 mb-4 relative"
            >
              {commentMentionQuery !== null &&
                spaceMembers
                  .filter((m) =>
                    (m.displayName || m.email || "")
                      .toLowerCase()
                      .includes(commentMentionQuery.toLowerCase()),
                  )
                  .slice(0, 5).length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    {spaceMembers
                      .filter((m) =>
                        (m.displayName || m.email || "")
                          .toLowerCase()
                          .includes(commentMentionQuery.toLowerCase()),
                      )
                      .slice(0, 5)
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => insertCommentMention(m)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left border-b border-border/50 last:border-0"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {(m.displayName || m.email || "U")[0].toUpperCase()}
                          </div>
                          <span className="font-medium">
                            {m.displayName || m.email}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              <input
                value={newComment}
                onChange={(e) => handleCommentTextChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setCommentMentionQuery(null);
                }}
                placeholder={`${t.writeComment} — use @ to mention someone`}
                className="flex-1 px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button
                type="submit"
                disabled={addComment.isPending || !newComment.trim()}
                className="px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            {sortedActivity.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {sortedActivity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                      {activityIcon[a.type] ?? "💬"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {a.sender && (
                          <span className="text-xs font-semibold text-foreground">
                            {a.sender}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground capitalize">
                          {a.type}
                        </span>
                        {a.source === "whatsapp" && (
                          <span className="text-xs bg-emerald-500/10 text-emerald-600 rounded-full px-1.5 py-0.5">
                            WhatsApp
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground mt-0.5 bg-muted rounded-lg px-3 py-1.5 break-words">
                        {a.text}
                      </p>
                      <span className="text-xs text-muted-foreground/60">
                        {format(new Date(a.timestamp), "MMM d, HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <MessageSquare className="w-8 h-8 opacity-30" />
                <p className="text-sm">{t.noActivityYet}</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Right column ─── */}
        <div className="space-y-3">
          {/* Status */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              {t.status}
            </label>
            <select
              value={task.status}
              onChange={(e) =>
                updateTask.mutate({ status: e.target.value as TaskStatus })
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {Object.keys(statusConfig).map((s) => (
                <option key={s} value={s}>
                  {statusConfig[s as TaskStatus].label}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <TaskStatusBadge status={task.status} />
            </div>
          </div>

          {/* Priority */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              {t.priority}
            </label>
            <select
              value={task.priority}
              onChange={(e) =>
                updateTask.mutate({ priority: e.target.value as TaskPriority })
              }
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            >
              {priorityOptions.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
            <div className="mt-2">
              <TaskPriorityBadge priority={task.priority} />
            </div>
          </div>

          {/* Assignees */}
          <div className="bg-card border border-border rounded-xl p-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              {t.assignees}
            </label>
            <div className="mb-2">
              <AvatarGroup
                memberIds={task.assigneeIds}
                members={members}
                max={5}
                size="md"
              />
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {spaceMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-2">
                  {t.noMembersInSpace}
                </p>
              ) : (
                spaceMembers.map((m) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.assigneeIds.includes(m.id)}
                      onChange={(e) =>
                        updateTask.mutate({
                          assigneeIds: e.target.checked
                            ? [...task.assigneeIds, m.id]
                            : task.assigneeIds.filter((id) => id !== m.id),
                        })
                      }
                      className="accent-primary"
                    />
                    <span className="text-xs text-foreground">
                      {m.displayName || m.email}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Deadline + Start Date */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5" /> {t.deadline}
              </label>
              <input
                type="date"
                defaultValue={
                  task.deadline
                    ? format(new Date(task.deadline), "yyyy-MM-dd")
                    : ""
                }
                onBlur={(e) =>
                  updateTask.mutate({ deadline: e.target.value || null })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Calendar className="w-3.5 h-3.5" /> {t.startDate}
              </label>
              <input
                type="date"
                defaultValue={
                  task.startDate
                    ? format(new Date(task.startDate), "yyyy-MM-dd")
                    : ""
                }
                onBlur={(e) =>
                  updateTask.mutate({ startDate: e.target.value || null })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Estimated Hours + Story Points */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5" /> {t.estimatedHoursLabel}
              </label>
              <input
                type="number"
                defaultValue={task.estimatedHours}
                min={0}
                onBlur={(e) =>
                  updateTask.mutate({ estimatedHours: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5" /> {t.storyPoints}
              </label>
              <input
                type="number"
                defaultValue={task.storyPoints ?? ""}
                min={0}
                placeholder="0"
                onBlur={(e) =>
                  updateTask.mutate({
                    storyPoints: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t.tags ?? "Tags"}
              </label>
              <button
                onClick={() => setShowTagInput((v) => !v)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                + {t.add}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(task.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => deleteTag.mutate(tag)}
                    className="hover:text-destructive transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            {showTagInput && (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTag(tagInput);
                    if (e.key === "Escape") {
                      setShowTagInput(false);
                      setTagInput("");
                    }
                  }}
                  placeholder="Tag name..."
                  className="flex-1 px-2 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t.add}
                </button>
              </div>
            )}
          </div>

          {/* Time Tracking */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> {t.timeTracking}
              </label>
              {totalTimeLogged > 0 && (
                <span className="text-xs font-bold text-foreground">
                  {formatDuration(totalTimeLogged)}
                </span>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              {timerRunning ? (
                <button
                  onClick={stopTimer}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl text-xs font-semibold hover:bg-red-500/20 transition-all"
                >
                  <Timer className="w-3.5 h-3.5 animate-pulse" /> {t.stopTimer}{" "}
                  ({formatElapsed(timerElapsed)})
                </button>
              ) : (
                <>
                  <button
                    onClick={startTimer}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-xl text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    <Timer className="w-3.5 h-3.5" /> {t.startTimer}
                  </button>
                  <button
                    onClick={() => setShowTimeForm((v) => !v)}
                    className="px-3 py-2 bg-muted text-muted-foreground border border-border rounded-xl text-xs font-semibold hover:bg-muted/80 transition-all"
                  >
                    + {t.logTime}
                  </button>
                </>
              )}
            </div>
            {showTimeForm && (
              <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded-xl">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">
                      {t.hoursShort}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={24}
                      value={timeHours}
                      onChange={(e) => setTimeHours(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-muted-foreground">
                      {t.minutesShort}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={timeMins}
                      onChange={(e) => setTimeMins(Number(e.target.value))}
                      className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  value={timeNote}
                  onChange={(e) => setTimeNote(e.target.value)}
                  placeholder={t.timerNote}
                  className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeBillable}
                    onChange={(e) => setTimeBillable(e.target.checked)}
                    className="accent-primary"
                  />{" "}
                  {t.billable}
                </label>
                <button
                  onClick={handleLogTimeEntry}
                  className="w-full py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  {t.logTime}
                </button>
              </div>
            )}
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {(task.timeEntries || []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground group"
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full shrink-0",
                      entry.billable
                        ? "bg-emerald-500"
                        : "bg-muted-foreground/40",
                    )}
                  />
                  <span className="font-medium text-foreground">
                    {formatDuration(entry.duration)}
                  </span>
                  <span className="truncate">{entry.userName}</span>
                  {entry.note && (
                    <span className="truncate text-muted-foreground/60">
                      — {entry.note}
                    </span>
                  )}
                  <button
                    onClick={() => deleteTimeEntry.mutate(entry.id)}
                    className="opacity-0 group-hover:opacity-100 ms-auto p-0.5 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(task.timeEntries || []).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  {t.noTimeLogged}
                </p>
              )}
            </div>
          </div>

          {/* Dependencies */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" /> {t.dependencies}
              </label>
              <button
                onClick={() => setShowDepForm((v) => !v)}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                + {t.addDependency}
              </button>
            </div>
            {showDepForm && (
              <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded-xl">
                <select
                  value={depType}
                  onChange={(e) => setDepType(e.target.value as DependencyType)}
                  className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none"
                >
                  <option value="blocking">{t.blockingLabel}</option>
                  <option value="blocked_by">{t.blockedByLabel}</option>
                  <option value="related">{t.relatedToLabel}</option>
                  <option value="duplicate">{t.duplicateOfLabel}</option>
                </select>
                <select
                  value={depTaskId}
                  onChange={(e) => setDepTaskId(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-background border border-input rounded-lg focus:outline-none"
                >
                  <option value="">{t.selectTask}</option>
                  {otherTasks.map((ot) => (
                    <option key={ot.id} value={ot.id}>
                      {ot.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddDependency}
                  disabled={!depTaskId}
                  className="w-full py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {t.add}
                </button>
              </div>
            )}
            <div className="space-y-1.5">
              {(task.dependencies || []).map((dep) => {
                const linkedTask = allTasks.find((ot) => ot.id === dep.taskId);
                const cfg = DEP_TYPE_CONFIG[dep.type];
                return (
                  <div
                    key={dep.taskId}
                    className="flex items-center gap-2 group text-xs"
                  >
                    <span className={cn("font-medium shrink-0", cfg.color)}>
                      {cfg.label}
                    </span>
                    <span className="text-foreground truncate flex-1">
                      {linkedTask?.title || dep.taskId}
                    </span>
                    <button
                      onClick={() => deleteDependency.mutate(dep.taskId)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {(task.dependencies || []).length === 0 && !showDepForm && (
                <p className="text-xs text-muted-foreground">
                  {t.noDependencies}
                </p>
              )}
            </div>
          </div>

          {/* Recurrence */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5" /> {t.recurrence}
              </label>
              <button
                onClick={() => setShowRecurrence((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showRecurrence && "rotate-180",
                  )}
                />
              </button>
            </div>
            {task.recurrence && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full flex items-center gap-1">
                  <Repeat className="w-3 h-3" /> {task.recurrence.frequency}
                </span>
                <button
                  onClick={() => updateTask.mutate({ recurrence: null })}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <AnimatePresence>
              {showRecurrence && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {(
                      [
                        "daily",
                        "weekly",
                        "monthly",
                        "yearly",
                      ] as RecurrenceFrequency[]
                    ).map((freq) => (
                      <button
                        key={freq}
                        onClick={() => {
                          updateTask.mutate({
                            recurrence: { frequency: freq, interval: 1 },
                          });
                          setShowRecurrence(false);
                        }}
                        className={cn(
                          "w-full text-xs px-3 py-2 rounded-lg text-start transition-all",
                          task.recurrence?.frequency === freq
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80",
                        )}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                    {task.recurrence && (
                      <button
                        onClick={() => updateTask.mutate({ recurrence: null })}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                      >
                        Remove Recurrence
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Watchers */}
          {(task.watchers || []).length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Eye className="w-3.5 h-3.5" /> {t.watchers} (
                {task.watchers?.length})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(task.watchers || []).map((uid) => {
                  const m = members.find((m) => m.id === uid);
                  return (
                    <span
                      key={uid}
                      className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full"
                    >
                      {m?.displayName || m?.email || uid.slice(0, 8)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sender */}
          {sender && (
            <div className="bg-card border border-border rounded-xl p-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5" /> {t.sender}
              </label>
              <p className="text-sm font-medium text-foreground">
                {sender.name}
              </p>
              {sender.company && (
                <p className="text-xs text-muted-foreground">
                  {sender.company}
                </p>
              )}
              {sender.email && (
                <p className="text-xs text-muted-foreground">{sender.email}</p>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p>
              {t.created} {format(new Date(task.createdAt), "MMM d, yyyy")}
            </p>
            {task.completedAt && (
              <p className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                {t.completed}{" "}
                {format(new Date(task.completedAt), "MMM d, yyyy")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
