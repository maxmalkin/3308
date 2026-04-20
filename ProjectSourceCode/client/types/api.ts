import type { ApiError } from "@/utils/api";
import type { Show, UserShow } from "./show";
import type { StreamingService } from "./streaming";

export type Session = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user?: unknown;
};

export type ResourceStatus = "loading" | "unauth" | "ready" | "error";

export type Resource<T> = {
  data: T | null;
  status: ResourceStatus;
  error: ApiError | null;
};

export type Profile = {
  user: {
    id: string;
    username: string;
    email: string;
    owned_services: StreamingService[] | string[];
  };
};

export type ShowResp = { show: Show };
export type ShowsResp = { shows: UserShow[] };
export type UserShowResp = ShowsResp;
export type RecsResp = {
  results: Show[];
  message?: string;
  source?: "embedding" | "popular";
};
export type RecommendationsResponse = RecsResp;
export type ShowcaseResp = { results: Show[] };
export type RelatedResp = { results: Show[] };

export type Notification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};
