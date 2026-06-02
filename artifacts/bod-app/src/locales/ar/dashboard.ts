import type { DashboardKeys } from "../en/dashboard";
import type { TranslationValue } from "..";

const dashboard: Record<DashboardKeys, TranslationValue> = {
  allCaughtUp: "أنت محدّث!",
  noPendingTasks: "لا توجد مهام معلّقة معيّنة لك.",
  notifications: "الإشعارات",
  viewAllTasks: "عرض كل مهامي ←",
  totalTasks: "إجمالي المهام",
  notAssigned: "غير معيّنة",
  completion: "نظرة عامة",
  upcomingDeadlines: "المواعيد القادمة",
  noDeadlinesSet: "لا توجد مواعيد محددة",
  taskTimeline: "جدول المهام",
  teamMembers: "أعضاء الفريق",
  noUpcomingDeadlines: "لا توجد مواعيد قادمة",
  teamPerformance: "أداء الفريق",
  tasksByMember: "المهام لكل عضو",
  taskDistribution: "توزيع المهام",
  completionRate: "معدل الإنجاز",
  employeeStats: "إحصائيات الموظفين",
  activeTasks: "المهام النشطة",
  completedTasks: "المكتملة",
  noDataYet: "لا توجد بيانات بعد",
};

export default dashboard;
