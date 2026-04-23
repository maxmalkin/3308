import { type NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(req: NextRequest) {
  const token = req.headers.get("Authorization");
  const qs = req.nextUrl.search;
  const res = await fetch(`${API_URL}/api/notifications${qs}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("Authorization");
  const res = await fetch(`${API_URL}/api/notifications`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
