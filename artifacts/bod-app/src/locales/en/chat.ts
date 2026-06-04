const chat = {
  chat: "Chat",
  channels: "Channels",
  directMessages: "Direct Messages",
  newChannel: "New Channel",
  channelNamePlaceholder: "channel-name",
  typeMessage: "Type a message...",
  noMessages: "No messages yet",
  noMessagesDesc: "Start the conversation!",
  generalChannel: "general",
  edited: "edited",
  deletedMessage: "This message was deleted",
  mentionedYou: (name: string) => `${name} mentioned you`,
  deleteChannel: "Delete channel",
} as const;

export type ChatKeys = keyof typeof chat;
export default chat;
