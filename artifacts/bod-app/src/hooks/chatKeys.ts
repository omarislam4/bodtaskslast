export const chatKeys = {
  channels: (spaceId?: string) =>
    spaceId ? (["chat", "channels", spaceId] as const) : (["chat", "channels"] as const),
  messages: (channelId: string) => ["chat", "messages", channelId] as const,
  messagesInfinite: (channelId: string) => ["chat", "messages-infinite", channelId] as const,
};
