// Using a loose type for the Echo instance — laravel-echo's generic parameter
// is an internal broadcaster discriminant, not a public API concern.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EchoInstance = any;

let instance: EchoInstance | null = null;

export function isEchoEnabled(): boolean {
  return !!import.meta.env.VITE_REVERB_APP_KEY;
}

/**
 * Returns a lazily-created Echo singleton backed by Laravel Reverb.
 * Safe to call multiple times — always returns the same instance.
 * Returns null when VITE_REVERB_APP_KEY is not configured.
 */
export async function getEcho(): Promise<EchoInstance | null> {
  if (!isEchoEnabled()) {
    console.warn("[Echo] Disabled — VITE_REVERB_APP_KEY is not set");
    return null;
  }
  if (instance) return instance;

  console.log("[Echo] Initialising Reverb connection…");

  const [{ default: Pusher }, { default: EchoLib }, { default: api }] =
    await Promise.all([
      import("pusher-js"),
      import("laravel-echo"),
      import("@/services/api"),
    ]);

  window.Pusher = Pusher;

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  const scheme = import.meta.env.VITE_REVERB_SCHEME ?? "https";

  console.log("[Echo] Config →", {
    key: import.meta.env.VITE_REVERB_APP_KEY,
    host: import.meta.env.VITE_REVERB_HOST,
    port: import.meta.env.VITE_REVERB_PORT,
    scheme,
    authEndpoint: `${apiBaseUrl}/api/broadcasting/auth`,
  });

  instance = new EchoLib({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: scheme === "https",
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${apiBaseUrl}/api/broadcasting/auth`,
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: boolean, data: unknown) => void,
      ) => {
        api
          .post(`${apiBaseUrl}/api/broadcasting/auth`, {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((response) => { console.log("[Echo] Auth success"); callback(false, response.data); })
          .catch((error) => { console.error("[Echo] Auth failed", error); callback(true, error); });
      },
    }),
  });

  instance.connector.pusher.connection.bind("connected", () =>
    console.log("[Echo] WebSocket connected ✓")
  );
  instance.connector.pusher.connection.bind("error", (err: unknown) =>
    console.error("[Echo] WebSocket error", err)
  );
  instance.connector.pusher.connection.bind("disconnected", () =>
    console.warn("[Echo] WebSocket disconnected")
  );

  return instance;
}

export function disconnectEcho(): void {
  instance?.disconnect();
  instance = null;
}
