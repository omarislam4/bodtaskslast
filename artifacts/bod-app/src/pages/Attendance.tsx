import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Send,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useLogAttendance } from "@/hooks/useAttendance";
import { toast } from "sonner";
import type { AttendanceType } from "@/types";

const N8N_URLS: Record<AttendanceType, string> = {
  start: "https://n8n.athar-riyada.com/webhook/start-shift",
  midday: "https://n8n.athar-riyada.com/webhook/mid-day-attendence",
  end: "https://n8n.athar-riyada.com/webhook/end-shift",
};

const N8N_MESSAGES: Record<AttendanceType, (now: string) => string> = {
  start: (now) => `Start Main Shift — ${now}`,
  midday: (now) => `Mid Day Attendance — ${now}`,
  end: (now) => `End Shift — ${now}`,
};

function fireN8nWebhook(
  type: AttendanceType,
  payload: Record<string, string>,
): void {
  fetch(N8N_URLS[type], {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

interface ShiftState {
  shiftActive: boolean;
  isPaused: boolean;
}

function getShiftKey(userId: string) {
  return `bod_shift_${userId}`;
}

function loadShiftState(userId: string): ShiftState {
  try {
    const raw = localStorage.getItem(getShiftKey(userId));
    if (!raw) return { shiftActive: false, isPaused: false };
    return JSON.parse(raw) as ShiftState;
  } catch {
    return { shiftActive: false, isPaused: false };
  }
}

function saveShiftState(userId: string, state: ShiftState) {
  localStorage.setItem(getShiftKey(userId), JSON.stringify(state));
}

function clearShiftState(userId: string) {
  localStorage.removeItem(getShiftKey(userId));
}

export default function Attendance() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const logAttendance = useLogAttendance();
  const [endShiftReport, setEndShiftReport] = useState("");
  const [shiftState, setShiftState] = useState<ShiftState>({
    shiftActive: false,
    isPaused: false,
  });

  useEffect(() => {
    if (userDoc?.id) {
      setShiftState(loadShiftState(userDoc.id));
    }
  }, [userDoc?.id]);

  const isLoading = (type: AttendanceType) =>
    logAttendance.isPending && logAttendance.variables?.type === type;

  const handleAttendance = (type: AttendanceType) => {
    if (type === "end" && !endShiftReport.trim()) {
      toast.error(t.errNoReport);
      return;
    }

    logAttendance.mutate(
      {
        type,
        ...(type === "end" ? { report: endShiftReport } : {}),
      },
      {
        onSuccess: () => {
          const now = new Date().toISOString();
          fireN8nWebhook(type, {
            userId: userDoc?.id || "",
            userName: userDoc?.displayName || userDoc?.email || "",
            userEmail: userDoc?.email || "",
            timestamp: now,
            type,
            message: N8N_MESSAGES[type](now),
            ...(type === "end" ? { report: endShiftReport } : {}),
          });

          if (type === "start") {
            const newState: ShiftState = { shiftActive: true, isPaused: false };
            if (userDoc?.id) saveShiftState(userDoc.id, newState);
            setShiftState(newState);
          } else if (type === "end") {
            if (userDoc?.id) clearShiftState(userDoc.id);
            setShiftState({ shiftActive: false, isPaused: false });
            setEndShiftReport("");
          }
        },
      },
    );
  };

  const firePauseResumeWebhook = (action: "pause" | "resume") => {
    const url =
      action === "pause"
        ? "https://n8n.athar-riyada.com/webhook/pause-shift"
        : "https://n8n.athar-riyada.com/webhook/resume-shift";
    fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        userId: userDoc?.id || "",
        userName: userDoc?.displayName || userDoc?.email || "",
        userEmail: userDoc?.email || "",
        timestamp: new Date().toISOString(),
        type: action,
        message: action === "pause" ? "Shift Paused" : "Shift Resumed",
      }),
    }).catch(() => {});
  };

  const handlePauseResume = () => {
    if (!shiftState.isPaused) {
      const newState: ShiftState = { shiftActive: true, isPaused: true };
      if (userDoc?.id) saveShiftState(userDoc.id, newState);
      setShiftState(newState);
      firePauseResumeWebhook("pause");
      toast.success(t.pauseShiftToast);
    } else {
      const newState: ShiftState = { shiftActive: true, isPaused: false };
      if (userDoc?.id) saveShiftState(userDoc.id, newState);
      setShiftState(newState);
      firePauseResumeWebhook("resume");
      toast.success(t.resumeShiftToast);
    }
  };

  const isPaused = shiftState.isPaused;
  const shiftActive = shiftState.shiftActive;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          Attendance
        </h1>
        <p className="text-sm text-muted-foreground">
          Record your attendance for the day
        </p>
      </div>

      <div className="space-y-4">
        {/* Start Main Shift */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t.startMainShift}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.recordStartShift}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={isLoading("start") ? {} : { scale: 1.02 }}
            whileTap={isLoading("start") ? {} : { scale: 0.98 }}
            onClick={() => handleAttendance("start")}
            disabled={logAttendance.isPending}
            className="w-full py-3 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {isLoading("start") ? t.loading : t.startMainShift}
          </motion.button>
        </motion.div>

        {/* Pause / Resume Shift */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={`bg-card border rounded-2xl p-5 shadow-sm transition-colors ${
            isPaused ? "border-amber-400/60" : "border-border"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isPaused ? "bg-amber-500/10" : "bg-purple-500/10"
              }`}
            >
              {isPaused ? (
                <PlayCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <PauseCircle className="w-5 h-5 text-purple-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {isPaused ? t.resumeShift : t.pauseShift}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isPaused ? t.resumeShiftDesc : t.pauseShiftDesc}
              </p>
            </div>
            {isPaused && (
              <span className="ms-auto text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Paused
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePauseResume}
            className={`w-full py-3 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-sm flex items-center justify-center gap-2 ${
              isPaused
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-purple-500 hover:bg-purple-600"
            }`}
          >
            {isPaused ? (
              <>
                <PlayCircle className="w-4 h-4" />
                {t.resumeShift}
              </>
            ) : (
              <>
                <PauseCircle className="w-4 h-4" />
                {t.pauseShift}
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Mid Day Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t.midDayAttendance}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.recordMiddayCheckIn}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={isLoading("midday") ? {} : { scale: 1.02 }}
            whileTap={isLoading("midday") ? {} : { scale: 0.98 }}
            onClick={() => handleAttendance("midday")}
            disabled={logAttendance.isPending}
            className="w-full py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {isLoading("midday") ? t.loading : t.midDayAttendance}
          </motion.button>
        </motion.div>

        {/* End Shift */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t.endShift}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t.writeDailyReport}
              </p>
            </div>
          </div>
          <textarea
            value={endShiftReport}
            onChange={(e) => setEndShiftReport(e.target.value)}
            placeholder={t.endShiftReportPlaceholder}
            rows={4}
            className="w-full px-4 py-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none mb-3"
          />
          <motion.button
            whileHover={isLoading("end") ? {} : { scale: 1.02 }}
            whileTap={isLoading("end") ? {} : { scale: 0.98 }}
            onClick={() => handleAttendance("end")}
            disabled={logAttendance.isPending || !endShiftReport.trim()}
            className="w-full py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isLoading("end") ? t.saving : t.endShift}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
