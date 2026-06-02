const attendance = {
  attShiftStarted: "Shift started!",
  attMiddayRecorded: "Mid-day attendance recorded!",
  attShiftEnded: "Shift ended & report sent!",
  attWeeklyReportSent: "Weekly report sent!",
} as const;

export type AttendanceKeys = keyof typeof attendance;
export default attendance;
