import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import { useMembers } from "@/hooks/useMembers";
import { useLang } from "@/contexts/LangContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface Props {
  spaceId: string;
}

export function SpaceTableTab({ spaceId }: Props) {
  const [, navigate] = useLocation();
  const { data: tasks = [] } = useTasksBySpace(spaceId);
  const { members } = useMembers();
  const { t } = useLang();

  return (
    <motion.div
      key="table"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 overflow-x-auto"
    >
      <TableView tasks={tasks} members={members} spaceId={spaceId} onNavigate={navigate} t={t} />
    </motion.div>
  );
}

function TableView({
  tasks,
  members,
  spaceId,
  onNavigate,
  t,
}: {
  tasks: Task[];
  members: { id: string; displayName?: string; email?: string }[];
  spaceId?: string;
  onNavigate: (p: string) => void;
  t: { tableView: string };
}) {
  const [sortField, setSortField] = useState<"title" | "status" | "priority" | "deadline" | "progress">("deadline");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortField === "title") cmp = a.title.localeCompare(b.title);
    if (sortField === "status") cmp = a.status.localeCompare(b.status);
    if (sortField === "priority") cmp = a.priority.localeCompare(b.priority);
    if (sortField === "deadline") cmp = new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
    if (sortField === "progress") cmp = a.progress - b.progress;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortBtn = ({ field, label }: { field: typeof sortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}{sortField === field ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
    </button>
  );

  const PRIORITY_COLORS: Record<string, string> = {
    low: "text-blue-400", medium: "text-yellow-400", high: "text-orange-400", urgent: "text-red-500",
  };
  const STATUS_COLORS: Record<string, string> = {
    todo: "text-muted-foreground", "in-progress": "text-blue-400", review: "text-yellow-400",
    done: "text-emerald-500", blocked: "text-red-500",
  };

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
            {sorted.map((task) => {
              const assignees = task.assigneeIds
                .map((id) => members.find((m) => m.id === id))
                .filter(Boolean) as { id: string; displayName?: string; email?: string }[];
              return (
                <tr
                  key={task.id}
                  onClick={() => onNavigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                  className="hover:bg-muted/30 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-foreground group-hover:text-primary truncate max-w-[200px] transition-colors">{task.title}</p>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className={cn("text-xs font-medium capitalize", STATUS_COLORS[task.status])}>
                      {task.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span className={cn("text-xs font-medium capitalize", PRIORITY_COLORS[task.priority])}>{task.priority}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell text-xs text-muted-foreground">
                    {task.deadline ? format(new Date(task.deadline), "MMM d, yyyy") : "—"}
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell">
                    <div className="flex -space-x-1.5">
                      {assignees.slice(0, 3).map((m) => (
                        <div key={m.id} className="w-5 h-5 rounded-full bg-primary/30 border border-card flex items-center justify-center text-[9px] font-bold text-primary">
                          {(m.displayName || m.email || "U")[0].toUpperCase()}
                        </div>
                      ))}
                      {assignees.length > 3 && (
                        <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[9px] text-muted-foreground">
                          +{assignees.length - 3}
                        </div>
                      )}
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
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No tasks yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
