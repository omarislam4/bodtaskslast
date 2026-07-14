import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendance";
import { useLang } from "@/contexts/LangContext";
import { toast } from "sonner";
import type { AttendanceQueryParams, AttendanceSummaryQueryParams, CreateAttendancePayload } from "@/types";

export const attendanceKeys = {
  all: () => ["attendance"] as const,
  status: (date?: string) => ["attendance", "status", date ?? "today"] as const,
  current: (date?: string) => ["attendance", "current", date ?? "today"] as const,
  summary: (params?: AttendanceSummaryQueryParams) => ["attendance", "summary", params] as const,
  records: (params?: AttendanceQueryParams) => ["attendance", "records", params] as const,
};

export const useAttendanceRecords = (params?: AttendanceQueryParams) =>
  useQuery({
    queryKey: attendanceKeys.records(params),
    queryFn: () => attendanceService.list(params),
  });

export const useAttendanceStatus = (date?: string) =>
  useQuery({
    queryKey: attendanceKeys.status(date),
    queryFn: () => attendanceService.getStatus(date),
  });

export const useAttendanceCurrent = (date?: string) =>
  useQuery({
    queryKey: attendanceKeys.current(date),
    queryFn: () => attendanceService.getCurrent(date),
  });

export const useAttendanceSummary = (params?: AttendanceSummaryQueryParams) =>
  useQuery({
    queryKey: attendanceKeys.summary(params),
    queryFn: () => attendanceService.getSummary(params),
  });

export const useLogAttendance = () => {
  const { t } = useLang();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAttendancePayload) => attendanceService.log(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all() });
      const msg =
        variables.type === "start"
          ? t.attShiftStarted
          : variables.type === "midday"
          ? t.attMiddayRecorded
          : variables.type === "pause"
          ? t.pauseShiftToast
          : variables.type === "resume"
          ? t.resumeShiftToast
          : t.attShiftEnded;
      toast.success(msg);
    },
    onError: () => toast.error(t.errGeneric),
  });
};
