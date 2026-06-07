import api from "./api";
import type { ChatChannel, ChatMessage, CreateChannelPayload, SendMessagePayload, CursorMessagesResponse } from "@/types";

export const chatService = {
  listChannels: (spaceId?: string): Promise<ChatChannel[]> =>
    api
      .get<ChatChannel[]>("/chat/channels", { params: spaceId ? { spaceId } : undefined })
      .then((r) => r.data),

  createChannel: (payload: CreateChannelPayload): Promise<ChatChannel> =>
    api
      .post<{ message: string; channel: ChatChannel }>("/chat/channels", payload)
      .then((r) => r.data.channel),

  deleteChannel: (channelId: string): Promise<void> =>
    api.delete(`/chat/channels/${channelId}`).then(() => undefined),

  listMessages: (channelId: string, params?: { limit?: number; before?: string; after?: string }): Promise<CursorMessagesResponse> =>
    api.get<CursorMessagesResponse>(`/chat/channels/${channelId}/messages`, { params }).then((r) => r.data),

  sendMessage: (channelId: string, payload: SendMessagePayload): Promise<ChatMessage> =>
    api
      .post<{ message: string; chatMessage: ChatMessage }>(
        `/chat/channels/${channelId}/messages`,
        payload,
      )
      .then((r) => r.data.chatMessage),

  editMessage: (msgId: string, payload: { text: string }): Promise<ChatMessage> =>
    api
      .patch<{ message: string; chatMessage: ChatMessage }>(`/chat/messages/${msgId}`, payload)
      .then((r) => r.data.chatMessage),

  deleteMessage: (msgId: string): Promise<void> =>
    api.delete(`/chat/messages/${msgId}`).then(() => undefined),

  toggleReaction: (msgId: string, emoji: string): Promise<void> =>
    api.post(`/chat/messages/${msgId}/reactions`, { emoji }).then(() => undefined),
};
