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
  weekOf: "Week of",
  weeklyReport: "Weekly Report",
  submitWeeklyReport: "Submit Weekly Report",
  weeklyReportPlaceholder:
    "Write your weekly report... (What did you accomplish this week? Any challenges or support needed?)",
  attMonthlyReportSent: "Monthly report sent!",
  monthOf: "Month of",
  monthlyReport: "Monthly Report",
  submitMonthlyReport: "Submit Monthly Report",
  monthlyReportPlaceholder:
    "Write your monthly report... (What did you accomplish this month? Key wins, challenges, or goals for next month?)",
} as const;

export type AttendanceKeys = keyof typeof attendance;
export default attendance;
