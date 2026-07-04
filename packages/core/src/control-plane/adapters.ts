import type { AdapterResult, CommandAdapter, CommandEnvelope, CommandSource } from "./types";

interface TextAdapterInput {
  actor: string;
  rawInput: string;
  callbackId: string;
  callbackUrl?: string;
}

function inferIntent(rawInput: string): string {
  const text = rawInput.trim().toLowerCase();

  if (text.startsWith("/audit")) return "repo.audit";
  if (text.startsWith("/status")) return "repo.status";
  if (text.startsWith("/plan")) return "repo.plan";
  if (text.startsWith("/design-review")) return "repo.design_review";
  if (text.startsWith("/build-check")) return "repo.build_check";
  if (text.startsWith("/fix")) return "repo.fix_plan";

  return "general.plan";
}

function inferRepoTarget(rawInput: string): string {
  const match = rawInput.match(/[\w.-]+\/[\w.-]+/);
  return match?.[0] ?? "unknown";
}

function inferCapability(intent: string) {
  if (intent === "repo.build_check") return "execute_check" as const;
  if (intent === "repo.fix_plan") return "plan" as const;
  if (intent.includes("audit") || intent.includes("status")) return "read" as const;
  return "plan" as const;
}

function normalizeTextCommand(source: CommandSource, input: TextAdapterInput): AdapterResult {
  const intent = inferIntent(input.rawInput);
  const repo = inferRepoTarget(input.rawInput);
  const requestedCapability = inferCapability(intent);

  const envelope: CommandEnvelope = {
    source,
    actor: input.actor,
    rawInput: input.rawInput,
    intent,
    target: {
      type: repo === "unknown" ? "unknown" : "github_repo",
      id: repo,
    },
    requestedCapability,
    callback: {
      type: source === "chatgpt" ? "chatgpt_thread" : "perplexity_thread",
      id: input.callbackId,
      url: input.callbackUrl,
    },
    idempotencyKey: `${source}:${input.actor}:${Buffer.from(input.rawInput).toString("base64url")}`,
    receivedAt: new Date().toISOString(),
  };

  return {
    envelope,
    warnings: repo === "unknown" ? ["No GitHub repository target detected."] : [],
  };
}

export const chatgptAdapter: CommandAdapter = {
  source: "chatgpt",
  normalize(input: unknown): AdapterResult {
    return normalizeTextCommand("chatgpt", input as TextAdapterInput);
  },
};

export const perplexityAdapter: CommandAdapter = {
  source: "perplexity",
  normalize(input: unknown): AdapterResult {
    return normalizeTextCommand("perplexity", input as TextAdapterInput);
  },
};
