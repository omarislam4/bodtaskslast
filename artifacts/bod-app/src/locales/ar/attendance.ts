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
  weekOf: "أسبوع",
  weeklyReport: "التقرير الأسبوعي",
  submitWeeklyReport: "قدم التقرير الأسبوعي إلى HR",
  weeklyReportPlaceholder:
    "اكتب تقريرك الأسبوعي... (ما الذي أنجزته هذا الأسبوع؟ هل هناك أي تحديات أو احتياجات دعم؟)",
  attMonthlyReportSent: "تم إرسال التقرير الشهري!",
  monthOf: "شهر",
  monthlyReport: "التقرير الشهري",
  submitMonthlyReport: "قدم التقرير الشهري",
  monthlyReportPlaceholder:
    "اكتب تقريرك الشهري... (ما الذي أنجزته هذا الشهر؟ أبرز الإنجازات والتحديات وأهداف الشهر القادم؟)",
  attachmentFile: "مرفق (اختياري)",
  attachmentLink: "رابط (اختياري)",
  attachmentLinkPlaceholder: "https://...",
  attachmentDropHint: "اسحب وأفلت أو انقر للاستعراض",
  attachmentDropActive: "أفلت الملف هنا",
};

export default attendance;
