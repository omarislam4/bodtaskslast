import type { SuccessKeys } from "../en/success";
import type { TranslationValue } from "..";

const success: Record<SuccessKeys, TranslationValue> = {
  spaceCreated: "تم إنشاء المساحة!",
  spaceDeleted: "تم حذف المساحة",
  subspaceCreated: "تم إنشاء المساحة الفرعية!",
  memberAdded: "تمت إضافة العضو",
  memberRemoved: "تمت إزالة العضو",
  dataItemAdded: "تمت الإضافة",
  dataItemDeleted: "تم الحذف",
  automationCreated: "تم إنشاء الأتمتة!",
  automationDeleted: "تم حذف الأتمتة!",
};

export default success;
