import { NextRequest, NextResponse } from "next/server";
import {
  chatgptAdapter,
  createTaskRecord,
  perplexityAdapter,
  type CommandSource,
} from "../../../../../../packages/core/src/control-plane";

type GatewayClient = {
  source: CommandSource;
  keyName: string;
};

const clients: GatewayClient[] = [
  { source: "chatgpt", keyName: "GATEWAY_CHATGPT_KEY" },
  { source: "perplexity", keyName: "GATEWAY_PERPLEXITY_KEY" },
  { source: "telegram", keyName: "GATEWAY_TELEGRAM_KEY" },
  { source: "dashboard", keyName: "GATEWAY_DASHBOARD_KEY" },
];

function getBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

function identifyClient(request: NextRequest): GatewayClient | null {
  const token = getBearerToken(request);
  if (!token) return null;

  for (const client of clients) {
    const expected = process.env[client.keyName];
    if (expected && token === expected) return client;
  }

  return null;
}

function adapterFor(source: CommandSource) {
  if (source === "perplexity") return perplexityAdapter;
  return chatgptAdapter;
}

export async function POST(request: NextRequest) {
  const client = identifyClient(request);
  if (!client) {
    return NextResponse.json({ error: "Unauthorized gateway client" }, { status: 401 });
  }

  const body = await request.json();
  const adapter = adapterFor(client.source);

  const result = await adapter.normalize({
    actor: body.actor ?? "qt314wink",
    rawInput: body.rawInput,
    callbackId: body.callbackId ?? `${client.source}:manual`,
    callbackUrl: body.callbackUrl,
  });

  const task = createTaskRecord({
    ...result.envelope,
    source: client.source,
  });

  // TODO: persist task, logs, workflow runs, and approvals in Neon.
  // TODO: dispatch allowed read/plan workflows after persistence.

  return NextResponse.json({
    accepted: true,
    source: client.source,
    task: {
      id: task.id,
      intent: task.envelope.intent,
      target: task.envelope.target,
      status: task.status,
      riskLevel: task.riskLevel,
      approvalRule: task.approvalRule,
      nextAction: task.nextAction,
    },
    warnings: result.warnings,
  });
}
