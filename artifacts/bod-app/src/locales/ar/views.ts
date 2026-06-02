import type { ViewsKeys } from "../en/views";
import type { TranslationValue } from "..";

const views: Record<ViewsKeys, TranslationValue> = {
  kanbanView: "اللوحة",
  tableView: "الجدول",
  ganttView: "جانت",
  calendarView: "التقويم",
  monthView: "الشهر",
  weekView: "الأسبوع",
  dayView: "اليوم",
  noTasksOnDay: "لا توجد مهام",
  workloadView: "التحميل",
  memberCapacity: "الطاقة",
  overloaded: "محمّل زيادة",
  underloaded: "تحميل منخفض",
  balanced: "متوازن",
  hoursPerDay: "ساعة/يوم",
  workloadTitle: "عرض التحميل",
  setCapacity: "تحديد الطاقة",
  portfolio: "المحفظة",
  projectHealth: "صحة المشروع",
  noProjects: "لا توجد مشاريع",
};

export default views;
