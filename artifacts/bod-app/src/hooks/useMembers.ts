import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users";
import type { UserDoc } from "@/types";

export type { UserDoc };

export const memberKeys = {
  all: () => ["members"] as const,
};

export const useMembers = () => {
  const query = useQuery({
    queryKey: memberKeys.all(),
    queryFn: usersService.list,

  });

  return {
    members: query.data ?? [],
    loading: query.isLoading,
    ...query,
  };
};
