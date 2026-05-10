import { useEffect, useRef } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { sendToWebhook, WebhookSettings } from "./useWebhook";
import { toast } from "sonner";

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export const useShiftReminder = (settings: WebhookSettings, isAdmin: boolean) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAdmin || !settings.webhookUrl) return;

    const check = async () => {
      try {
        const [membersSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "tasks")),
        ]);

        const now = nowMinutes();
        const reminderWindow = settings.reminderMinutes;

        for (const memberDoc of membersSnap.docs) {
          const member = memberDoc.data();
          if (!member.shiftEnd || member.shiftReminderSent) continue;

          const shiftEndMin = timeToMinutes(member.shiftEnd);
          if (shiftEndMin < 0) continue;

          const remaining = shiftEndMin - now;
          if (remaining > 0 && remaining <= reminderWindow) {
            // Find in-progress tasks for this member
            const inProgressTasks = tasksSnap.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((t: Record<string, unknown>) =>
                t.status === "in-progress" &&
                Array.isArray(t.assigneeIds) &&
                (t.assigneeIds as string[]).includes(memberDoc.id)
              );

            if (inProgressTasks.length > 0) {
              const phone = `${member.countryCode || ""}${member.phone || ""}`.replace(/\s/g, "");
              for (const task of inProgressTasks) {
                const t = task as Record<string, unknown>;
                try {
                  await sendToWebhook(settings.webhookUrl, {
                    type: "auto-shift",
                    taskName: t.title as string,
                    taskId: t.id as string,
                    deadline: t.deadline ? String(t.deadline) : undefined,
                    phone,
                    assigneeIds: t.assigneeIds as string[],
                    source: "dashboard",
                  }, t.id as string);
                } catch {
                  // continue to next
                }
              }

              // Mark as sent to avoid duplicates
              await updateDoc(doc(db, "users", memberDoc.id), { shiftReminderSent: true });
              toast.info(`Shift reminder sent to ${member.displayName || member.email}`);
            }
          }
        }
      } catch {
        // fail silently — background task
      }
    };

    // Run immediately, then every 60 seconds
    check();
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAdmin, settings.webhookUrl, settings.reminderMinutes]);
};
