import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Clock, FileText, PauseCircle, PlayCircle } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useMembers } from "@/hooks/useMembers";
import { useAttendanceSummary, useAttendanceRecords } from "@/hooks/useAttendance";
import { useWeeklyReports, useMonthlyReports } from "@/hooks/useReports";
import DateDisplay from "@/components/ui/date-display";
import { toISODate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { AttendanceSummaryQueryParams } from "@/types";

type Period = "day" | "week" | "month" | "custom";
type ReportType = "daily" | "weekly" | "monthly";

function timeOf(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TeamActivity() {
  const { t } = useLang();
  const { members } = useMembers();
  const [tab, setTab] = useState<"attendance" | "reports">("attendance");

  // Attendance state
  const [attendanceUserId, setAttendanceUserId] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("week");
  const [date, setDate] = useState(toISODate(new Date()));
  const [month, setMonth] = useState(toISODate(new Date()).slice(0, 7));
  const [from, setFrom] = useState(toISODate(new Date()));
  const [to, setTo] = useState(toISODate(new Date()));

  const attendanceParams = useMemo((): AttendanceSummaryQueryParams => {
    const base: AttendanceSummaryQueryParams =
      attendanceUserId === "all" ? {} : { userId: attendanceUserId };
    if (period === "day") return { ...base, date };
    if (period === "week") return { ...base, period: "week" };
    if (period === "month") return { ...base, month };
    return { ...base, from, to };
  }, [attendanceUserId, period, date, month, from, to]);

  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary(attendanceParams);

  // Reports state
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [reportUserId, setReportUserId] = useState<string>("");
  const effectiveReportUserId = reportUserId || members[0]?.id || "";

  const { data: dailyRecords = [], isLoading: dailyLoading } = useAttendanceRecords(
    effectiveReportUserId ? { userId: effectiveReportUserId } : undefined,
  );
  const { data: weeklyReports = [], isLoading: weeklyLoading } = useWeeklyReports(
    effectiveReportUserId ? { userId: effectiveReportUserId } : undefined,
  );
  const { data: monthlyReports = [], isLoading: monthlyLoading } = useMonthlyReports(
    effectiveReportUserId ? { userId: effectiveReportUserId } : undefined,
  );

  const dailyReports = useMemo(
    () =>
      dailyRecords
        .filter((r) => r.type === "end" && r.report?.trim())
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()),
    [dailyRecords],
  );

  const reportsLoading =
    reportType === "daily" ? dailyLoading : reportType === "weekly" ? weeklyLoading : monthlyLoading;

  const displayReports = useMemo(() => {
    if (reportType === "daily") {
      return dailyReports.map((r) => ({
        id: r.id,
        meta: <DateDisplay date={r.recordedAt} />,
        timestamp: r.recordedAt,
        text: r.report,
      }));
    }
    if (reportType === "weekly") {
      return weeklyReports.map((r) => ({
        id: r.id,
        meta: (
          <>
            {t.weekOf} <DateDisplay date={r.payload.weekOf} />
          </>
        ),
        timestamp: r.submittedAt,
        text: r.report,
      }));
    }
    return monthlyReports.map((r) => ({
      id: r.id,
      meta: (
        <>
          {t.monthOf} <DateDisplay date={r.payload.monthOf} />
        </>
      ),
      timestamp: r.submittedAt,
      text: r.report,
    }));
  }, [reportType, dailyReports, weeklyReports, monthlyReports, t]);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.teamActivity}</h1>
          <p className="text-sm text-muted-foreground">{t.teamActivityDesc}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["attendance", "reports"] as const).map((tabId) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              tab === tabId
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tabId === "attendance" ? t.teamAttendance : t.teamReports}
          </button>
        ))}
      </div>

      {tab === "attendance" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={attendanceUserId}
              onChange={(e) => setAttendanceUserId(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">{t.allMembersOption}</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName || m.email}
                </option>
              ))}
            </select>

            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="day">{t.periodDay}</option>
              <option value="week">{t.periodWeek}</option>
              <option value="month">{t.periodMonth}</option>
              <option value="custom">{t.periodCustom}</option>
            </select>

            {period === "day" && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
            {period === "month" && (
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
            {period === "custom" && (
              <>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </>
            )}
          </div>

          {summaryLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : !summary || summary.data.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t.noAttendanceRecords}
            </p>
          ) : (
            <div className="space-y-4">
              {summary.data.map((group) => (
                <motion.div
                  key={group.userId}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground">{group.userName}</p>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {group.totals.workHours}h {t.workedHours.toLowerCase()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.days.map((day) => (
                      <div
                        key={day.date}
                        className="grid grid-cols-6 gap-2 text-xs bg-muted/40 rounded-lg px-2.5 py-2"
                      >
                        <span className="font-medium text-foreground col-span-1">
                          <DateDisplay date={day.date} fmt="MMM d" />
                        </span>
                        <span className="text-muted-foreground">{timeOf(day.startAt)}</span>
                        <span className="text-muted-foreground">{timeOf(day.middayAt)}</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <PauseCircle className="w-3 h-3" /> {timeOf(day.pauseAt)}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <PlayCircle className="w-3 h-3" /> {timeOf(day.resumeAt)}
                        </span>
                        <span className="text-muted-foreground">{timeOf(day.endAt)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="daily">{t.reportTypeDaily}</option>
              <option value="weekly">{t.reportTypeWeekly}</option>
              <option value="monthly">{t.reportTypeMonthly}</option>
            </select>
            <select
              value={effectiveReportUserId}
              onChange={(e) => setReportUserId(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName || m.email}
                </option>
              ))}
            </select>
          </div>

          {!effectiveReportUserId ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t.pickMemberToViewReports}
            </p>
          ) : reportsLoading ? (
            <div className="space-y-2">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
              ))}
            </div>
          ) : displayReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">{t.noReportsYet}</p>
          ) : (
            <div className="space-y-2">
              {displayReports.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {r.meta}
                    </span>
                    {reportType !== "daily" && (
                      <span className="text-xs text-muted-foreground">
                        <DateDisplay date={r.timestamp} />
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
