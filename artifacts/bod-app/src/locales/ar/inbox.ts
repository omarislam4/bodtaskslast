import type { InboxKeys } from "../en/inbox";
import type { TranslationValue } from "..";

const inbox: Record<InboxKeys, TranslationValue> = {
  inbox: "البريد الوارد",
  markAllRead: "تعليم الكل كمقروء",
  unreadLabel: "غير مقروء",
  mentionsLabel: "الإشارات",
  assignmentsLabel: "التعيينات",
  noNotificationsYet: "لا توجد إشعارات",
  noNotificationsDesc: "ستظهر النشاطات والإشارات هنا.",
  markRead: "تعليم كمقروء",
  notifType: "النوع",
};

export default inbox;
