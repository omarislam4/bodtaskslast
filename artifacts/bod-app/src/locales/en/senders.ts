const senders = {
  company: "Company",
  phone: "Phone",
  noSendersYet: "No senders yet",
  sendersDesc: "Manage task sources and senders",
  addSenderTitle: "Add Sender",
} as const;

export type SendersKeys = keyof typeof senders;
export default senders;
