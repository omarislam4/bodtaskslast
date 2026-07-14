export interface WeeklyReportRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  report: string;
  submittedAt: string;
  payload: {
    reportType: "weekly";
    weekOf: string;
  };
  createdAt: string;
}

export interface MonthlyReportRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  report: string;
  submittedAt: string;
  payload: {
    reportType: "monthly";
    monthOf: string;
  };
  createdAt: string;
}

export interface ReportQueryParams {
  userId?: string;
  page?: number;
  perPage?: number;
}
