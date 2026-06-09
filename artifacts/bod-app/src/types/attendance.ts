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
