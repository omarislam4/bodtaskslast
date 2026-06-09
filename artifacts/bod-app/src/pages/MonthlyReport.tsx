import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import DateDisplay from "@/components/ui/date-display";

const N8N_MONTHLY_URL = "https://n8n.athar-riyada.com/webhook/monthly-report";

export default function MonthlyReport() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const [monthlyReport, setMonthlyReport] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyReport.trim()) return;

    setIsPending(true);
    try {
      await fetch(N8N_MONTHLY_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          userId: userDoc?.id || "",
          userName: userDoc?.displayName || userDoc?.email || "",
          userEmail: userDoc?.email || "",
          timestamp: new Date().toISOString(),
          report: monthlyReport,
        }),
      });
      toast.success(t.attMonthlyReportSent);
      setMonthlyReport("");
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
          {t.monthlyReport}
        </h1>
        <p className="text-sm text-muted-foreground">{t.submitMonthlyReport}</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.monthlyReport}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t.monthOf} <DateDisplay date={new Date()} />
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={monthlyReport}
            onChange={(e) => setMonthlyReport(e.target.value)}
            placeholder={t.monthlyReportPlaceholder}
            rows={8}
            className="w-full px-4 py-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            required
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isPending || !monthlyReport.trim()}
            className="w-full py-3 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 disabled:opacity-60 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isPending ? t.saving : t.submitMonthlyReport}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
