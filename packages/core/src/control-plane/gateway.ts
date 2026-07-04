import type { CommandSource } from "./types";

export interface GatewayRequestBody {
  source?: CommandSource;
  actor?: string;
  command?: string;
  rawInput?: string;
  callbackId?: string;
  callbackUrl?: string;
  clientRequestId?: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedGatewayCommand {
  source: CommandSource;
  actor: string;
  rawInput: string;
  callbackId: string;
  callbackUrl?: string;
  clientRequestId?: string;
  metadata: Record<string, unknown>;
}

export function normalizeGatewayRequest(body: GatewayRequestBody): NormalizedGatewayCommand {
  const rawInput = body.rawInput ?? body.command;

  if (!rawInput || typeof rawInput !== "string") {
    throw new Error("Gateway request requires `command` or `rawInput`.");
  }

  return {
    source: body.source ?? "api",
    actor: body.actor ?? "qt314wink",
    rawInput,
    callbackId: body.callbackId ?? body.clientRequestId ?? "gateway",
    callbackUrl: body.callbackUrl,
    clientRequestId: body.clientRequestId,
    metadata: body.metadata ?? {},
  };
}
