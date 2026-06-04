import type { QueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "@/types";
import { chatKeys } from "./chatKeys";

export function upsertMessage(
  qc: QueryClient,
  channelId: string,
  msg: ChatMessage,
) {
  qc.setQueryData<ChatMessage[]>(chatKeys.messages(channelId), (old) => {
    if (!old) return [msg];
    const idx = old.findIndex((m) => m.id === msg.id);
    if (idx !== -1) {
      const next = [...old];
      next[idx] = msg;
      return next;
    }
    const pendingIdx = old.findIndex(
      (m) => m.pending && m.senderId === msg.senderId && m.text === msg.text,
    );
    if (pendingIdx !== -1) {
      const next = [...old];
      next[pendingIdx] = msg;
      return next;
    }
    return [...old, msg];
  });
}

export function applyReactionToggle(
  qc: QueryClient,
  channelId: string,
  msgId: string,
  emoji: string,
  uid: string,
): void {
  qc.setQueryData<ChatMessage[]>(chatKeys.messages(channelId), (old) => {
    if (!old) return old;
    return old.map((msg) => {
      if (msg.id !== msgId) return msg;
      const reactions = { ...(msg.reactions ?? {}) } as Record<
        string,
        string[]
      >;
      const users = [...(reactions[emoji] ?? [])];
      const idx = users.indexOf(uid);
      if (idx === -1) users.push(uid);
      else users.splice(idx, 1);
      return { ...msg, reactions: { ...reactions, [emoji]: users } };
    });
  });
}

// Tracks how many reaction mutations are in-flight for a channel so the
// WebSocket reaction_updated handler can be suppressed during that window.
const pendingReactions = new Map<string, number>();

export function reactionMutationStart(channelId: string): void {
  pendingReactions.set(channelId, (pendingReactions.get(channelId) ?? 0) + 1);
}

export function reactionMutationEnd(qc: QueryClient, channelId: string): void {
  const next = (pendingReactions.get(channelId) ?? 1) - 1;
  if (next <= 0) {
    pendingReactions.delete(channelId);
    // All in-flight mutations settled — one final refetch confirms server state.
    invalidateMessages(qc, channelId);
  } else {
    pendingReactions.set(channelId, next);
  }
}

export function hasReactionsPending(channelId: string): boolean {
  return (pendingReactions.get(channelId) ?? 0) > 0;
}

export function addPendingMessage(
  qc: QueryClient,
  channelId: string,
  msg: ChatMessage,
): void {
  qc.setQueryData<ChatMessage[]>(chatKeys.messages(channelId), (old) => [
    ...(old ?? []),
    msg,
  ]);
}

export function confirmPendingMessage(
  qc: QueryClient,
  channelId: string,
  tempId: string,
  confirmed: ChatMessage,
): void {
  qc.setQueryData<ChatMessage[]>(chatKeys.messages(channelId), (old) => {
    if (!old) return [confirmed];
    // Remove the temp placeholder (may already be gone if WebSocket arrived first).
    const without = old.filter((m) => m.id !== tempId);
    // Upsert the confirmed message so both orderings of WS vs onSuccess are handled.
    const idx = without.findIndex((m) => m.id === confirmed.id);
    if (idx === -1) return [...without, confirmed];
    const next = [...without];
    next[idx] = confirmed;
    return next;
  });
}

export function removePendingMessage(
  qc: QueryClient,
  channelId: string,
  tempId: string,
): void {
  qc.setQueryData<ChatMessage[]>(
    chatKeys.messages(channelId),
    (old) => old?.filter((m) => m.id !== tempId) ?? [],
  );
}

export function invalidateMessages(qc: QueryClient, channelId: string) {
  qc.invalidateQueries({ queryKey: chatKeys.messages(channelId) });
}

export function invalidateChannels(qc: QueryClient, spaceId?: string) {
  qc.invalidateQueries({ queryKey: chatKeys.channels(spaceId) });
}
