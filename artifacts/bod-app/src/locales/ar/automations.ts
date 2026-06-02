import type { AutomationsKeys } from "../en/automations";
import type { TranslationValue } from "..";

const automations: Record<AutomationsKeys, TranslationValue> = {
  automations: "الأتمتة",
  newAutomation: "أتمتة جديدة",
  createAutomation: "إنشاء أتمتة",
  automationName: "اسم الأتمتة",
  triggerLabel: "المحفز — عندما",
  conditionLabel: "الشرط — إذا",
  actionLabel: "الإجراء — ثم",
  noAutomations: "لا توجد أتمتة",
  noAutomationsDesc: "أتمت المهام المتكررة بقواعد بسيطة.",
  enabledLabel: "مفعّل",
  automationRuns: "التشغيلات",
  whenStatusChanges: "تتغير الحالة إلى",
  whenPriorityChanges: "تتغير الأولوية إلى",
  whenAssigneeAdded: "يُضاف منتسب",
  whenTaskCreated: "تُنشأ مهمة",
  whenDueDateReaches: "يصل الموعد النهائي",
  thenChangeStatus: "تغيير الحالة إلى",
  thenChangePriority: "تغيير الأولوية إلى",
  thenAssign: "تعيين لعضو",
  thenNotify: "إرسال إشعار",
  thenCreateTask: "إنشاء مهمة جديدة",
};

export default automations;
