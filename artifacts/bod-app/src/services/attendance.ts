import api from "./api";
import type {
  AttendanceRecord,
  CreateAttendancePayload,
  WeeklyReportRecord,
  CreateWeeklyReportPayload,
} from "@/types";

export const attendanceService = {
  log: (payload: CreateAttendancePayload): Promise<AttendanceRecord> =>
    api
      .post<{ message: string; record: AttendanceRecord }>("/attendance", payload)
      .then((r) => r.data.record),
};

export const weeklyReportsService = {
  submit: (payload: CreateWeeklyReportPayload): Promise<WeeklyReportRecord> =>
    api
      .post<{ message: string; weeklyReport: WeeklyReportRecord }>("/weekly-reports", payload)
      .then((r) => r.data.weeklyReport),
};
