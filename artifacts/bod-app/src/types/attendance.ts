export type AttendanceType = "start" | "midday" | "pause" | "resume" | "end";

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: AttendanceType;
  report: string;
  recordedAt: string;
  payload?: { message?: string };
  createdAt?: string;
}

export interface CreateAttendancePayload {
  type: AttendanceType;
  report?: string;
}

export interface AttendanceState {
  currentState: string;
  lastType: AttendanceType | null;
  nextAction: AttendanceType | null;
  hasStarted: boolean;
  hasMidday: boolean;
  hasEnded: boolean;
  isPaused: boolean;
  canStartShift: boolean;
  canMidday: boolean;
  canPause: boolean;
  canResume: boolean;
  canEndShift: boolean;
}

export interface AttendanceDaySummary {
  date: string;
  userId: string;
  userName: string;
  userEmail: string;
  startAt: string | null;
  middayAt: string | null;
  endAt: string | null;
  pauseAt: string | null;
  resumeAt: string | null;
  pausedMinutes: number;
  totalWorkMinutes: number | null;
  totalWorkHours: number | null;
}

export interface AttendanceStatusResponse {
  date: string;
  attendanceState: AttendanceState;
  summary: AttendanceDaySummary;
}

export interface AttendanceCurrentResponse {
  date: string;
  userId: string;
  currentAttendanceType: AttendanceType | null;
  typesMade: AttendanceType[];
  attendanceState: AttendanceState;
}

export interface AttendanceSummaryQueryParams {
  userId?: string;
  date?: string;
  period?: "week" | "month";
  week?: string;
  month?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
}

export interface AttendanceSummaryUserGroup {
  userId: string;
  userName: string;
  userEmail: string;
  days: (AttendanceDaySummary & { attendanceState: AttendanceState })[];
  totals: {
    workMinutes: number;
    workHours: number;
    pausedMinutes: number;
  };
}

export interface AttendanceSummaryResponse {
  period: { from: string; to: string };
  data: AttendanceSummaryUserGroup[];
}

export interface AttendanceQueryParams {
  userId?: string;
  page?: number;
  perPage?: number;
}
