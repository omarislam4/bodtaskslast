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
  /** Client-only: true while the send API call is in-flight. */
  pending?: boolean;
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

export interface PaginatedMessagesResponse {
  data: ChatMessage[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
  links: Record<string, string | null>;
}
