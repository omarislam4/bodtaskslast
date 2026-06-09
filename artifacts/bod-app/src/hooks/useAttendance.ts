import { useMutation } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { CreateAttendancePayload } from "@/types";

export const attendanceKeys = { all: () => ["attendance"] as const };

export const useLogAttendance = () => {
  const { t } = useLang();
  return useMutation({
    mutationFn: (payload: CreateAttendancePayload) => attendanceService.log(payload),
    onSuccess: (_data, variables) => {
      const msg =
        variables.type === "start"
          ? t.attShiftStarted
          : variables.type === "midday"
          ? t.attMiddayRecorded
          : t.attShiftEnded;
      toast.success(msg);
    },
    onError: () => toast.error(t.errGeneric),
  });
};
