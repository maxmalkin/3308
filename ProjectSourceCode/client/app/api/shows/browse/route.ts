import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { search } = new URL(req.url);
  const token = req.headers.get("Authorization");

  const res = await fetch(`${API_URL}/api/shows/browse${search}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
