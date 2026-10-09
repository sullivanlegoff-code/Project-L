// Read-only checks of the public files, after the single four-route Pages deployment.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
const origin = process.env.PRAIRIE_ORIGIN || 'https://sullivanlegoff-code.github.io';
const routes = [
  ['', process.env.STABLE_REVISION, 4, 'Habitats · passe visuelle'],
  ['dev/', process.env.STABLE_REVISION, 4, 'Habitats · passe visuelle'],
  ['preview/accounts/', process.env.ACCOUNTS_REVISION, 4, 'Habitats · passe visuelle'],
  ['preview/decorations/', process.env.DECORATIONS_REVISION, 5, 'Aménagement · prévisualisation v5'],
];
for (const [, sha] of routes) assert.match(sha || '', /^[a-f0-9]{40}$/);
async function read(url) {
  const response = await fetch(url, {cache: 'no-store', signal: AbortSignal.timeout(20000)});
  assert.equal(response.status, 200, `${url}: HTTP ${response.status}`);
  return response.text();
}
async function check() {
  const report = [];
  for (const [route, sha, format, label] of routes) {
    const url = `${origin}/Project-L/${route}`;
    const revision = (await read(url + 'build-revision.txt?check=' + process.env.GITHUB_RUN_ID)).trim();
    assert.equal(revision, sha, `Wrong revision on ${route || '/'}`);
    const html = await read(url);
    const main = html.match(/<script[^>]+src="([^"]+)"/);
    assert.ok(main, `Missing app script on ${route || '/'}`);
    const scriptUrl = new URL(main[1], url);
    let scripts = await read(scriptUrl);
    assert.ok(scripts.includes(sha), `Revision absent from the served application on ${route}`);
    assert.ok(scripts.includes(label), `Wrong release label on ${route}`);
    assert.ok(scripts.includes(`version:${format}`), `Wrong save format on ${route}`);
    for (const child of new Set([...scripts.matchAll(/["'](\.\/tools-[^"']+\.js)["']/g)].map(m => m[1]))) scripts += await read(new URL(child, scriptUrl));
    if (format === 5) {
      for (const marker of ['meadow-static-ground', 'export-migration-source', 'migrationBackup', 'decoration-placement-actions', 'decorationStart', 'decorationDense', 'islandStart', 'islandExpanded', 'islandFull', 'Terrain réservé', 'sellDecoration', 'setDecorationSelection', 'SALE_NOT_SAVED', 'prairie-lapins.preview.decorations.']) assert.ok(scripts.includes(marker), `Missing decoration feature ${marker}`);
      for (const marker of ['supabase.co', 'signInWithOtp']) assert.ok(!scripts.includes(marker), `Online client in decorations: ${marker}`);
    }
    report.push({url, revision, saveFormat: format, html: 200, application: 200, featuresChecked: true});
  }
  return report;
}
let lastError;
for (let attempt = 0; attempt < 6; attempt++) {
  try {
    const report = await check();
    writeFileSync('published-revisions.json', JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (error) {lastError = error; console.error(`Public verification ${attempt + 1}/6: ${error.message}`); if (attempt < 5) await delay(10000);}
}
throw lastError;
