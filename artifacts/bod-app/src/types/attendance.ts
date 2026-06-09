export type AttendanceType = "start" | "midday" | "end";

export interface AttendanceRecord {
  id: string;
  type: AttendanceType;
  recordedAt: string;
}

export interface CreateAttendancePayload {
  type: AttendanceType;
  report?: string;
}

export interface WeeklyReportRecord {
  id: string;
  report: string;
}

export interface CreateWeeklyReportPayload {
  report: string;
}

