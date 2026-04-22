import useSWR from "swr";
import type { IApiResponse, IFinanceHealth } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFinanceHealth() {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<IFinanceHealth>>(
    "/api/finance/health",
    fetcher,
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false }
  );
  return {
    data: data?.data,
    error,
    isLoading,
    refresh: mutate,
    lastUpdated: data?.lastUpdated,
  };
}
