import api from "./api";
import type { AttendanceRecord, CreateAttendancePayload } from "@/types";

export const attendanceService = {
  log: (payload: CreateAttendancePayload): Promise<AttendanceRecord> =>
    api
      .post<{ message: string; record: AttendanceRecord }>("/attendance", payload)
      .then((r) => r.data.record),
};
