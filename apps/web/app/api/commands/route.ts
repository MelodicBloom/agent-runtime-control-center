import { NextRequest, NextResponse } from "next/server";
import {
  chatgptAdapter,
  createTaskRecord,
  perplexityAdapter,
  type CommandSource,
} from "../../../../../packages/core/src/control-plane";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.CONTROL_PLANE_API_KEY;
  if (!expected) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}

function adapterFor(source: CommandSource) {
  if (source === "chatgpt") return chatgptAdapter;
  if (source === "perplexity") return perplexityAdapter;
  return chatgptAdapter;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) return unauthorized();

  const body = await request.json();
  const source = (body.source ?? "chatgpt") as CommandSource;
  const adapter = adapterFor(source);

  const result = await adapter.normalize({
    actor: body.actor ?? "qt314wink",
    rawInput: body.rawInput,
    callbackId: body.callbackId ?? "manual",
    callbackUrl: body.callbackUrl,
  });

  const task = createTaskRecord(result.envelope);

  // TODO: persist task, logs, workflow run, and approval request in Neon.
  // This route currently returns the normalized task so ChatGPT, Perplexity,
  // Telegram, and tests can verify the control-plane contract before writes.

  return NextResponse.json({
    task,
    warnings: result.warnings,
  });
}
