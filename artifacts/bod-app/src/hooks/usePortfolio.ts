import { useQuery } from "@tanstack/react-query";
import { portfolioService } from "@/services/portfolio";

export const portfolioKeys = {
  all: () => ["portfolio"] as const,
};

export const usePortfolio = () =>
  useQuery({
    queryKey: portfolioKeys.all(),
    queryFn: portfolioService.get,
  });
