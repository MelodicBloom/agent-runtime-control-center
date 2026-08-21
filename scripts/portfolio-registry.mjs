import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
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

async function runCli() {
  const [command, ...argumentsList] = process.argv.slice(2);
  if (command !== "validate") {
    throw new Error("Usage: node scripts/portfolio-registry.mjs validate [options]");
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

export { loadRegistry, validateRegistry };
