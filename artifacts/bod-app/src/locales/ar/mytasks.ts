import type { MyTasksKeys } from "../en/mytasks";
import type { TranslationValue } from "..";

const myTasks: Record<MyTasksKeys, TranslationValue> = {
  myTasks: "مهامي",
  todayLabel: "اليوم",
  upcomingLabel: "القادمة",
  overdueLabel: "المتأخرة",
  allTasksLabel: "الكل",
  noMyTasks: "لا توجد مهام",
  noMyTasksDesc: "المهام المعيّنة لك ستظهر هنا.",
};

export default myTasks;
