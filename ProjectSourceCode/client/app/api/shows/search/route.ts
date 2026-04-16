// client/app/api/shows/search/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? "";
  const page = searchParams.get("page") ?? "1";

  const token = req.headers.get("Authorization");

  const res = await fetch(
    `${API_URL}/api/shows/search?query=${encodeURIComponent(query)}&page=${page}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
    }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
