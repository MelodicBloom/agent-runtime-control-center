import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateRegistry } from "./portfolio-registry.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const committedReportPath = resolve(
  repositoryRoot,
  "docs/portfolio/CONTRACT_PROOF_V0.md",
);
const generatorPath = resolve(repositoryRoot, "scripts/portfolio-registry.mjs");
const testPath = resolve(
  repositoryRoot,
  "tests/portfolio-registry/portfolio-registry.test.mjs",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function compareFreshReport({ freshPath, committedPath }) {
  const [freshBytes, committedBytes] = await Promise.all([
    readFile(freshPath),
    readFile(committedPath),
  ]);
  const freshSha256 = sha256(freshBytes);
  const committedSha256 = sha256(committedBytes);
  return {
    fresh: freshBytes.equals(committedBytes),
    freshSha256,
    committedSha256,
  };
}

function startNode(argumentsList) {
  const child = spawn(process.execPath, argumentsList, {
    cwd: repositoryRoot,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const completion = new Promise((resolveCompletion, rejectCompletion) => {
    child.on("error", rejectCompletion);
    child.on("close", (code) => {
      if (code === 0) {
        resolveCompletion({ stdout, stderr });
      } else {
        rejectCompletion(
          new Error(
            `Child Node process failed with exit code ${code}.\n${stdout}${stderr}`,
          ),
        );
      }
    });
  });

  return { pid: child.pid, completion };
}

function testCounts(output) {
  const tests = Number.parseInt(output.match(/^# tests (\d+)/mu)?.[1] ?? "0", 10);
  const passed = Number.parseInt(output.match(/^# pass (\d+)/mu)?.[1] ?? "0", 10);
  const failed = Number.parseInt(output.match(/^# fail (\d+)/mu)?.[1] ?? "0", 10);
  if (tests === 0 || tests !== passed + failed) {
    throw new Error("Unable to establish exact test counts from the Node test runner.");
  }
  return { tests, passed, failed };
}

async function runCombinedVerification() {
  const testRun = startNode(["--test", "--test-reporter=tap", testPath]);
  const testResult = await testRun.completion;
  const counts = testCounts(`${testResult.stdout}${testResult.stderr}`);
  if (counts.failed !== 0) throw new Error("Portfolio registry tests failed.");

  const validation = await validateRegistry({ expectedRecordCount: 1 });
  if (!validation.valid) {
    const details = validation.errors
      .map((item) => `${item.path} [${item.code}] ${item.message}`)
      .join("\n");
    throw new Error(`Production registry validation failed:\n${details}`);
  }

  const temporaryRoot = await mkdtemp(
    join(tmpdir(), "portfolio-registry-verification-"),
  );
  try {
    const runOnePath = join(temporaryRoot, "run-1", "report.md");
    const runTwoPath = join(temporaryRoot, "run-2", "report.md");
    const runOne = startNode([
      generatorPath,
      "generate",
      "--output",
      runOnePath,
    ]);
    const runTwo = startNode([
      generatorPath,
      "generate",
      "--output",
      runTwoPath,
    ]);
    if (!runOne.pid || !runTwo.pid || runOne.pid === runTwo.pid) {
      throw new Error("Generation did not start in two distinct Node processes.");
    }
    await Promise.all([runOne.completion, runTwo.completion]);

    const [runOneBytes, runTwoBytes] = await Promise.all([
      readFile(runOnePath),
      readFile(runTwoPath),
    ]);
    const runOneSha256 = sha256(runOneBytes);
    const runTwoSha256 = sha256(runTwoBytes);
    if (!runOneBytes.equals(runTwoBytes) || runOneSha256 !== runTwoSha256) {
      throw new Error("Independent report generations were not byte-identical.");
    }

    const freshness = await compareFreshReport({
      freshPath: runOnePath,
      committedPath: committedReportPath,
    });
    if (!freshness.fresh) {
      throw new Error(
        `Committed report is stale: fresh ${freshness.freshSha256}, committed ${freshness.committedSha256}.`,
      );
    }

    const summary = [
      "portfolio registry verification: PASS",
      `tests: ${counts.passed} passed, ${counts.failed} failed`,
      "schema_execution: PASS",
      "semantic_validation: PASS",
      `production_records: ${validation.records.length}`,
      "generation_processes: 2 independent Node processes",
      `generation_run_1_sha256: ${runOneSha256}`,
      `generation_run_2_sha256: ${runTwoSha256}`,
      "deterministic_bytes: PASS",
      `generated_report_sha256: ${freshness.freshSha256}`,
      "report_freshness: PASS",
    ];
    return {
      summary: `${summary.join("\n")}\n`,
      counts,
      validation,
      runOneSha256,
      runTwoSha256,
      reportSha256: freshness.freshSha256,
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  runCombinedVerification()
    .then((result) => {
      process.stdout.write(result.summary);
    })
    .catch((caught) => {
      console.error(`portfolio registry verification: FAIL\n${caught.message}`);
      process.exitCode = 1;
    });
}

export { compareFreshReport, runCombinedVerification };
