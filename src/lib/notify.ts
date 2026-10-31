// Optional system notifications for bus reminders. The in-app alert always shows;
// this only adds a phone/desktop notification when the student has allowed it.
export type NotifState = "unsupported" | "default" | "granted" | "denied";

export function notifState(): NotifState {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestNotif(): Promise<NotifState> {
  if (notifState() === "unsupported") return "unsupported";
  return Notification.requestPermission();
}

export function sendNotif(title: string, body: string, tag: string) {
  if (notifState() !== "granted") return;
  try {
    new Notification(title, { body, tag, icon: "/favicon.png" });
  } catch {
    // Some mobile browsers only allow notifications from a service worker; the in-app alert still shows.
  }
  navigator.vibrate?.([180, 80, 180]);
}
