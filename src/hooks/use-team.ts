import useSWR from "swr";
import type { IApiResponse, ITeamCheckin } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTeamData() {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<ITeamCheckin>>(
    "/api/team",
    fetcher,
    { refreshInterval: 60 * 60 * 1000, revalidateOnFocus: false } // 1 jam
  );
  return {
    data: data?.data,
    error,
    isLoading,
    refresh: mutate,
    lastUpdated: data?.lastUpdated,
  };
}
