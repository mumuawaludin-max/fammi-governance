"use client";

import useSWR from "swr";
import type { IUserAccount } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR<{
    data: IUserAccount[];
    cached?: boolean;
    seed?: boolean;
  }>("/api/users", fetcher, {
    refreshInterval: 10 * 60 * 1000,
    revalidateOnFocus: false,
  });

  return {
    users: data?.data ?? [],
    isSeed: data?.seed ?? false,
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useUserByEmail(email: string | null) {
  const { users, isLoading } = useUsers();
  return {
    user: email ? users.find((u) => u.email === email) ?? null : null,
    isLoading,
  };
}
