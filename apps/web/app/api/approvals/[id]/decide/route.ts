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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isAuthorized(request)) return unauthorized();

  const { id } = await context.params;
  const body = await request.json();
  const decision = body.decision;

  if (decision !== "approved" && decision !== "rejected") {
    return NextResponse.json(
      { error: "Decision must be approved or rejected." },
      { status: 400 },
    );
  }

  // TODO: update approval status in Neon, append task log,
  // and resume the gated workflow/action if approved.

  return NextResponse.json({
    id,
    decision,
    status: "decision_received_not_persisted_yet",
    nextAction: "Wire this route to Neon approvals/task_logs and workflow resume logic.",
  });
}
