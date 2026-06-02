/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUSHER_APP_KEY: string;
  readonly VITE_PUSHER_APP_CLUSTER: string;
  // Optional — defaults to /broadcasting/auth if omitted
  readonly VITE_PUSHER_AUTH_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// laravel-echo sets this before initialising the Pusher broadcaster
interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Pusher: any;
}
