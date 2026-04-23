import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");
  const res = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
