const supported = typeof Notification !== "undefined";

export function getPermission(): NotificationPermission {
  return supported ? Notification.permission : "denied";
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!supported) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export interface BrowserNotificationOptions {
  body: string;
  icon?: string;
  /** Collapses duplicate notifications for the same logical event. */
  tag?: string;
  onClick?: () => void;
}

export function showBrowserNotification(
  title: string,
  { body, icon = "/favicon.png", tag, onClick }: BrowserNotificationOptions,
): void {
  if (!supported || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, icon, tag });
  n.onclick = () => {
    window.focus();
    onClick?.();
    n.close();
  };
}
