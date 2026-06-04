import { useEffect, useRef } from "react";
import { useLocation } from "wouter"; // navigate only — location intentionally excluded from effect deps
import { toast } from "sonner";
import { AtSign, MessageCircle, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { useSpaceChannels } from "@/hooks/useChatQueries";
import { getEcho, isEchoEnabled } from "@/lib/echo";
import { activeChatChannel } from "@/lib/activeChatChannel";
import { requestPermission, showBrowserNotification } from "@/lib/browserNotifications";
import type { ChatMessage, ChatChannel } from "@/types";

export function useChatNotifications() {
  const { userDoc } = useAuth();
  const { t } = useLang();
  const [location, navigate] = useLocation();
  const { data: channels = [] } = useSpaceChannels();

  // Request OS notification permission once on mount.
  useEffect(() => { requestPermission(); }, []);

  const channelsRef = useRef<ChatChannel[]>([]);
  channelsRef.current = channels;

  const userIdRef = useRef<string | undefined>(undefined);
  userIdRef.current = userDoc?.id;

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Build the notification handler for one channel — stable enough to be
  // passed directly to Echo .listen() without causing duplicate registrations.
  const makeHandler =
    (channelId: string) =>
    ({ chatMessage }: { chatMessage: ChatMessage }) => {
      if (chatMessage.senderId === userIdRef.current) return;
      if (chatMessage.channelId === activeChatChannel.get()) return;

      const ch = channelsRef.current.find(
        (c) => c.id === chatMessage.channelId,
      );
      const channelName = ch?.name ?? "chat";
      const destination = ch?.spaceId
        ? `/spaces/${ch.spaceId}?tab=chat&channel=${chatMessage.channelId}`
        : `/chat?channel=${chatMessage.channelId}`;

      const preview =
        chatMessage.text.length > 80
          ? chatMessage.text.slice(0, 80) + "…"
          : chatMessage.text;

      const isMentioned =
        Array.isArray(chatMessage.mentions) &&
        !!userIdRef.current &&
        chatMessage.mentions.includes(userIdRef.current);

      // OS / system notification — navigates to the channel on click.
      showBrowserNotification(
        isMentioned ? t.mentionedYou(chatMessage.senderName) : chatMessage.senderName,
        {
          body: `#${channelName}: ${preview}`,
          tag: chatMessage.channelId, // collapses burst messages per channel
          onClick: () => navigateRef.current(destination),
        },
      );

      if (isMentioned) {
        toast.custom(
          (id) => (
            <div className="flex items-start gap-3 w-89 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-md">
              <AtSign className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {t.mentionedYou(chatMessage.senderName)}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                  {preview}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <button
                  onClick={() => {
                    navigateRef.current(destination);
                    toast.dismiss(id);
                  }}
                  className="text-xs font-medium cursor-pointer text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 whitespace-nowrap transition-colors"
                >
                  #{channelName}
                </button>
                <button
                  onClick={() => toast.dismiss(id)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ),
          { duration: Infinity },
        );
      } else {
        toast(chatMessage.senderName, {
          description: preview,
          icon: <MessageCircle className="w-4 h-4 text-primary" />,
          action: {
            label: `#${channelName}`,
            onClick: () => navigateRef.current(destination),
          },
          duration: 20_000,
          closeButton: true,
        });
      }
    };

  // Subscribe to every channel once per channels-list / location change.
  // We deliberately avoid re-subscribing on every activeChatChannel change
  // to prevent duplicate listener stacking.
  useEffect(() => {
    if (!isEchoEnabled() || !userDoc || channels.length === 0) return;

    let cancelled = false;

    const subscribeChannel = async (ch: ChatChannel) => {
      const echo = await getEcho();
      if (!echo || cancelled) return;
      // Leave first so any stale listener (from a concurrent re-run or onLeft
      // race) is cleared before we add a fresh one.
      echo.leave(`chat.channels.${ch.id}`);
      echo
        .private(`chat.channels.${ch.id}`)
        .listen(".chat.message.created", makeHandler(ch.id));
    };

    channels.forEach(subscribeChannel);

    // When useChatRealtime leaves a channel, its leave() drops ALL listeners
    // on that channel (including ours). Re-subscribe only that channel after
    // the leave completes so we don't miss messages in the background.
    const unsubscribeLeft = activeChatChannel.onLeft((leftChannelId) => {
      if (cancelled) return;
      const ch = channelsRef.current.find((c) => c.id === leftChannelId);
      if (ch) subscribeChannel(ch);
    });

    return () => {
      cancelled = true;
      unsubscribeLeft();
      getEcho().then((echo) => {
        channels.forEach((ch) => echo?.leave(`chat.channels.${ch.id}`));
      });
    };
  }, [channels, userDoc?.id]);
}
