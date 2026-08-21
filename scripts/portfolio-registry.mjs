import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const moduleRoot = fileURLToPath(new URL("..", import.meta.url));
const defaultRegistryDir = resolve(moduleRoot, "memory/portfolio-registry");
const defaultSchemaPath = resolve(defaultRegistryDir, "asset.schema.json");

function error(path, code, message) {
  return { path, code, message };
}

function compareErrors(left, right) {
  return (
    left.path.localeCompare(right.path) ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message)
  );
}

async function loadRegistry({ registryDir = defaultRegistryDir } = {}) {
  const assetsDir = resolve(registryDir, "assets");
  let entries;

  try {
    entries = await readdir(assetsDir, { withFileTypes: true });
  } catch (caught) {
    return {
      records: [],
      files: [],
      parseErrors: [
        error("assets", "registry.assets_unreadable", caught.message),
      ],
    };
  }

  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const records = [];
  const parseErrors = [];

  for (const file of files) {
    try {
      const contents = await readFile(resolve(assetsDir, file), "utf8");
      records.push({ file, record: JSON.parse(contents) });
    } catch (caught) {
      parseErrors.push(
        error(`assets/${file}`, "registry.invalid_json", caught.message),
      );
    }
  }

  return { records, files, parseErrors };
}

function referencedSourceIds(record) {
  const references = [];
  const add = (path, values = []) => {
    for (const value of values) references.push({ path, value });
  };

  add("canonical_location.evidence_source_ids", record.canonical_location.evidence_source_ids);
  add("owner.evidence_source_ids", record.owner.evidence_source_ids);
  add("project_class.evidence_source_ids", record.project_class.evidence_source_ids);
  add("disposition.evidence_source_ids", record.disposition.evidence_source_ids);
  add("current_git_ref.evidence_source_ids", record.current_git_ref.evidence_source_ids);
  add("next_gate.routing.evidence_source_ids", record.next_gate.routing.evidence_source_ids);
  add("review_date.evidence_source_ids", record.review_date.evidence_source_ids);

  for (const [dimension, maturity] of Object.entries(record.maturity)) {
    add(
      `maturity.${dimension}.assessment.evidence_source_ids`,
      maturity.assessment.evidence_source_ids,
    );
    add(
      `maturity.${dimension}.evidence.authority_source_ids`,
      maturity.evidence.authority_source_ids,
    );
  }

  return references;
}

function semanticRecordErrors(record, file) {
  const errors = [];
  const prefix = `assets/${file}`;
  const sourceIds = record.authority_sources.map((source) => source.source_id);
  const sourceIdSet = new Set(sourceIds);

  for (const sourceId of sourceIds) {
    if (sourceIds.indexOf(sourceId) !== sourceIds.lastIndexOf(sourceId)) {
      errors.push(
        error(
          `${prefix}/authority_sources`,
          "record.duplicate_authority_source",
          `Authority source ID is duplicated: ${sourceId}`,
        ),
      );
    }
  }

  for (const reference of referencedSourceIds(record)) {
    if (!sourceIdSet.has(reference.value)) {
      errors.push(
        error(
          `${prefix}/${reference.path}`,
          "record.missing_authority_source",
          `Authority source does not exist in this record: ${reference.value}`,
        ),
      );
    }
  }

  const sourcesById = new Map(
    record.authority_sources.map((source) => [source.source_id, source]),
  );
  const verifiedFacts = [
    ["canonical_location", record.canonical_location],
    ["owner", record.owner],
    ["project_class", record.project_class],
    ["disposition", record.disposition],
    ["current_git_ref", record.current_git_ref],
    ["next_gate.routing", record.next_gate.routing],
    ["review_date", record.review_date],
  ];

  for (const [path, fact] of verifiedFacts) {
    if (
      fact.epistemic_state === "verified" &&
      !fact.evidence_source_ids.some(
        (sourceId) => sourcesById.get(sourceId)?.epistemic_state === "verified",
      )
    ) {
      errors.push(
        error(
          `${prefix}/${path}`,
          "record.verified_without_verified_source",
          "A verified claim must cite at least one verified authority source.",
        ),
      );
    }
  }

  if (
    record.canonical_location.kind === "unrepoed" &&
    record.current_git_ref.state !== "not_applicable"
  ) {
    errors.push(
      error(
        `${prefix}/current_git_ref`,
        "record.impossible_repository_ref",
        "An unrepoed asset cannot carry a resolved or unresolved Git ref.",
      ),
    );
  }

  if (
    record.canonical_location.kind === "repository" &&
    record.current_git_ref.state === "not_applicable"
  ) {
    errors.push(
      error(
        `${prefix}/current_git_ref`,
        "record.impossible_repository_ref",
        "A repository-backed asset requires a resolved ref or explicit unresolved state.",
      ),
    );
  }

  return errors;
}

async function validateRegistry({
  registryDir = defaultRegistryDir,
  schemaPath = defaultSchemaPath,
  expectedRecordCount,
} = {}) {
  const loaded = await loadRegistry({ registryDir });
  const errors = [...loaded.parseErrors];
  let validate;

  try {
    const schema = JSON.parse(await readFile(schemaPath, "utf8"));
    validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  } catch (caught) {
    errors.push(error("asset.schema.json", "schema.unreadable", caught.message));
  }

  const structurallyValid = [];
  if (validate) {
    for (const entry of loaded.records) {
      if (!validate(entry.record)) {
        for (const schemaError of validate.errors ?? []) {
          errors.push(
            error(
              `assets/${entry.file}${schemaError.instancePath}`,
              `schema.${schemaError.keyword}`,
              schemaError.message ?? "Schema validation failed.",
            ),
          );
        }
      } else {
        structurallyValid.push(entry);
      }
    }
  }

  const byAssetId = new Map();
  for (const entry of structurallyValid) {
    const existing = byAssetId.get(entry.record.asset_id);
    if (existing) {
      errors.push(
        error(
          `assets/${entry.file}/asset_id`,
          "registry.duplicate_asset_id",
          `Asset ID ${entry.record.asset_id} is already defined by assets/${existing.file}.`,
        ),
      );
    } else {
      byAssetId.set(entry.record.asset_id, entry);
    }
    errors.push(...semanticRecordErrors(entry.record, entry.file));
  }

  const assetIds = new Set(structurallyValid.map(({ record }) => record.asset_id));
  for (const { file, record } of structurallyValid) {
    for (const dependency of record.dependencies) {
      if (dependency === record.asset_id) {
        errors.push(
          error(
            `assets/${file}/dependencies`,
            "registry.self_dependency",
            `Asset cannot depend on itself: ${dependency}`,
          ),
        );
      } else if (!assetIds.has(dependency)) {
        errors.push(
          error(
            `assets/${file}/dependencies`,
            "registry.dangling_dependency",
            `Dependency does not resolve to a governed asset: ${dependency}`,
          ),
        );
      }
    }
  }

  if (
    expectedRecordCount !== undefined &&
    loaded.files.length !== expectedRecordCount
  ) {
    errors.push(
      error(
        "assets",
        "registry.record_count",
        `Expected ${expectedRecordCount} production record(s), found ${loaded.files.length}.`,
      ),
    );
  }

  errors.sort(compareErrors);
  return {
    valid: errors.length === 0,
    errors,
    records: structurallyValid.map(({ record }) => record),
    files: loaded.files,
  };
}

function markdownCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function factDisplay(fact) {
  const value = fact.value === null ? fact.epistemic_state : fact.value;
  return `${value} (\`${fact.epistemic_state}\`)`;
}

function renderPortfolio(records) {
  const lines = [
    "# Portfolio Asset Registry — Contract Proof v0",
    "",
    "Generated from governed JSON records. Do not edit directly.",
    "",
  ];
  const maturityOrder = [
    "artifact_completeness",
    "engineering_reliability",
    "operational_readiness",
    "documentation",
    "use_evidence",
  ];
  const orderedRecords = [...records].sort((left, right) =>
    left.asset_id.localeCompare(right.asset_id),
  );

  for (const record of orderedRecords) {
    const location =
      record.canonical_location.kind === "repository"
        ? record.canonical_location.repository
        : "unrepoed";
    const gitRef =
      record.current_git_ref.state === "resolved"
        ? `\`${record.current_git_ref.commit_sha}\` (\`${record.current_git_ref.epistemic_state}\`)`
        : `${record.current_git_ref.state} (\`${record.current_git_ref.epistemic_state}\`)`;
    const dependencies = record.dependencies.length
      ? [...record.dependencies]
          .sort((left, right) => left.localeCompare(right))
          .map((dependency) => `\`${dependency}\``)
          .join(", ")
      : "none";
    const blockers = record.blockers.length
      ? [...record.blockers]
          .sort((left, right) => left.blocker_id.localeCompare(right.blocker_id))
          .map((blocker) => `${blocker.description} (\`${blocker.status}\`)`)
          .join("; ")
      : "none";

    lines.push(
      `## ${record.name}`,
      "",
      `- Asset ID: \`${record.asset_id}\``,
      `- Canonical location: \`${location}\` (\`${record.canonical_location.epistemic_state}\`)`,
      `- Owner: ${factDisplay(record.owner)}`,
      `- Project class: ${factDisplay(record.project_class)}`,
      `- Disposition: ${factDisplay(record.disposition)}`,
      `- Current immutable Git ref: ${gitRef}`,
      `- Dependencies: ${dependencies}`,
      `- Blockers: ${blockers}`,
      `- Review date: ${factDisplay(record.review_date)}`,
      "",
      "### Authority sources",
      "",
      "| Source | Type | Semantic authority | Semantic state | Integrity | SHA-256 | Bytes |",
      "| --- | --- | --- | --- | --- | --- | ---: |",
    );

    for (const source of [...record.authority_sources].sort((left, right) =>
      left.source_id.localeCompare(right.source_id),
    )) {
      lines.push(
        `| \`${markdownCell(source.source_id)}\` | ${markdownCell(source.source_type)} | ${markdownCell(source.semantic_authority)} | \`${source.epistemic_state}\` | \`${source.integrity.verification_state}\` | ${source.integrity.sha256 ? `\`${source.integrity.sha256}\`` : "—"} | ${source.integrity.byte_size ?? "—"} |`,
      );
    }

    lines.push(
      "",
      "### Maturity",
      "",
      "| Dimension | Assessment | Evidence verification |",
      "| --- | --- | --- |",
    );
    for (const dimension of maturityOrder) {
      const maturity = record.maturity[dimension];
      lines.push(
        `| \`${dimension}\` | ${factDisplay(maturity.assessment)} | \`${maturity.evidence.verification_state}\` |`,
      );
    }

    lines.push(
      "",
      "### Next gate",
      "",
      `- Gate ID: \`${record.next_gate.gate_id}\``,
      `- Description: ${record.next_gate.description}`,
      `- Responsible role: \`${record.next_gate.responsible_role}\``,
      `- Status: \`${record.next_gate.status}\``,
      `- Current routing: ${factDisplay(record.next_gate.routing)}`,
      "- Required evidence:",
    );
    for (const evidence of [...record.next_gate.required_evidence].sort((left, right) =>
      left.evidence_id.localeCompare(right.evidence_id),
    )) {
      lines.push(`  - \`${evidence.evidence_id}\`: ${evidence.description}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").replace(/\n+$/u, "")}\n`;
}

async function generatePortfolio({
  registryDir = defaultRegistryDir,
  schemaPath = defaultSchemaPath,
  outputPath,
  expectedRecordCount = 1,
} = {}) {
  if (!outputPath) throw new Error("Generation requires an output path.");
  const validation = await validateRegistry({
    registryDir,
    schemaPath,
    expectedRecordCount,
  });
  if (!validation.valid) {
    const details = validation.errors
      .map((item) => `${item.path} [${item.code}] ${item.message}`)
      .join("\n");
    throw new Error(`Registry validation failed before rendering:\n${details}`);
  }

  const bytes = renderPortfolio(validation.records);
  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  await writeFile(resolve(outputPath), bytes, "utf8");
  return { records: validation.records, bytes };
}

function parseValidateArguments(argumentsList) {
  const options = {};
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const value = argumentsList[index + 1];
    if (argument === "--registry" && value) {
      options.registryDir = resolve(value);
      index += 1;
    } else if (argument === "--schema" && value) {
      options.schemaPath = resolve(value);
      index += 1;
    } else if (argument === "--expected-count" && value) {
      options.expectedRecordCount = Number.parseInt(value, 10);
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }
  return options;
}

function parseGenerateArguments(argumentsList) {
  const options = parseValidateArguments(
    argumentsList.filter((argument, index) => {
      if (argument === "--output") return false;
      if (index > 0 && argumentsList[index - 1] === "--output") return false;
      return true;
    }),
  );
  const outputIndex = argumentsList.indexOf("--output");
  if (outputIndex === -1 || !argumentsList[outputIndex + 1]) {
    throw new Error("Generation requires --output PATH.");
  }
  options.outputPath = resolve(argumentsList[outputIndex + 1]);
  return options;
}

async function runCli() {
  const [command, ...argumentsList] = process.argv.slice(2);
  if (command === "generate") {
    const generated = await generatePortfolio(parseGenerateArguments(argumentsList));
    console.log("portfolio-registry generation: PASS");
    console.log(`records: ${generated.records.length}`);
    return;
  }
  if (command !== "validate") {
    throw new Error(
      "Usage: node scripts/portfolio-registry.mjs <validate|generate> [options]",
    );
  }

  const result = await validateRegistry(parseValidateArguments(argumentsList));
  console.log(`portfolio-registry validation: ${result.valid ? "PASS" : "FAIL"}`);
  console.log(`records: ${result.records.length}`);
  console.log(`files: ${result.files.length}`);
  console.log(`errors: ${result.errors.length}`);
  for (const item of result.errors) {
    console.error(`${item.path} [${item.code}] ${item.message}`);
  }
  if (!result.valid) process.exitCode = 1;
}

const isMain =
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  runCli().catch((caught) => {
    console.error(caught.message);
    process.exitCode = 1;
  });
}

export { generatePortfolio, loadRegistry, renderPortfolio, validateRegistry };
