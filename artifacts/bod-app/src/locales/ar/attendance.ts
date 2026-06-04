import type { AttendanceKeys } from "../en/attendance";
import type { TranslationValue } from "..";

const attendance: Record<AttendanceKeys, TranslationValue> = {
  attShiftStarted: "بدأت الوردية!",
  attMiddayRecorded: "تم تسجيل حضور منتصف اليوم!",
  attShiftEnded: "انتهت الوردية وأُرسل التقرير!",
  attWeeklyReportSent: "تم إرسال التقرير الأسبوعي!",
  startMainShift: "بدء الوردية الرئيسية",
  midDayAttendance: "حضور منتصف اليوم",
  endShift: "إنهاء الوردية",
  errNoReport: "يرجى إدخال تقرير نهاية الوردية قبل إنهاء الوردية.",
  recordMiddayCheckIn: "سجّل حضورك في منتصف اليوم",
  writeDailyReport: "اكتب تقريراً يومياً وقدمّه عند انتهاء ورديتك",
  recordStartShift: "سجّل بداية ورديتك",
  endShiftReportPlaceholder:
    "اكتب تقريرك اليومي... (ماذا أنجزت اليوم؟ هل هناك أي عوائق؟)",
  weeklyReport: "التقرير الأسبوعي",
  submitWeeklyReport: "قدم التقرير الأسبوعي إلى HR",
  weeklyReportPlaceholder:
    "اكتب تقريرك الأسبوعي... (ما الذي أنجزته هذا الأسبوع؟ هل هناك أي تحديات أو احتياجات دعم؟)",
};

export default attendance;
