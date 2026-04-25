import { NextResponse } from "next/server";
import type { IAuthUser, IUserPermissions } from "@/types";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET      = process.env.APPS_SCRIPT_SECRET!;

// Cache RBAC config 10 menit — tidak perlu realtime
let rbacCache: { users: RbacRow[]; timestamp: number } | null = null;
const RBAC_CACHE_MS = 10 * 60 * 1000;

interface RbacRow {
  userId:      string;
  name:        string;
  email:       string;
  role:        string;
  isActive:    boolean;
  passcode:    string;
  permissions: IUserPermissions;
}

async function fetchRbacUsers(): Promise<RbacRow[]> {
  if (rbacCache && Date.now() - rbacCache.timestamp < RBAC_CACHE_MS) {
    return rbacCache.users;
  }

  const url = `${APPS_SCRIPT_URL}?domain=rbac&key=${API_SECRET}`;
  const res  = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`RBAC fetch HTTP ${res.status}`);

  const json = await res.json() as Record<string, unknown>;
  const data  = (json?.data ?? json) as Record<string, unknown>;
  const users = (Array.isArray(data?.users) ? data.users : []) as RbacRow[];

  rbacCache = { users, timestamp: Date.now() };
  return users;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { passcode?: string };
    const passcode = String(body?.passcode ?? "").trim();

    if (!passcode) {
      return NextResponse.json({ error: "Passcode tidak boleh kosong." }, { status: 400 });
    }

    if (!APPS_SCRIPT_URL || !API_SECRET) {
      return NextResponse.json({ error: "Konfigurasi server belum lengkap." }, { status: 503 });
    }

    const users = await fetchRbacUsers();
    const match = users.find(
      (u) => u.passcode === passcode && u.isActive !== false,
    );

    if (!match) {
      return NextResponse.json({ error: "Passcode salah atau akun tidak aktif." }, { status: 401 });
    }

    const authUser: IAuthUser = {
      userId:      match.userId,
      name:        match.name,
      email:       match.email,
      role:        match.role,
      permissions: match.permissions,
    };

    return NextResponse.json({ user: authUser });

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[auth/login]", msg);
    return NextResponse.json(
      { error: "Tidak bisa terhubung ke server. Coba lagi." },
      { status: 500 },
    );
  }
}
