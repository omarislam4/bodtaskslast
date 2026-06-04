const attendance = {
  attShiftStarted: "Shift started!",
  attMiddayRecorded: "Mid-day attendance recorded!",
  attShiftEnded: "Shift ended & report sent!",
  attWeeklyReportSent: "Weekly report sent!",
  startMainShift: "Start Main Shift",
  midDayAttendance: "Midday Attendance",
  endShift: "End Shift",
  errNoReport: "Please enter an end-of-shift report before ending the shift.",
  recordMiddayCheckIn: "Record your midday check-in",
  writeDailyReport: "Write a daily report and submit when your shift ends",
  recordStartShift: "Record when your shift begins",
  endShiftReportPlaceholder:
    "Write your daily report... (What did you accomplish today? Any blockers?)",
  weeklyReport: "Weekly Report",
  submitWeeklyReport: "Submit Weekly Report",
  weeklyReportPlaceholder:
    "Write your weekly report... (What did you accomplish this week? Any challenges or support needed?)",
} as const;

export type AttendanceKeys = keyof typeof attendance;
export default attendance;
