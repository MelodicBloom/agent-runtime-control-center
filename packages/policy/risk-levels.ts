export type RiskLevel = "low" | "medium" | "high";

export const commandRiskMap: Record<string, RiskLevel> = {
  audit: "low",
  qa: "low",
  status: "low",
  help: "low",
  fix: "medium",
  branch: "medium",
  pr: "medium",
  write: "medium",
  deploy: "high",
  delete: "high",
  publish: "high",
  secrets: "high",
};

export function classifyCommandRisk(command: string): RiskLevel {
  return commandRiskMap[command.toLowerCase()] ?? "medium";
}
