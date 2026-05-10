import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { History as HistoryIcon, Search, CheckCircle2, Calendar, Filter } from "lucide-react";
import { useAllTasks } from "@/hooks/useTasks";
import { useMembers } from "@/hooks/useMembers";
import { useSpaces } from "@/hooks/useSpaces";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/contexts/LangContext";
import { format } from "date-fns";

export default function History() {
  const { tasks, loading } = useAllTasks();
  const { members } = useMembers();
  const { spaces } = useSpaces();
  const [, navigate] = useLocation();
  const { t } = useLang();
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const completedTasks = tasks.filter((tk) => tk.status === "done");

  const filtered = completedTasks.filter((tk) => {
    const matchesSearch = (tk.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (tk.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priorityFilter === "all" || tk.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.history}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{completedTasks.length} {t.completed.toLowerCase()}</p>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchCompleted}
            className="ps-10 pe-4 py-2.5 text-sm bg-card border border-input rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-card border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          >
            <option value="all">{t.allPriorities}</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title={completedTasks.length === 0 ? t.noCompletedTasks : t.noMatchingTasks}
          description={completedTasks.length === 0 ? t.completedTasksTry : t.adjustFilters}
        />
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {filtered.map((task, i) => {
            const space = spaces.find((s) => s.id === task.spaceId);
            const assignees = task.assigneeIds.map((id) => members.find((m) => m.id === id)?.displayName).filter(Boolean);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}
                className="flex items-center gap-4 p-4 border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{task.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {space && (
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: space.color || "#6366f1" }} />
                        <span className="text-xs text-muted-foreground">{space.name}</span>
                      </div>
                    )}
                    {assignees.length > 0 && (
                      <span className="text-xs text-muted-foreground">{assignees.slice(0, 2).join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <TaskPriorityBadge priority={task.priority} size="sm" />
                  {task.completedAt && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(task.completedAt, "MMM d, yyyy")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
