import { motion } from "framer-motion";
import { BarChart2, CheckCircle2, AlertTriangle, XCircle, Users } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/services/portfolio";

const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  on_track:  { label: "On Track",  color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2 },
  at_risk:   { label: "At Risk",   color: "text-yellow-500",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  icon: AlertTriangle },
  off_track: { label: "Off Track", color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/30",     icon: XCircle },
};

export default function Portfolio() {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { data, isLoading } = usePortfolio();

  const summary = data?.summary;
  const projects = data?.projects ?? [];

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-muted rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {Array(3).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-52 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t.portfolio}</h1>
          <p className="text-sm text-muted-foreground">{summary?.projectCount ?? projects.length} projects overview</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t.onTrack,  value: summary?.onTrack  ?? 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: t.atRisk,   value: summary?.atRisk   ?? 0, color: "text-yellow-500",  bg: "bg-yellow-500/10" },
          { label: t.offTrack, value: summary?.offTrack ?? 0, color: "text-red-500",     bg: "bg-red-500/10" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BarChart2 className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noProjects}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => {
            const cfg = HEALTH_CONFIG[project.healthStatus];
            const Icon = cfg.icon;
            return (
              <motion.div key={project.id} layout whileHover={{ y: -2 }}
                onClick={() => navigate(`/spaces/${project.id}`)}
                className={cn("bg-card border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg", cfg.border)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: project.color + "30" }}>
                      <span className="text-sm font-bold" style={{ color: project.color }}>{project.name[0]}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{project.name}</h3>
                      {project.description && <p className="text-xs text-muted-foreground truncate max-w-[140px]">{project.description}</p>}
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
                    <span className="text-xs font-bold text-foreground">{project.completionPercent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${project.completionPercent}%`, backgroundColor: project.color || "#6366f1" }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-bold text-foreground">{project.totalTasks}</p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-2">
                    <p className="text-sm font-bold text-emerald-500">{project.completedTasks}</p>
                    <p className="text-[10px] text-muted-foreground">Done</p>
                  </div>
                  <div className="bg-red-500/10 rounded-lg p-2">
                    <p className="text-sm font-bold text-red-500">{project.overdueTasks}</p>
                    <p className="text-[10px] text-muted-foreground">Overdue</p>
                  </div>
                </div>

                {/* Members */}
                {project.members.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border">
                    <Users className="w-3 h-3 text-muted-foreground" />
                    <div className="flex -space-x-1.5">
                      {project.members.slice(0, 4).map(m => (
                        <div key={m.id} className="w-5 h-5 rounded-full bg-primary/30 border border-card flex items-center justify-center text-[9px] font-bold text-primary">
                          {(m.displayName || m.email || "U")[0].toUpperCase()}
                        </div>
                      ))}
                      {project.memberCount > 4 && (
                        <div className="w-5 h-5 rounded-full bg-muted border border-card flex items-center justify-center text-[9px] text-muted-foreground">
                          +{project.memberCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground ms-1">{project.memberCount} {t.membersLabel}</span>
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
