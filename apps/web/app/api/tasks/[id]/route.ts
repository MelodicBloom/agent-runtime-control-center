import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CONTROL_PLANE_API_KEY;
  if (!expected) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(request)) return unauthorized();

  const { id } = await context.params;

  // TODO: fetch the task, approvals, logs, workflow runs, action runs,
  // and artifacts from Neon by task id.

  return NextResponse.json({
    id,
    status: "not_persisted_yet",
    nextAction: "Wire this route to Neon tasks/task_logs/approvals tables.",
  });
}
