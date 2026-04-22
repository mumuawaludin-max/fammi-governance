import useSWR from "swr";
import type { IApiResponse, ISchoolDelivery } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOpsData() {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<ISchoolDelivery[]>>(
    "/api/ops",
    fetcher,
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false }
  );
  return {
    data: data?.data ?? [],
    error,
    isLoading,
    refresh: mutate,
    lastUpdated: data?.lastUpdated,
  };
}
