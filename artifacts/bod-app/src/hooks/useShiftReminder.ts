import { useEffect, useRef } from "react";
import { sendToWebhook, WebhookSettings } from "./useWebhook";
import { usersService } from "@/services/users";
import { tasksService } from "@/services/tasks";
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
        const [members, tasks] = await Promise.all([
          usersService.list(),
          tasksService.list(),
        ]);

        const now = nowMinutes();
        const reminderWindow = settings.reminderMinutes;

        for (const member of members) {
          if (!member.shiftEnd || member.shiftReminderSent) continue;

          const shiftEndMin = timeToMinutes(member.shiftEnd);
          if (shiftEndMin < 0) continue;

          const remaining = shiftEndMin - now;
          if (remaining > 0 && remaining <= reminderWindow) {
            const inProgressTasks = tasks.filter(
              (t) =>
                t.status === "in-progress" &&
                Array.isArray(t.assigneeIds) &&
                t.assigneeIds.includes(member.id)
            );

            if (inProgressTasks.length > 0) {
              const phone = `${member.countryCode || ""}${member.phone || ""}`.replace(/\s/g, "");
              for (const task of inProgressTasks) {
                try {
                  await sendToWebhook(settings.webhookUrl, {
                    type: "auto-shift",
                    taskName: task.title,
                    taskId: task.id,
                    deadline: task.deadline ?? undefined,
                    phone,
                    assigneeIds: task.assigneeIds,
                    source: "dashboard",
                  });
                } catch {
                  // continue to next
                }
              }

              try {
                await usersService.update(member.id, { shiftReminderSent: true });
              } catch {
                // non-critical
              }
              toast.info(`Shift reminder sent to ${member.displayName || member.email}`);
            }
          }
        }
      } catch {
        // fail silently — background task
      }
    };

    check();
    intervalRef.current = setInterval(check, 60_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAdmin, settings.webhookUrl, settings.reminderMinutes]);
};
