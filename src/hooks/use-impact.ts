import useSWR from "swr";
import type { IApiResponse, ISocialImpact } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useImpactData() {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<ISocialImpact>>(
    "/api/impact",
    fetcher,
    { refreshInterval: 15 * 60 * 1000, revalidateOnFocus: false }
  );
  return {
    data: data?.data,
    error,
    isLoading,
    refresh: mutate,
    lastUpdated: data?.lastUpdated,
  };
}
