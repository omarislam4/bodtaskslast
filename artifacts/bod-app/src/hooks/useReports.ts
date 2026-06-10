import { useMutation } from "@tanstack/react-query";
import { reportsService, type ReportPayload } from "@/services/reports";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";

export const useSubmitWeeklyReport = () => {
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: ReportPayload) => reportsService.weekly(payload),
    onSuccess: () => toast.success(t.attWeeklyReportSent),
    onError: () => toast.error(t.errSendReport),
  });
};

export const useSubmitMonthlyReport = () => {
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: ReportPayload) => reportsService.monthly(payload),
    onSuccess: () => toast.success(t.attMonthlyReportSent),
    onError: () => toast.error(t.errSendReport),
  });
};
