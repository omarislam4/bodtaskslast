import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getEcho, isEchoEnabled } from "@/lib/echo";
import { chatKeys } from "@/hooks/useChatQueries";
import type { ChatMessage } from "@/types";

// ─── Event shapes from the Laravel backend ────────────────────────────────────

interface MessageSentEvent      { message: ChatMessage }
interface MessageEditedEvent    { message: ChatMessage }
interface MessageDeletedEvent   { messageId: string }
interface ReactionToggledEvent  { message: ChatMessage }

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Subscribes to Pusher private-chat.{channelId} and keeps the React Query
 * message cache up to date without polling.
 *
 * No-ops silently when VITE_PUSHER_APP_KEY is not set — the query's
 * refetchInterval fallback takes over in that case.
 */
export function useChatRealtime(channelId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId || !isEchoEnabled()) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let echoChannel: any = null;

    getEcho().then((echo) => {
      if (!echo) return;

      echoChannel = echo.private(`chat.${channelId}`);

      echoChannel
        .listen(".MessageSent", ({ message }: MessageSentEvent) => {
          queryClient.setQueryData<ChatMessage[]>(
            chatKeys.messages(channelId),
            (old) => {
              if (!old) return [message];
              // Avoid duplicates (REST send + push can race)
              if (old.some((m) => m.id === message.id)) return old;
              return [...old, message];
            },
          );
        })
        .listen(".MessageEdited", ({ message }: MessageEditedEvent) => {
          queryClient.setQueryData<ChatMessage[]>(
            chatKeys.messages(channelId),
            (old) => old?.map((m) => (m.id === message.id ? message : m)) ?? old,
          );
        })
        .listen(".MessageDeleted", ({ messageId }: MessageDeletedEvent) => {
          queryClient.setQueryData<ChatMessage[]>(
            chatKeys.messages(channelId),
            (old) =>
              old?.map((m) =>
                m.id === messageId ? { ...m, deleted: true } : m,
              ) ?? old,
          );
        })
        .listen(".ReactionToggled", ({ message }: ReactionToggledEvent) => {
          queryClient.setQueryData<ChatMessage[]>(
            chatKeys.messages(channelId),
            (old) => old?.map((m) => (m.id === message.id ? message : m)) ?? old,
          );
        });
    });

    return () => {
      getEcho().then((echo) => echo?.leave(`chat.${channelId}`));
    };
  }, [channelId, queryClient]);
}
