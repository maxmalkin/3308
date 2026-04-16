// client/app/api/user/shows/[showId]/route.ts
// Handles PATCH (update status) and DELETE (remove show)
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { showId: string } }
) {
  const token = req.headers.get("Authorization");
  const body = await req.json();

  const res = await fetch(`${API_URL}/api/user/shows/${params.showId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { showId: string } }
) {
  const token = req.headers.get("Authorization");

  const res = await fetch(`${API_URL}/api/user/shows/${params.showId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
