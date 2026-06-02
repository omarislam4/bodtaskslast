import { motion } from "framer-motion";
import { BarChart2, CheckCircle2, AlertTriangle, XCircle, Users, TrendingUp } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useSpaces } from "@/hooks/useSpaces";
import { useAllTasksQuery } from "@/hooks/useTaskQueries";
import { useMembers } from "@/hooks/useMembers";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

type HealthStatus = "on_track" | "at_risk" | "off_track";

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  on_track:  { label: "On Track",  color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  at_risk:   { label: "At Risk",   color: "text-yellow-500",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  icon: AlertTriangle },
  off_track: { label: "Off Track", color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: XCircle },
};

export default function Portfolio() {
  const { t } = useLang();
  const { spaces } = useSpaces();
  const { data: tasks = [] } = useAllTasksQuery();
  const { members } = useMembers();
  const [, navigate] = useLocation();

  const getHealth = (spaceId: string): HealthStatus => {
    const spaceTasks = tasks.filter(t => t.spaceId === spaceId && t.status !== "done");
    if (spaceTasks.length === 0) return "on_track";
    const overdue = spaceTasks.filter(t => t.deadline && new Date(t.deadline) < new Date()).length;
    const ratio = overdue / spaceTasks.length;
    if (ratio >= 0.3) return "off_track";
    if (ratio >= 0.1) return "at_risk";
    return "on_track";
  };

  const getStats = (spaceId: string) => {
    const spaceTasks = tasks.filter(t => t.spaceId === spaceId);
    const done = spaceTasks.filter(t => t.status === "done").length;
    const total = spaceTasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const overdue = spaceTasks.filter(t => t.status !== "done" && t.deadline && new Date(t.deadline) < new Date()).length;
    return { total, done, pct, overdue };
  };

  const topSpaces = spaces.filter(s => !(s as { parentSpaceId?: string }).parentSpaceId);
  const summary = {
    onTrack:  topSpaces.filter(s => getHealth(s.id) === "on_track").length,
    atRisk:   topSpaces.filter(s => getHealth(s.id) === "at_risk").length,
    offTrack: topSpaces.filter(s => getHealth(s.id) === "off_track").length,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t.portfolio}</h1>
          <p className="text-sm text-muted-foreground">{topSpaces.length} projects overview</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.onTrack,  value: summary.onTrack,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: t.atRisk,   value: summary.atRisk,   color: "text-yellow-500",  bg: "bg-yellow-500/10" },
          { label: t.offTrack, value: summary.offTrack, color: "text-red-500",     bg: "bg-red-500/10" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Project grid */}
      {topSpaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart2 className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noProjects}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topSpaces.map(space => {
            const health = getHealth(space.id);
            const stats = getStats(space.id);
            const cfg = HEALTH_CONFIG[health];
            const Icon = cfg.icon;
            const spaceMembers = members.filter(m => space.memberIds?.includes(m.id));
            return (
              <motion.div key={space.id} layout whileHover={{ y: -2 }}
                onClick={() => navigate(`/spaces/${space.id}`)}
                className={cn("bg-card border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg", cfg.border)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: space.color + "30" }}>
                      <span className="text-sm font-bold" style={{ color: space.color }}>{space.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{space.name}</h3>
                      {space.description && <p className="text-xs text-muted-foreground truncate max-w-[140px]">{space.description}</p>}
                    </div>
                  </div>
                  <span className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium", cfg.bg, cfg.color)}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{t.completion}</span>
                    <span className="text-xs font-bold text-foreground">{stats.pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${stats.pct}%`, backgroundColor: space.color || "#6366f1" }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-bold text-foreground">{stats.total}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-2">
                    <p className="text-sm font-bold text-emerald-500">{stats.done}</p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2">
                    <p className="text-sm font-bold text-red-500">{stats.overdue}</p>
                    <p className="text-[10px] text-muted-foreground">Overdue</p>
                  </div>
                </div>

                {/* Members */}
                {spaceMembers.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <div className="flex -space-x-1.5">
                      {spaceMembers.slice(0, 4).map(m => (
                        <div key={m.id} className="w-5 h-5 rounded-full bg-primary/30 border border-card flex items-center justify-center text-[9px] font-bold text-primary">
                          {(m.displayName || m.email || "U")[0].toUpperCase()}
                        </div>
                      ))}
                      {spaceMembers.length > 4 && <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[9px] text-muted-foreground">+{spaceMembers.length - 4}</div>}
                    </div>
                    <span className="text-xs text-muted-foreground ms-1">{spaceMembers.length} {t.membersLabel}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
