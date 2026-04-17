import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  const res = await fetch(`${API_URL}/api/auth/signout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
