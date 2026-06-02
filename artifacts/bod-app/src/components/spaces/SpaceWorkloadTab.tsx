import { motion } from "framer-motion";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import { useSpaceMembers } from "@/hooks/useSpaces";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  spaceId: string;
}

export function SpaceWorkloadTab({ spaceId }: Props) {
  const { data: tasks = [] } = useTasksBySpace(spaceId);
  const { data: spaceMembers = [] } = useSpaceMembers(spaceId);

  return (
    <motion.div
      key="workload"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6"
    >
      <WorkloadView tasks={tasks} members={spaceMembers} />
    </motion.div>
  );
}

function WorkloadView({
  tasks,
  members,
}: {
  tasks: Task[];
  members: { id: string; displayName?: string; email?: string }[];
}) {
  const capacityPerDay = 8;
  const workDaysInMonth = 22;
  const totalCapacity = capacityPerDay * workDaysInMonth;

  const getMemberLoad = (memberId: string) => {
    const memberTasks = tasks.filter((t) => t.assigneeIds.includes(memberId) && t.status !== "done");
    const totalHours = memberTasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0);
    return { totalHours, taskCount: memberTasks.length, tasks: memberTasks };
  };

  const getHealthStatus = (hours: number) => {
    if (hours > totalCapacity * 1.2) return { label: "Overloaded", color: "text-red-500", bg: "bg-red-500" };
    if (hours > totalCapacity * 0.8) return { label: "Balanced", color: "text-emerald-500", bg: "bg-emerald-500" };
    return { label: "Underloaded", color: "text-blue-400", bg: "bg-blue-400" };
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">Workload</h2>
        <span className="text-xs text-muted-foreground">
          Capacity: {totalCapacity}h/month ({capacityPerDay}h/day)
        </span>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">No members assigned to this space</div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => {
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
                    {memberTasks.slice(0, 5).map((t) => (
                      <span key={t.id} className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full truncate max-w-[120px]">
                        {t.title}
                      </span>
                    ))}
                    {memberTasks.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{memberTasks.length - 5} more</span>
                    )}
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
