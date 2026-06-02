import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getEcho, isEchoEnabled } from "@/lib/echo";
import { activeChatChannel } from "@/lib/activeChatChannel";
import { chatKeys } from "@/hooks/useChatQueries";
import type { ChatMessage } from "@/types";

// ─── Event shapes from the Laravel backend ────────────────────────────────────

interface ChatMessageEvent { chatMessage: ChatMessage }

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Subscribes to Reverb private-chat.channels.{channelId} and keeps the React
 * Query message cache up to date without polling.
 *
 * No-ops silently when VITE_REVERB_APP_KEY is not set — the query's
 * refetchInterval fallback takes over in that case.
 */
export function useChatRealtime(channelId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!channelId || !isEchoEnabled()) return;
    activeChatChannel.set(channelId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let echoChannel: any = null;

    const upsert = (msg: ChatMessage) =>
      queryClient.setQueryData<ChatMessage[]>(
        chatKeys.messages(channelId),
        (old) => {
          if (!old) return [msg];
          const idx = old.findIndex((m) => m.id === msg.id);
          if (idx === -1) return [...old, msg];
          const next = [...old];
          next[idx] = msg;
          return next;
        },
      );

    getEcho().then((echo) => {
      if (!echo) return;

      console.log(`[Chat] Subscribing to private-chat.channels.${channelId}`);
      echoChannel = echo.private(`chat.channels.${channelId}`);

      echoChannel
        .listen(".chat.message.created", ({ chatMessage }: ChatMessageEvent) => {
          console.log("[Chat] ← message.created", chatMessage.id);
          upsert(chatMessage);
        })
        .listen(".chat.message.updated", ({ chatMessage }: ChatMessageEvent) => {
          console.log("[Chat] ← message.updated", chatMessage.id);
          upsert(chatMessage);
        })
        .listen(".chat.message.deleted", ({ chatMessage }: ChatMessageEvent) => {
          console.log("[Chat] ← message.deleted", chatMessage.id);
          upsert(chatMessage);
        })
        .listen(".chat.message.reaction_updated", ({ chatMessage }: ChatMessageEvent) => {
          console.log("[Chat] ← reaction_updated", chatMessage.id);
          upsert(chatMessage);
        });
    });

    return () => {
      activeChatChannel.set(null);
      console.log(`[Chat] Leaving chat.channels.${channelId}`);
      getEcho().then((echo) => {
        echo?.leave(`chat.channels.${channelId}`);
        // Signal AFTER leave so the notification hook can re-subscribe
        activeChatChannel.notifyLeft(channelId);
      });
    };
  }, [channelId, queryClient]);
}
