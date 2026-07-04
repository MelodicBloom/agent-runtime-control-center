export type SetupSeverity = "required" | "recommended" | "optional";
export type SetupStatus = "pass" | "warn" | "fail";

export interface SetupCheckDefinition {
  id: string;
  label: string;
  env: string;
  category:
    | "gateway"
    | "control-plane"
    | "database"
    | "github"
    | "ai"
    | "deployment"
    | "messaging";
  severity: SetupSeverity;
  fixUrl: string;
  instructions: string;
}

export interface SetupCheckResult extends SetupCheckDefinition {
  status: SetupStatus;
  configured: boolean;
}

export interface SetupDoctorReport {
  ready: boolean;
  score: number;
  total: number;
  passed: number;
  warnings: number;
  failed: number;
  checks: SetupCheckResult[];
  nextActions: string[];
}

export const setupChecks: SetupCheckDefinition[] = [
  {
    id: "database-url",
    label: "Neon Postgres database URL",
    env: "DATABASE_URL",
    category: "database",
    severity: "required",
    fixUrl: "https://console.neon.tech/",
    instructions: "Create or open a Neon project, copy the pooled Postgres connection string, and add it as DATABASE_URL in Vercel and GitHub Actions secrets.",
  },
  {
    id: "control-plane-api-key",
    label: "Internal control-plane API key",
    env: "CONTROL_PLANE_API_KEY",
    category: "control-plane",
    severity: "required",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Generate a long random secret and add it as CONTROL_PLANE_API_KEY in Vercel and GitHub Actions secrets.",
  },
  {
    id: "gateway-api-key",
    label: "Generic gateway API key",
    env: "GATEWAY_API_KEY",
    category: "gateway",
    severity: "required",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Generate a long random secret and add it as GATEWAY_API_KEY for generic API clients.",
  },
  {
    id: "gateway-chatgpt-key",
    label: "ChatGPT gateway key",
    env: "GATEWAY_CHATGPT_KEY",
    category: "gateway",
    severity: "recommended",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Generate a client-specific gateway secret for ChatGPT calls and add it as GATEWAY_CHATGPT_KEY.",
  },
  {
    id: "gateway-perplexity-key",
    label: "Perplexity gateway key",
    env: "GATEWAY_PERPLEXITY_KEY",
    category: "gateway",
    severity: "recommended",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Generate a client-specific gateway secret for Perplexity calls and add it as GATEWAY_PERPLEXITY_KEY.",
  },
  {
    id: "gateway-telegram-key",
    label: "Telegram gateway key",
    env: "GATEWAY_TELEGRAM_KEY",
    category: "gateway",
    severity: "recommended",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Generate a client-specific gateway secret for Telegram calls and add it as GATEWAY_TELEGRAM_KEY.",
  },
  {
    id: "gateway-dashboard-key",
    label: "Dashboard gateway key",
    env: "GATEWAY_DASHBOARD_KEY",
    category: "gateway",
    severity: "recommended",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Generate a client-specific gateway secret for dashboard calls and add it as GATEWAY_DASHBOARD_KEY.",
  },
  {
    id: "github-app-id",
    label: "GitHub App ID",
    env: "GITHUB_APP_ID",
    category: "github",
    severity: "recommended",
    fixUrl: "https://github.com/settings/apps",
    instructions: "Create a GitHub App or open the existing one, then add its App ID as GITHUB_APP_ID.",
  },
  {
    id: "github-private-key",
    label: "GitHub App private key",
    env: "GITHUB_APP_PRIVATE_KEY",
    category: "github",
    severity: "recommended",
    fixUrl: "https://github.com/settings/apps",
    instructions: "Generate a private key for the GitHub App and add the full PEM string as GITHUB_APP_PRIVATE_KEY.",
  },
  {
    id: "github-installation-id",
    label: "GitHub App installation ID",
    env: "GITHUB_INSTALLATION_ID",
    category: "github",
    severity: "recommended",
    fixUrl: "https://github.com/settings/installations",
    instructions: "Install the GitHub App on the target account/repo and add the installation ID as GITHUB_INSTALLATION_ID.",
  },
  {
    id: "openai-api-key",
    label: "OpenAI API key",
    env: "OPENAI_API_KEY",
    category: "ai",
    severity: "recommended",
    fixUrl: "https://platform.openai.com/api-keys",
    instructions: "Create an OpenAI API key and add the actual key string as OPENAI_API_KEY.",
  },
  {
    id: "perplexity-api-key",
    label: "Perplexity API key",
    env: "PERPLEXITY_API_KEY",
    category: "ai",
    severity: "optional",
    fixUrl: "https://www.perplexity.ai/settings/api",
    instructions: "Create a Perplexity API key and add the actual key string as PERPLEXITY_API_KEY.",
  },
  {
    id: "telegram-bot-token",
    label: "Telegram bot token",
    env: "TELEGRAM_BOT_TOKEN",
    category: "messaging",
    severity: "optional",
    fixUrl: "https://core.telegram.org/bots/tutorial",
    instructions: "Create a Telegram bot with BotFather and add the bot token as TELEGRAM_BOT_TOKEN.",
  },
  {
    id: "vercel-token",
    label: "Vercel token",
    env: "VERCEL_TOKEN",
    category: "deployment",
    severity: "optional",
    fixUrl: "https://vercel.com/account/settings/tokens",
    instructions: "Create a Vercel token and add it as VERCEL_TOKEN if GitHub Actions will trigger Vercel operations.",
  },
  {
    id: "vercel-org-id",
    label: "Vercel org/team ID",
    env: "VERCEL_ORG_ID",
    category: "deployment",
    severity: "optional",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Copy the Vercel org/team ID and add it as VERCEL_ORG_ID if Vercel CLI workflows are enabled.",
  },
  {
    id: "vercel-project-id",
    label: "Vercel project ID",
    env: "VERCEL_PROJECT_ID",
    category: "deployment",
    severity: "optional",
    fixUrl: "https://vercel.com/dashboard",
    instructions: "Copy the Vercel project ID and add it as VERCEL_PROJECT_ID if Vercel CLI workflows are enabled.",
  },
];

function statusFor(check: SetupCheckDefinition, configured: boolean): SetupStatus {
  if (configured) return "pass";
  return check.severity === "required" ? "fail" : "warn";
}

export function runSetupDoctor(env: NodeJS.ProcessEnv = process.env): SetupDoctorReport {
  const checks = setupChecks.map((check) => {
    const value = env[check.env];
    const configured = typeof value === "string" && value.trim().length > 0;

    return {
      ...check,
      configured,
      status: statusFor(check, configured),
    } satisfies SetupCheckResult;
  });

  const total = checks.length;
  const passed = checks.filter((check) => check.status === "pass").length;
  const warnings = checks.filter((check) => check.status === "warn").length;
  const failed = checks.filter((check) => check.status === "fail").length;
  const score = Math.round((passed / total) * 100);
  const nextActions = checks
    .filter((check) => check.status !== "pass")
    .slice(0, 5)
    .map((check) => `${check.env}: ${check.instructions}`);

  return {
    ready: failed === 0,
    score,
    total,
    passed,
    warnings,
    failed,
    checks,
    nextActions,
  };
}
