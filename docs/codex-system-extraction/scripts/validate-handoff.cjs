const fs = require('node:fs');
const path = require('node:path');
const Ajv = require('ajv');
const root = path.resolve(__dirname, '..');
const schema = JSON.parse(fs.readFileSync(path.join(root, 'outputs/handoff.schema.json'), 'utf8'));
const ajv = new Ajv({allErrors: true, strict: true, strictRequired: false});
const structural = ajv.compile(schema);

function validate(record) {
  if (!structural(record)) return {valid: false, errors: structuredClone(structural.errors)};
  const errors = [];
  for (const item of record.evidence) {
    if (item.evidence_status !== 'unknown' && item.source_refs.length === 0) errors.push('Known evidence requires source references');
  }
  for (const check of record.checks) {
    if (['pass', 'fail'].includes(check.result) && check.evidence_ref === null) errors.push('Executed check requires evidence reference');
  }
  if (record.status === 'complete') {
    if (record.scope.length === 0 || record.evidence.length === 0 || record.receipt_refs.length === 0) errors.push('Completion requires scope, evidence and receipt references');
    if (!record.checks.some(c => c.result === 'pass') || record.checks.some(c => ['fail', 'not_run'].includes(c.result))) errors.push('Completion requires a passed check and no failed or unrun checks');
    if (record.kind === 'code' && (record.source_revision === null || record.implementation.targets.length === 0)) errors.push('Completed code requires immutable revision and implementation targets');
    if (record.kind === 'design' && (record.design.tokens.length === 0 || record.design.accessibility.length === 0)) errors.push('Completed design requires tokens and accessibility behavior');
  }
  return {valid: errors.length === 0, errors};
}

module.exports = {validate, root};
if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('Usage: node scripts/validate-handoff.cjs <handoff.json>');
    const result = validate(JSON.parse(fs.readFileSync(process.argv[2], 'utf8')));
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.valid ? 0 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
