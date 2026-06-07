import type { QueryClient, InfiniteData } from "@tanstack/react-query";
import type { ChatMessage, PaginatedMessagesResponse } from "@/types";
import { chatKeys } from "./chatKeys";

type InfiniteMessages = InfiniteData<PaginatedMessagesResponse>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function updateInfiniteMessages(
  qc: QueryClient,
  channelId: string,
  updater: (pages: PaginatedMessagesResponse[]) => PaginatedMessagesResponse[],
) {
  qc.setQueryData<InfiniteMessages>(chatKeys.messagesInfinite(channelId), (old) => {
    if (!old) return old;
    return { ...old, pages: updater(old.pages) };
  });
}

// ─── Realtime / cache sync ────────────────────────────────────────────────────

/** Insert or replace a message across all pages. If not found, appends to the newest page (index 0). */
export function upsertMessage(qc: QueryClient, channelId: string, msg: ChatMessage) {
  updateInfiniteMessages(qc, channelId, (pages) => {
    let found = false;
    const updated = pages.map((page) => {
      const idx = page.data.findIndex((m) => m.id === msg.id);
      if (idx !== -1) {
        found = true;
        const data = [...page.data];
        data[idx] = msg;
        return { ...page, data };
      }
      // Match a pending message by sender + text
      const pendingIdx = page.data.findIndex(
        (m) => m.pending && m.senderId === msg.senderId && m.text === msg.text,
      );
      if (pendingIdx !== -1) {
        found = true;
        const data = [...page.data];
        data[pendingIdx] = msg;
        return { ...page, data };
      }
      return page;
    });
    if (!found && updated.length > 0) {
      updated[0] = { ...updated[0], data: [...updated[0].data, msg] };
    }
    return updated;
  });
}

// ─── Optimistic send ──────────────────────────────────────────────────────────

/** Append a pending message to the newest page (index 0). */
export function addPendingMessage(qc: QueryClient, channelId: string, msg: ChatMessage) {
  updateInfiniteMessages(qc, channelId, (pages) => {
    if (pages.length === 0) return pages;
    const updated = [...pages];
    updated[0] = { ...updated[0], data: [...updated[0].data, msg] };
    return updated;
  });
}

/** Replace the temp pending message with the server-confirmed message. */
export function confirmPendingMessage(
  qc: QueryClient,
  channelId: string,
  tempId: string,
  confirmed: ChatMessage,
) {
  updateInfiniteMessages(qc, channelId, (pages) => {
    let found = false;
    const updated = pages.map((page) => {
      const without = page.data.filter((m) => m.id !== tempId);
      const hadTemp = without.length !== page.data.length;
      const existingIdx = without.findIndex((m) => m.id === confirmed.id);
      if (hadTemp || existingIdx !== -1) {
        found = true;
        const data = existingIdx !== -1 ? [...without] : [...without, confirmed];
        if (existingIdx !== -1) data[existingIdx] = confirmed;
        return { ...page, data };
      }
      return page;
    });
    if (!found && updated.length > 0) {
      updated[0] = { ...updated[0], data: [...updated[0].data, confirmed] };
    }
    return updated;
  });
}

/** Remove a pending message that failed to send. */
export function removePendingMessage(qc: QueryClient, channelId: string, tempId: string) {
  updateInfiniteMessages(qc, channelId, (pages) =>
    pages.map((page) => ({ ...page, data: page.data.filter((m) => m.id !== tempId) })),
  );
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export function applyReactionToggle(
  qc: QueryClient,
  channelId: string,
  msgId: string,
  emoji: string,
  uid: string,
) {
  updateInfiniteMessages(qc, channelId, (pages) =>
    pages.map((page) => ({
      ...page,
      data: page.data.map((msg) => {
        if (msg.id !== msgId) return msg;
        const reactions = { ...(msg.reactions ?? {}) } as Record<string, string[]>;
        const users = [...(reactions[emoji] ?? [])];
        const idx = users.indexOf(uid);
        if (idx === -1) users.push(uid);
        else users.splice(idx, 1);
        return { ...msg, reactions: { ...reactions, [emoji]: users } };
      }),
    })),
  );
}

// Tracks how many reaction mutations are in-flight for a channel.
const pendingReactions = new Map<string, number>();

export function reactionMutationStart(channelId: string): void {
  pendingReactions.set(channelId, (pendingReactions.get(channelId) ?? 0) + 1);
}

export function reactionMutationEnd(qc: QueryClient, channelId: string): void {
  const next = (pendingReactions.get(channelId) ?? 1) - 1;
  if (next <= 0) {
    pendingReactions.delete(channelId);
    invalidateMessages(qc, channelId);
  } else {
    pendingReactions.set(channelId, next);
  }
}

export function hasReactionsPending(channelId: string): boolean {
  return (pendingReactions.get(channelId) ?? 0) > 0;
}

// ─── Invalidation ─────────────────────────────────────────────────────────────

export function invalidateMessages(qc: QueryClient, channelId: string) {
  qc.invalidateQueries({ queryKey: chatKeys.messagesInfinite(channelId) });
}

export function invalidateChannels(qc: QueryClient, spaceId?: string) {
  qc.invalidateQueries({ queryKey: chatKeys.channels(spaceId) });
}
