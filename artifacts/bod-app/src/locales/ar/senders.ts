import type { SendersKeys } from "../en/senders";
import type { TranslationValue } from "..";

const senders: Record<SendersKeys, TranslationValue> = {
  company: "الشركة",
  phone: "الهاتف",
  noSendersYet: "لا يوجد مرسلون",
  sendersDesc: "إدارة مصادر المهام والمرسلين",
  addSenderTitle: "إضافة مرسل",
};

export default senders;
