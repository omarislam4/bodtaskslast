import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getEcho, isEchoEnabled } from "@/lib/echo";
import { activeChatChannel } from "@/lib/activeChatChannel";
import { chatKeys } from "@/hooks/chatKeys";
import { upsertMessage, hasReactionsPending } from "@/hooks/chatCache";
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

    const handle = ({ chatMessage }: ChatMessageEvent) =>
      upsertMessage(queryClient, channelId, chatMessage);

    getEcho().then((echo) => {
      if (!echo) return;

      console.log(`[Chat] Subscribing to private-chat.channels.${channelId}`);
      echoChannel = echo.private(`chat.channels.${channelId}`);

      echoChannel
        .listen(".chat.message.created", (e: ChatMessageEvent) => { console.log("[Chat] ← message.created", e.chatMessage.id); handle(e); })
        .listen(".chat.message.updated", (e: ChatMessageEvent) => { console.log("[Chat] ← message.updated", e.chatMessage.id); handle(e); })
        .listen(".chat.message.deleted", (e: ChatMessageEvent) => { console.log("[Chat] ← message.deleted", e.chatMessage.id); handle(e); })
        .listen(".chat.message.reaction_updated", (e: ChatMessageEvent) => {
          console.log("[Chat] ← reaction_updated", e.chatMessage.id);
          // Skip while optimistic mutations are in-flight; reactionMutationEnd
          // will do a single confirming refetch once they all settle.
          if (!hasReactionsPending(channelId)) handle(e);
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
