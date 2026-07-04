import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "agent-operations-center-gateway",
    version: "v0",
  });
}
