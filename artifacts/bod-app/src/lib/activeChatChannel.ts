type Listener = (channelId: string | null) => void;
type LeftListener = (channelId: string) => void;

const listeners = new Set<Listener>();
const leftListeners = new Set<LeftListener>();
let current: string | null = null;

export const activeChatChannel = {
  get: (): string | null => current,

  set(id: string | null) {
    current = id;
    listeners.forEach((fn) => fn(id));
  },

  /** Called after Echo.leave() completes so notifications can re-subscribe. */
  notifyLeft(channelId: string) {
    leftListeners.forEach((fn) => fn(channelId));
  },

  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  onLeft(fn: LeftListener): () => void {
    leftListeners.add(fn);
    return () => leftListeners.delete(fn);
  },
};
