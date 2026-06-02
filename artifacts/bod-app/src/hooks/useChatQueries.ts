import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chat";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { CreateChannelPayload, SendMessagePayload } from "@/types";

export const chatKeys = {
  channels: (spaceId?: string) =>
    spaceId ? (["chat", "channels", spaceId] as const) : (["chat", "channels"] as const),
  messages: (channelId: string) => ["chat", "messages", channelId] as const,
};

export const useSpaceChannels = (spaceId?: string) =>
  useQuery({
    queryKey: chatKeys.channels(spaceId),
    queryFn: () => chatService.listChannels(spaceId),
    enabled: spaceId === undefined || spaceId.length > 0,
  });

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateChannelPayload) => chatService.createChannel(payload),
    onSuccess: (channel) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.channels(channel.spaceId ?? undefined),
      });
    },
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
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatService.sendMessage(channelId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: ({ msgId, text }: { msgId: string; text: string }) =>
      chatService.editMessage(msgId, { text }),
    onSuccess: (msg) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(msg.channelId) });
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteMessage = (channelId: string) => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (msgId: string) => chatService.deleteMessage(msgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  const { t } = useLang();
  return useMutation({
    mutationFn: (channelId: string) => chatService.deleteChannel(channelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.channels() });
    },
    onError: () => toast.error(t.errGeneric),
  });
};

export const useToggleReaction = (channelId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ msgId, emoji }: { msgId: string; emoji: string }) =>
      chatService.toggleReaction(msgId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
    },
  });
};
