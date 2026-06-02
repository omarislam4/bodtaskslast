// Using a loose type for the Echo instance — laravel-echo's generic parameter
// is an internal broadcaster discriminant, not a public API concern.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EchoInstance = any;

let instance: EchoInstance | null = null;

export function isEchoEnabled(): boolean {
  return !!import.meta.env.VITE_PUSHER_APP_KEY;
}

/**
 * Returns a lazily-created Echo singleton.
 * Safe to call multiple times — always returns the same instance.
 * Returns null when VITE_PUSHER_APP_KEY is not configured (dev / no Pusher).
 */
export async function getEcho(): Promise<EchoInstance | null> {
  if (!isEchoEnabled()) return null;
  if (instance) return instance;

  // Dynamic imports keep pusher-js out of the initial bundle
  const [{ default: Pusher }, { default: EchoLib }] = await Promise.all([
    import("pusher-js"),
    import("laravel-echo"),
  ]);

  // laravel-echo needs Pusher on window before initialisation
  window.Pusher = Pusher;

  instance = new EchoLib({
    broadcaster: "pusher",
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: import.meta.env.VITE_PUSHER_AUTH_ENDPOINT ?? "/broadcasting/auth",
  });

  return instance;
}

export function disconnectEcho(): void {
  instance?.disconnect();
  instance = null;
}
