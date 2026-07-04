import { NextRequest, NextResponse } from "next/server";
import { runSetupDoctor } from "../../../../../packages/core/src/setup-doctor";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CONTROL_PLANE_API_KEY ?? process.env.GATEWAY_DASHBOARD_KEY;
  if (!expected) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const report = runSetupDoctor(process.env);

  return NextResponse.json({
    ...report,
    note: "Setup Doctor reports presence/absence only. Secret values are never returned.",
  });
}
