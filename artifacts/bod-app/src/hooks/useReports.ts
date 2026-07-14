import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reportsService,
  weeklyReportsApi,
  monthlyReportsApi,
  type ReportPayload,
} from "@/services/reports";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { ReportQueryParams } from "@/types";

export const reportKeys = {
  weeklyAll: () => ["reports", "weekly"] as const,
  weekly: (params?: ReportQueryParams) => ["reports", "weekly", params] as const,
  monthlyAll: () => ["reports", "monthly"] as const,
  monthly: (params?: ReportQueryParams) => ["reports", "monthly", params] as const,
};

export const useWeeklyReports = (params?: ReportQueryParams) =>
  useQuery({
    queryKey: reportKeys.weekly(params),
    queryFn: () => weeklyReportsApi.list(params),
  });

export const useMonthlyReports = (params?: ReportQueryParams) =>
  useQuery({
    queryKey: reportKeys.monthly(params),
    queryFn: () => monthlyReportsApi.list(params),
  });

export const useSubmitWeeklyReport = () => {
  const { t } = useLang();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReportPayload) => {
      const [n8nResult, apiResult] = await Promise.allSettled([
        reportsService.weekly(payload),
        weeklyReportsApi.submit(payload.report),
      ]);
      if (apiResult.status === "rejected" && n8nResult.status === "rejected") {
        throw apiResult.reason;
      }
      return apiResult;
    },
    onSuccess: (apiResult) => {
      if (apiResult.status === "fulfilled") {
        queryClient.invalidateQueries({ queryKey: reportKeys.weeklyAll() });
      }
      toast.success(t.attWeeklyReportSent);
    },
    onError: () => toast.error(t.errSendReport),
  });
};

export const useSubmitMonthlyReport = () => {
  const { t } = useLang();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ReportPayload) => {
      const [n8nResult, apiResult] = await Promise.allSettled([
        reportsService.monthly(payload),
        monthlyReportsApi.submit(payload.report),
      ]);
      if (apiResult.status === "rejected" && n8nResult.status === "rejected") {
        throw apiResult.reason;
      }
      return apiResult;
    },
    onSuccess: (apiResult) => {
      if (apiResult.status === "fulfilled") {
        queryClient.invalidateQueries({ queryKey: reportKeys.monthlyAll() });
      }
      toast.success(t.attMonthlyReportSent);
    },
    onError: () => toast.error(t.errSendReport),
  });
};
