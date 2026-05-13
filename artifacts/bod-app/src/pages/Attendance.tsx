import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

async function fireWebhook(url: string, payload: Record<string, string>): Promise<void> {
  try {
    await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error — check your connection");
  }
}

export default function Attendance() {
  const { userDoc } = useAuth();
  const [endShiftReport, setEndShiftReport] = useState("");
  const [sendingAttendance, setSendingAttendance] = useState<string | null>(null);

  const handleAttendance = async (type: "start" | "midday" | "end") => {
    const urls: Record<string, string> = {
      start: "https://n8n.athar-riyada.com/webhook/start-shift",
      midday: "https://n8n.athar-riyada.com/webhook/mid-day-attendence",
      end: "https://n8n.athar-riyada.com/webhook/end-shift",
    };
    if (type === "end" && !endShiftReport.trim()) {
      toast.error("Please write a report before submitting");
      return;
    }
    setSendingAttendance(type);
    try {
      const now = new Date().toISOString();
      const payload: Record<string, string> = {
        userId: userDoc?.id || "",
        userName: userDoc?.displayName || userDoc?.email || "",
        userEmail: userDoc?.email || "",
        timestamp: now,
        type,
      };
      if (type === "start") payload.message = `Start Main Shift — ${now}`;
      if (type === "midday") payload.message = `Mid Day Attendance — ${now}`;
      if (type === "end") {
        payload.message = `End Shift — ${now}`;
        payload.report = endShiftReport;
      }
      await fireWebhook(urls[type], payload);
      if (type === "end") setEndShiftReport("");
      toast.success(
        type === "start" ? "Shift started!" :
        type === "midday" ? "Mid-day attendance recorded!" :
        "Shift ended & report sent!"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send. Please try again.");
    } finally {
      setSendingAttendance(null);
    }
  };

  const isLoading = sendingAttendance !== null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Attendance</h1>
        <p className="text-sm text-muted-foreground">Record your attendance for the day</p>
      </div>

      <div className="space-y-4">
        {/* Start Main Shift */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Start Main Shift</h3>
              <p className="text-xs text-muted-foreground">Record when your shift begins</p>
            </div>
          </div>
          <motion.button
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            onClick={() => handleAttendance("start")}
            disabled={isLoading}
            className="w-full py-3 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {sendingAttendance === "start" ? "Recording..." : "Start Main Shift"}
          </motion.button>
        </motion.div>

        {/* Mid Day Attendance */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Mid Day Attendance</h3>
              <p className="text-xs text-muted-foreground">Record your midday check-in</p>
            </div>
          </div>
          <motion.button
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            onClick={() => handleAttendance("midday")}
            disabled={isLoading}
            className="w-full py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-60 transition-colors shadow-sm"
          >
            {sendingAttendance === "midday" ? "Recording..." : "Mid Day Attendance"}
          </motion.button>
        </motion.div>

        {/* End Shift */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Send className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">End Shift</h3>
              <p className="text-xs text-muted-foreground">Write a daily report and submit when your shift ends</p>
            </div>
          </div>
          <textarea
            value={endShiftReport}
            onChange={(e) => setEndShiftReport(e.target.value)}
            placeholder="Write your daily report... (What did you accomplish today? Any blockers?)"
            rows={4}
            className="w-full px-4 py-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none mb-3"
          />
          <motion.button
            whileHover={isLoading ? {} : { scale: 1.02 }}
            whileTap={isLoading ? {} : { scale: 0.98 }}
            onClick={() => handleAttendance("end")}
            disabled={isLoading || !endShiftReport.trim()}
            className="w-full py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sendingAttendance === "end" ? "Sending..." : "End Shift"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
