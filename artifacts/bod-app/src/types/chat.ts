export interface ReplyTo {
  id: string;
  text: string;
  senderName: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  spaceId?: string | null;
  isPrivate: boolean;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  spaceId?: string | null;
  senderId: string;
  senderName: string;
  text: string;
  mentions: string[];
  replyTo?: ReplyTo | null;
  reactions: Record<string, string[]>;
  deleted: boolean;
  edited?: boolean;
  createdAt: string;
}

export interface CreateChannelPayload {
  name: string;
  description?: string;
  spaceId?: string;
  isPrivate?: boolean;
  memberIds?: string[];
}

export interface SendMessagePayload {
  text: string;
  mentions?: string[];
  replyTo?: ReplyTo | null;
}
