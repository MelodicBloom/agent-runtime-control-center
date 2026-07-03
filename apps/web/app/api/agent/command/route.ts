import { NextRequest, NextResponse } from "next/server";

function parseCommand(raw: string) {
  const parts = raw.trim().split(/\s+/);
  const name = parts[0]?.replace(/^\//, "") ?? "";
  const args = parts.slice(1);
  const modeFlag = args.indexOf("--mode");
  const mode = modeFlag !== -1 ? args[modeFlag + 1] : null;
  return { name, args, mode };
}

const commandRiskMap: Record<string, string> = {
  audit: "low", qa: "low", status: "low", help: "low",
  fix: "medium", branch: "medium", pr: "medium", write: "medium",
  deploy: "high", delete: "high", publish: "high",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const command = parseCommand(body.command ?? "");
  const risk = commandRiskMap[command.name] ?? "medium";
  return NextResponse.json({ ok: true, command, risk, status: "queued" });
}
