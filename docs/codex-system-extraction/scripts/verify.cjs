const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {json,root,compare,manifest,receiptErrors} = require('./package-checks.cjs');
const receiptPath = path.join(root,'outputs/validation-receipt.json');
try {
  if (process.argv.includes('--check-receipt')) {
    const errors = receiptErrors(json('outputs/validation-receipt.json'),manifest());
    console.log(JSON.stringify({status:errors.length?'fail':'pass',errors},null,2));
    process.exitCode = errors.length ? 1 : 0;
  } else {
    const result=spawnSync(process.execPath,['--test','--test-reporter=tap','tests/contracts.test.cjs'],{cwd:root,encoding:'utf8'});
    const output = result.stdout || '';
    fs.writeFileSync(path.join(root,'outputs/test-results.tap'), output + (result.stderr || ''));
    if(result.status !== 0) throw new Error(`Tests failed. See outputs/test-results.tap. ${result.stderr || ''}`);
    const passed=Number(output.match(/^# pass (\d+)/m)?.[1]);
    const failed=Number(output.match(/^# fail (\d+)/m)?.[1]);
    if (!passed || failed !== 0) throw new Error('Test totals missing or failed');
    const audit=json('outputs/dependency-audit.json');
    if(Object.values(audit.metadata.vulnerabilities).some(v=>v!==0)) throw new Error('Dependency audit contains findings');
    const comparison=compare();
    if(comparison.some(c=>!c.revised_pass)) throw new Error('Benchmark comparison failed');
    const receipt={
      schema_version:'1.0.0', artifact_id:'personal-codex-validation',status:'pass',validated_at:new Date().toISOString(),
      runtime:{node:process.version,platform:process.platform,arch:process.arch},
      tests:{command:'node --test --test-reporter=tap tests/contracts.test.cjs',passed,failed,log:'outputs/test-results.tap'},
      compatibility:{schema:'JSON Schema draft-07',contract_version:'1.0.0',validator:`Ajv ${require('ajv/package.json').version}`,external_schemas:'not tested'},
      dependencies:{lockfile:'pnpm-lock.yaml',audit:'outputs/dependency-audit.json',vulnerabilities:audit.metadata.vulnerabilities},
      comparison, benchmark_scope:'Six targeted regressions from the prior chat; not an independent quality score or rendering performance test',
      refinements:['Scoped draft architecture and naming claims','Reduced inquiry matrix to five questions','Corrected historical source identities','Separated autonomous time from input modality','Added validated handoff contracts','Fixed strict schema union syntax','Updated advisory-affected Ajv 8.17.1 to 8.20.0'],
      limitations:['No application, shader or production deployment is delivered','No exhaustive repository census or current remote state verification','Roles are declarative assignments; no external dispatch','Receipt hash checks establish file integrity, not the truth of external claims','This receipt excludes itself from its manifest; the Git commit records the receipt bytes'],
      manifest:manifest()
    };
    fs.writeFileSync(receiptPath,JSON.stringify(receipt,null,2)+'\n');
    const errors=receiptErrors(receipt,manifest());
    if(errors.length) throw new Error(errors.join('; '));
    console.log(JSON.stringify({status:'pass',passed,failed,comparison_passed:comparison.filter(c=>c.revised_pass).length,manifest_files:receipt.manifest.length},null,2));
  }
} catch(error) { console.error(error.message); process.exitCode=1; }
