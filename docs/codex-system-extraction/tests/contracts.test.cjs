const test = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const {validate} = require('../scripts/validate-handoff.cjs');
const {json,read,root,compare,assignmentErrors,receiptErrors} = require('../scripts/package-checks.cjs');
const template = kind => json(`outputs/${kind}-handoff.template.json`);
function completed(kind) {
  const r = template(kind);
  Object.assign(r, {status:'complete', scope:['fixture scope'], evidence:[{claim:'Fixture only',evidence_status:'observed',source_refs:['fixture']}],checks:[{name:'fixture check',result:'pass',evidence_ref:'fixture-log'}],receipt_refs:['fixture-receipt']});
  if (kind === 'code') {r.source_revision = 'a'.repeat(40); r.implementation.targets = ['fixture.cjs'];}
  else {r.design.tokens = [{name:'fixture_token',semantic_type:'lightness',evidence_status:'experimental',value:0.5,units:'normalized'}];r.design.accessibility = ['fixture static fallback'];}
  return r;
}
for (const kind of ['code','design']) {
  test(`${kind} template validates without fabricated results`, () => { const r=template(kind);assert.equal(validate(r).valid,true); assert.equal(r.status,'template');assert.equal(r.checks.length,0); });
  test(`${kind} completed fixture validates`, () => assert.equal(validate(completed(kind)).valid,true));
  test(`${kind} template cannot be relabeled complete`, () => {const r=template(kind);r.status='complete';assert.equal(validate(r).valid,false);});
}
for (const [name, mutate] of [
  ['unknown field',r=>r.unexpected=true],
  ['nested unknown field',r=>r.implementation.extra=true],
  ['missing objective',r=>delete r.objective],
  ['unsupported schema version',r=>r.schema_version='2.0.0'],
  ['mutable revision',r=>r.source_revision='main'],
  ['mixed handoff kinds',r=>r.design=template('design').design],
  ['missing implementation',r=>delete r.implementation],
  ['missing receipt',r=>r.receipt_refs=[]],
  ['failed check',r=>r.checks[0].result='fail'],
  ['unrun check',r=>r.checks[0].result='not_run'],
  ['check without evidence',r=>r.checks[0].evidence_ref=null],
  ['claim without source',r=>r.evidence[0].source_refs=[]]
]) test(`rejects ${name}`,()=>{const r=completed('code');mutate(r);assert.equal(validate(r).valid,false);});
test('rejects unsupported token evidence status',()=>{const r=completed('design');r.design.tokens[0].evidence_status='proven';assert.equal(validate(r).valid,false);});
test('requires accessibility for completed design',()=>{const r=completed('design');r.design.accessibility=[];assert.equal(validate(r).valid,false);});
test('CLI accepts a valid template',()=>{const r=spawnSync(process.execPath,['scripts/validate-handoff.cjs','outputs/code-handoff.template.json'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).valid,true);});
test('CLI rejects non-handoff input',()=>{const r=spawnSync(process.execPath,['scripts/validate-handoff.cjs','package.json'],{cwd:root,encoding:'utf8'});assert.equal(r.status,1);});
test('CLI reports missing file without success',()=>{const r=spawnSync(process.execPath,['scripts/validate-handoff.cjs','missing.json'],{cwd:root,encoding:'utf8'});assert.equal(r.status,1);});
test('workflow roles, dependencies and existing inputs resolve',()=>assert.deepEqual(assignmentErrors(json('outputs/workflow-assignments.json')),[]));
test('rejects workflow cycle',()=>{const r=json('outputs/workflow-assignments.json');r.workflows[0].depends_on=['commit_package'];assert.ok(assignmentErrors(r).includes('Workflow cycle'));});
test('rejects unknown workflow owner',()=>{const r=json('outputs/workflow-assignments.json');r.workflows[0].owner_role='absent';assert.ok(assignmentErrors(r).includes('Unknown owner role'));});
test('rejects unknown workflow dependency',()=>{const r=json('outputs/workflow-assignments.json');r.workflows[0].depends_on=['absent'];assert.ok(assignmentErrors(r).includes('Unknown workflow dependency'));});
test('mapping template has exactly the five requested sections',()=>assert.deepEqual(read('outputs/codex-system.md').match(/^### .+$/gm),['### 1. Core Frameworks & Methodologies','### 2. Architectural & Design Logic','### 3. Motion Grammar & Kinetics','### 4. Recursive Inquiry Protocol','### 5. Handoff & Receipt Formats']));
test('all six source IDs are unique and limitations explicit',()=>{const s=json('outputs/source-register.json').sources;assert.equal(new Set(s.map(x=>x.id)).size,6);for(const x of s){assert.ok(x.locator);assert.ok(x.limitation);}});
for (const c of compare()) test(`targeted benchmark: ${c.id}`,()=>assert.equal(c.revised_pass,true));
const actual=[{path:'fixture',bytes:1,sha256:'a'.repeat(64)}];
const receipt=()=>({status:'pass',tests:{failed:0,passed:1},manifest:actual,comparison:[{revised_pass:true}],dependencies:{vulnerabilities:{moderate:0}}});
test('receipt verifier accepts matching manifest',()=>assert.deepEqual(receiptErrors(receipt(),actual),[]));
test('receipt verifier rejects modified bytes',()=>assert.ok(receiptErrors(receipt(),[{...actual[0],sha256:'b'.repeat(64)}]).length));
test('receipt verifier rejects missing files',()=>assert.ok(receiptErrors(receipt(),[]).length));
test('receipt verifier rejects failed test evidence',()=>{const r=receipt();r.tests.failed=1;assert.ok(receiptErrors(r,actual).length);});
