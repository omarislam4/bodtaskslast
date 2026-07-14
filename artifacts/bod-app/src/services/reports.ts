import api from "./api";
import type {
  WeeklyReportRecord,
  MonthlyReportRecord,
  ReportQueryParams,
} from "@/types";

const N8N_WEEKLY_URL = "https://n8n.athar-riyada.com/webhook/weekly-report";
const N8N_MONTHLY_URL = "https://n8n.athar-riyada.com/webhook/monthly-report";

export type ReportPayload = {
  userId: string;
  userName: string;
  userEmail: string;
  timestamp: string;
  report: string;
  attachment_file?: File;
  attachment_link?: string;
};

async function postReport(url: string, payload: ReportPayload): Promise<void> {
  const form = new FormData();
  form.append("userId", payload.userId);
  form.append("userName", payload.userName);
  form.append("userEmail", payload.userEmail);
  form.append("timestamp", payload.timestamp);
  form.append("report", payload.report);
  if (payload.attachment_link?.trim()) form.append("attachment_link", payload.attachment_link.trim());
  if (payload.attachment_file) form.append("attachment_file", payload.attachment_file);

  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to send report");
}

export const reportsService = {
  weekly: (payload: ReportPayload) => postReport(N8N_WEEKLY_URL, payload),
  monthly: (payload: ReportPayload) => postReport(N8N_MONTHLY_URL, payload),
};

export const weeklyReportsApi = {
  submit: (report: string): Promise<WeeklyReportRecord> =>
    api
      .post<{ message: string; weeklyReport: WeeklyReportRecord }>("/weekly-reports", { report })
      .then((r) => r.data.weeklyReport),

  list: (params?: ReportQueryParams): Promise<WeeklyReportRecord[]> =>
    api.get<WeeklyReportRecord[]>("/weekly-reports", { params }).then((r) => r.data),
};

export const monthlyReportsApi = {
  submit: (report: string): Promise<MonthlyReportRecord> =>
    api
      .post<{ message: string; monthlyReport: MonthlyReportRecord }>("/monthly-reports", { report })
      .then((r) => r.data.monthlyReport),

  list: (params?: ReportQueryParams): Promise<MonthlyReportRecord[]> =>
    api.get<MonthlyReportRecord[]>("/monthly-reports", { params }).then((r) => r.data),
};
