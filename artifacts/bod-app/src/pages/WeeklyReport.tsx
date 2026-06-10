import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Link, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import DateDisplay from "@/components/ui/date-display";
import FileDropZone from "@/components/ui/file-drop-zone";
import { useSubmitWeeklyReport } from "@/hooks/useReports";

export default function WeeklyReport() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const [report, setReport] = useState("");
  const [attachmentLink, setAttachmentLink] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const { mutate, isPending } = useSubmitWeeklyReport();

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!report.trim()) return;
    mutate(
      {
        userId: userDoc?.id || "",
        userName: userDoc?.displayName || userDoc?.email || "",
        userEmail: userDoc?.email || "",
        timestamp: new Date().toISOString(),
        report,
        attachment_file: attachmentFile ?? undefined,
        attachment_link: attachmentLink || undefined,
      },
      {
        onSuccess: () => {
          setReport("");
          setAttachmentLink("");
          setAttachmentFile(null);
        },
      },
    );
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
            value={report}
            onChange={(e) => setReport(e.target.value)}
            placeholder={t.weeklyReportPlaceholder}
            rows={8}
            className="w-full px-4 py-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            required
          />

          <div className="relative">
            <Link className="absolute inset-s-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="url"
              value={attachmentLink}
              onChange={(e) => setAttachmentLink(e.target.value)}
              placeholder={t.attachmentLinkPlaceholder}
              className="w-full ps-9 pe-4 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <FileDropZone
            value={attachmentFile}
            onChange={setAttachmentFile}
            accentColor="purple"
          />

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isPending || !report.trim()}
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
