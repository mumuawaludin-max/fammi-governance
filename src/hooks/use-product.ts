import useSWR from "swr";
import type { IApiResponse, IFeature } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface IProductData {
  features: IFeature[];
  csatAvg: number;
  csatEntries: unknown[];
}

export function useProductData() {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<IProductData>>(
    "/api/product",
    fetcher,
    { refreshInterval: 10 * 60 * 1000, revalidateOnFocus: false }
  );
  return {
    data: data?.data,
    features: data?.data?.features ?? [],
    csatAvg: data?.data?.csatAvg ?? 0,
    error,
    isLoading,
    refresh: mutate,
    lastUpdated: data?.lastUpdated,
  };
}
