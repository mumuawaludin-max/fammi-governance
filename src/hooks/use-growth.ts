import useSWR from "swr";
import type { IApiResponse, ISalesLead, IPartnership } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface IGrowthData {
  leads: ISalesLead[];
  partnerships: IPartnership[];
  wpv: number;
  staleLeads: number;
}

export function useGrowthData() {
  const { data, error, isLoading, mutate } = useSWR<IApiResponse<IGrowthData>>(
    "/api/growth",
    fetcher,
    { refreshInterval: 10 * 60 * 1000, revalidateOnFocus: false }
  );
  return {
    data: data?.data,
    leads: data?.data?.leads ?? [],
    partnerships: data?.data?.partnerships ?? [],
    wpv: data?.data?.wpv ?? 0,
    staleLeads: data?.data?.staleLeads ?? 0,
    error,
    isLoading,
    refresh: mutate,
    lastUpdated: data?.lastUpdated,
  };
}
