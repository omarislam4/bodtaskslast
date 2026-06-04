import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat";
import { useLang } from "@/contexts/LangContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { CreateChannelPayload, SendMessagePayload } from "@/types";
import { chatKeys } from "./chatKeys";
import {
  upsertMessage,
  addPendingMessage,
  confirmPendingMessage,
  removePendingMessage,
  applyReactionToggle,
  reactionMutationStart,
  reactionMutationEnd,
  invalidateMessages,
  invalidateChannels,
} from "./chatCache";

export { chatKeys };

export const useSpaceChannels = (spaceId?: string) =>
  useQuery({
    queryKey: chatKeys.channels(spaceId),
    queryFn: () => chatService.listChannels(spaceId),
    enabled: spaceId === undefined || spaceId.length > 0,
  });

export const useCreateChannel = () => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => chatService.createChannel(payload),
    onSuccess: (channel) => invalidateChannels(qc, channel.spaceId ?? undefined),
    onError: () => toast.error(t.errCreateChannel),
  });
};

export const useChannelMessages = (channelId: string) =>
  useQuery({
    queryKey: chatKeys.messages(channelId),
    queryFn: () => chatService.listMessages(channelId),
    enabled: !!channelId,
    staleTime: 0,
  });

export const useSendMessage = (channelId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  const { userDoc } = useAuth();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatService.sendMessage(channelId, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: chatKeys.messages(channelId) });
      const tempId = `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      addPendingMessage(qc, channelId, {
        id: tempId,
        channelId,
        senderId: userDoc?.id ?? "",
        senderName: userDoc?.displayName ?? "",
        text: payload.text,
        mentions: payload.mentions ?? [],
        replyTo: payload.replyTo ?? null,
        reactions: {},
        deleted: false,
        createdAt: new Date().toISOString(),
        pending: true,
      });
      return { tempId };
    },
    onSuccess: (serverMsg, _vars, context) => {
      confirmPendingMessage(qc, channelId, context.tempId, serverMsg);
    },
    onError: (_err, _vars, context) => {
      removePendingMessage(qc, channelId, context.tempId);
      toast.error(t.errGeneric);
    },
  });
};

export const useEditMessage = () => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ msgId, text }: { msgId: string; text: string }) =>
      chatService.editMessage(msgId, { text }),
    onSuccess: (msg) => invalidateMessages(qc, msg.channelId),
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteMessage = (channelId: string) => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (msgId: string) => chatService.deleteMessage(msgId),
    onSuccess: () => invalidateMessages(qc, channelId),
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteChannel = () => {
  const qc = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (channelId: string) => chatService.deleteChannel(channelId),
    onSuccess: () => invalidateChannels(qc),
    onError: () => toast.error(t.errGeneric),
  });
};

export const useToggleReaction = (channelId: string) => {
  const qc = useQueryClient();
  const { userDoc } = useAuth();
  const uid = userDoc?.id ?? "";
  return useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) =>
      chatService.toggleReaction(msgId, emoji),
    onMutate: async ({ msgId, emoji }) => {
      reactionMutationStart(channelId);
      // Apply optimistically before the first await so the UI updates in the
      // same render cycle with zero visible delay.
      applyReactionToggle(qc, channelId, msgId, emoji, uid);
      await qc.cancelQueries({ queryKey: chatKeys.messages(channelId) });
    },
    onError: (_err, { msgId, emoji }) => {
      // Re-toggling is its own inverse — no snapshot needed, and it is safe
      // when multiple mutations are in-flight simultaneously.
      applyReactionToggle(qc, channelId, msgId, emoji, uid);
    },
    onSettled: () => reactionMutationEnd(qc, channelId),
  });
};
