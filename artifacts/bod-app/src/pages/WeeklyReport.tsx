import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import DateDisplay from "@/components/ui/date-display";

const N8N_WEEKLY_URL = "https://n8n.athar-riyada.com/webhook/weekly-report";

export default function WeeklyReport() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const [weeklyReport, setWeeklyReport] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weeklyReport.trim()) return;

    setIsPending(true);
    try {
      await fetch(N8N_WEEKLY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userDoc?.id || "",
          userName: userDoc?.displayName || userDoc?.email || "",
          userEmail: userDoc?.email || "",
          timestamp: new Date().toISOString(),
          report: weeklyReport,
        }),
      });
      toast.success(t.attWeeklyReportSent);
      setWeeklyReport("");
    } catch {
      toast.error(t.errSendReport);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          {t.weeklyReport}
        </h1>
        <p className="text-sm text-muted-foreground">{t.submitWeeklyReport}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.weeklyReport}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.weekOf} <DateDisplay date={new Date()} />
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={weeklyReport}
            onChange={(e) => setWeeklyReport(e.target.value)}
            placeholder={t.weeklyReportPlaceholder}
            rows={8}
            className="w-full px-4 py-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            required
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isPending || !weeklyReport.trim()}
            className="w-full py-3 bg-purple-500 text-white text-sm font-semibold rounded-xl hover:bg-purple-600 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isPending ? t.saving : t.submitWeeklyReport}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
