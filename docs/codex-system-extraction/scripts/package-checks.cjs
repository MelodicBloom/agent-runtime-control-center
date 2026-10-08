const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {validate, root} = require('./validate-handoff.cjs');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const json = p => JSON.parse(read(p));
function compare() {
  const doc = read('outputs/codex-system.md');
  const sources = json('outputs/source-register.json');
  const rules = {
    five_questions: () => (doc.match(/^\d\. /gm) || []).length === 5,
    scoped_naming: () => doc.includes('no 80% frequency census') && doc.includes('not global requirements'),
    draft_boundary: () => sources.sources.some(s => s.id === 'S4' && s.limitation.includes('approval_evidence NONE')) && doc.includes('approval field is NONE'),
    correct_source_ids: () => JSON.stringify(sources).includes('01a0744f-7d87-7982-b242-50ef982386dd') && !JSON.stringify(sources).includes('019c6e27-e55b-73d1-87d8-4e01f1f75043'),
    time_not_input: () => doc.includes('does not prohibit autonomous time evolution'),
    schema_compatibility: () => ['code','design'].every(k => validate(json(`outputs/${k}-handoff.template.json`)).valid)
  };
  return json('outputs/baseline-comparison.json').cases.map(c => ({id: c.id, baseline_pass: c.baseline_pass, revised_pass: Boolean(rules[c.rule]?.())}));
}
function assignmentErrors(value, checkFiles = true) {
  const errors = [];
  const ids = new Set(value.workflows.map(w => w.id));
  if (ids.size !== value.workflows.length) errors.push('Duplicate workflow ID');
  const roles = new Set(value.roles);
  const visiting = new Set(), visited = new Set();
  const byId = new Map(value.workflows.map(w => [w.id,w]));
  function visit(id) {
    if (visiting.has(id)) { errors.push('Workflow cycle'); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dep of byId.get(id)?.depends_on || []) {
      if (!ids.has(dep)) errors.push('Unknown workflow dependency'); else visit(dep);
    }
    visiting.delete(id); visited.add(id);
  }
  for (const w of value.workflows) {
    if (!roles.has(w.owner_role)) errors.push('Unknown owner role');
    if (!w.feature || !w.acceptance || !w.inputs.length || !w.outputs.length) errors.push('Incomplete workflow');
    visit(w.id);
    if (checkFiles) for (const p of [...w.inputs, ...w.outputs]) {
      if (['git_commit','outputs/test-results.tap','outputs/validation-receipt.json'].includes(p)) continue;
      if (!fs.existsSync(path.join(root,p))) errors.push(`Missing workflow file: ${p}`);
    }
  }
  return errors;
}
function manifest() {
  const names = ['.gitignore','.gitattributes','package.json','pnpm-lock.yaml'];
  for (const dir of ['outputs','scripts','tests']) {
    for (const name of fs.readdirSync(path.join(root,dir))) {
      if (dir === 'outputs' && name === 'validation-receipt.json') continue;
      const rel = `${dir}/${name}`;
      if (fs.statSync(path.join(root,rel)).isFile()) names.push(rel);
    }
  }
  return names.sort().map(p => {
    const bytes = fs.readFileSync(path.join(root,p));
    return {path: p, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex')};
  });
}
function receiptErrors(receipt, actual) {
  const errors = [];
  if (receipt.status !== 'pass' || receipt.tests.failed !== 0 || receipt.tests.passed < 1) errors.push('Receipt is not a passing test result');
  if (JSON.stringify(receipt.manifest) !== JSON.stringify(actual)) errors.push('Receipt manifest is stale, missing files, or altered');
  if (!receipt.comparison.every(c => c.revised_pass)) errors.push('Comparison failed');
  if (Object.values(receipt.dependencies.vulnerabilities).some(n => n !== 0)) errors.push('Dependency audit has findings');
  return errors;
}
module.exports = {read,json,root,compare,assignmentErrors,manifest,receiptErrors};
