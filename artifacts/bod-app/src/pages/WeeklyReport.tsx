import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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

export default function WeeklyReport() {
  const { userDoc } = useAuth();
  const [weeklyReport, setWeeklyReport] = useState("");
  const [sendingWeeklyReport, setSendingWeeklyReport] = useState(false);

  const handleWeeklyReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyReport.trim()) return;
    setSendingWeeklyReport(true);
    try {
      const now = new Date().toISOString();
      await fireWebhook("https://n8n.athar-riyada.com/webhook/weekly-report", {
        userId: userDoc?.id || "",
        userName: userDoc?.displayName || userDoc?.email || "",
        userEmail: userDoc?.email || "",
        timestamp: now,
        report: weeklyReport,
      });
      setWeeklyReport("");
      toast.success("Weekly report sent!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send report. Please try again.");
    } finally {
      setSendingWeeklyReport(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Weekly Report</h1>
        <p className="text-sm text-muted-foreground">Submit your weekly report to HR</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Weekly Summary</h3>
            <p className="text-xs text-muted-foreground">Week of {format(new Date(), "MMM d, yyyy")}</p>
          </div>
        </div>
        <form onSubmit={handleWeeklyReport} className="space-y-4">
          <textarea
            value={weeklyReport}
            onChange={(e) => setWeeklyReport(e.target.value)}
            placeholder="Write your weekly report here... (What did you accomplish this week? What are your goals for next week? Any issues or blockers?)"
            rows={8}
            className="w-full px-4 py-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            required
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={sendingWeeklyReport || !weeklyReport.trim()}
            className="w-full py-3 bg-purple-500 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {sendingWeeklyReport ? "Sending Report..." : "Send Report"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
