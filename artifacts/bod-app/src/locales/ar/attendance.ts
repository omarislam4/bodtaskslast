import type { AttendanceKeys } from "../en/attendance";
import type { TranslationValue } from "..";

const attendance: Record<AttendanceKeys, TranslationValue> = {
  attShiftStarted: "بدأت الوردية!",
  attMiddayRecorded: "تم تسجيل حضور منتصف اليوم!",
  attShiftEnded: "انتهت الوردية وأُرسل التقرير!",
  attWeeklyReportSent: "تم إرسال التقرير الأسبوعي!",
};

export default attendance;
