import api from "./api";

export interface PortfolioMember {
  id: string;
  displayName: string;
  email: string;
}

export type HealthStatus = "on_track" | "at_risk" | "off_track";

export interface PortfolioProject {
  id: string;
  name: string;
  description?: string;
  color: string;
  healthStatus: HealthStatus;
  totalTasks: number;
  completedTasks: number;
  completionPercent: number;
  overdueTasks: number;
  memberCount: number;
  members: PortfolioMember[];
}

export interface PortfolioData {
  summary: {
    onTrack: number;
    atRisk: number;
    offTrack: number;
    projectCount: number;
  };
  projects: PortfolioProject[];
}

export const portfolioService = {
  get: (): Promise<PortfolioData> =>
    api.get("/portfolio").then((r) => r.data),
};
