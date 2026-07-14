import api from "./api";
import type {
  AttendanceRecord,
  CreateAttendancePayload,
  AttendanceStatusResponse,
  AttendanceCurrentResponse,
  AttendanceSummaryResponse,
  AttendanceSummaryQueryParams,
  AttendanceQueryParams,
} from "@/types";

export const attendanceService = {
  log: (payload: CreateAttendancePayload): Promise<AttendanceRecord> =>
    api
      .post<{ message: string; record: AttendanceRecord }>("/attendance", payload)
      .then((r) => r.data.record),

  list: (params?: AttendanceQueryParams): Promise<AttendanceRecord[]> =>
    api.get<AttendanceRecord[]>("/attendance", { params }).then((r) => r.data),

  getStatus: (date?: string): Promise<AttendanceStatusResponse> =>
    api
      .get<AttendanceStatusResponse>("/attendance/status", { params: date ? { date } : undefined })
      .then((r) => r.data),

  getCurrent: (date?: string): Promise<AttendanceCurrentResponse> =>
    api
      .get<AttendanceCurrentResponse>("/attendance/current", { params: date ? { date } : undefined })
      .then((r) => r.data),

  getSummary: (params?: AttendanceSummaryQueryParams): Promise<AttendanceSummaryResponse> =>
    api.get<AttendanceSummaryResponse>("/attendance/summary", { params }).then((r) => r.data),
};
