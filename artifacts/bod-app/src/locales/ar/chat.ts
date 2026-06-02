import type { ChatKeys } from "../en/chat";
import type { TranslationValue } from "..";

const chat: Record<ChatKeys, TranslationValue> = {
  chat: "المحادثة",
  channels: "القنوات",
  directMessages: "الرسائل المباشرة",
  newChannel: "قناة جديدة",
  channelNamePlaceholder: "اسم-القناة",
  typeMessage: "اكتب رسالة...",
  noMessages: "لا توجد رسائل",
  noMessagesDesc: "ابدأ المحادثة!",
  generalChannel: "عام",
  mentionedYou: (name: string) => `${name} ذكرك`,
};

export default chat;
