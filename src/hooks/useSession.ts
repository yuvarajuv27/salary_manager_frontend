import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "../lib/api";
import type { SessionResponse } from "../types/api";

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<SessionResponse | null> => {
      try {
        return (await apiRequest("/session")) as SessionResponse;
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          (error as { status: number }).status === 401
        ) {
          return null;
        }
        throw error;
      }
    },
  });
}
