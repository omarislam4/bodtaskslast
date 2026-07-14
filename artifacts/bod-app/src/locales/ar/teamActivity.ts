import type { TeamActivityKeys } from "../en/teamActivity";
import type { TranslationValue } from "..";

const teamActivity: Record<TeamActivityKeys, TranslationValue> = {
  teamActivity: "نشاط الفريق",
  teamActivityDesc: "استعرض الحضور والتقارير على مستوى الفريق",
  teamAttendance: "الحضور",
  teamReports: "التقارير",
  selectMember: "اختر عضواً",
  allMembersOption: "جميع الأعضاء",
  period: "الفترة",
  periodDay: "يوم",
  periodWeek: "أسبوع",
  periodMonth: "شهر",
  periodCustom: "نطاق مخصص",
  from: "من",
  to: "إلى",
  reportTypeWeekly: "أسبوعي",
  reportTypeMonthly: "شهري",
  workedHours: "ساعات العمل",
  pausedTime: "وقت التوقف",
  startedAt: "البدء",
  middayAt: "منتصف اليوم",
  pausedAt: "توقف",
  resumedAt: "استئناف",
  endedAt: "الانتهاء",
  noAttendanceRecords: "لا توجد سجلات حضور لهذه الفترة",
  pickMemberToViewReports: "اختر عضواً لعرض تقاريره",
  notRecorded: "—",
};

export default teamActivity;
