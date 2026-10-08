import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {resolve, relative, join} from 'node:path';

const root = resolve(process.argv[2]);
const base = process.argv[3] || '/Project-L/';
const laboratory = process.argv[4] === 'laboratory';
assert.ok(base.startsWith('/') && base.endsWith('/'), 'Base must be an absolute URL path');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    if (!laboratory && directory === root && name === 'dev') continue;
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path); else files.push(path);
  }
}
walk(root);
assert.ok(files.some(path => path.endsWith('.js')), 'No production JavaScript found');
for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  const url = match[1];
  if (url === 'data:,') continue;
  assert.ok(url.startsWith(base + 'assets/'), `Unexpected entry resource: ${url}`);
  assert.ok(statSync(join(root, url.slice(base.length))).isFile(), `Missing entry resource: ${url}`);
}
let scripts = '';
for (const path of files) {
  const name = relative(root, path).replaceAll('\\', '/');
  assert.ok(name === 'index.html' || name === 'build-revision.txt' || name === '.nojekyll' || name.startsWith('assets/'), `Unexpected published file: ${name}`);
  if (!/\.(html|js|css)$/.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  assert.ok(!/http:\/\/(localhost|127\.0\.0\.1|192\.168\.)/.test(text), 'Local-server URL found in build');
  if (path.endsWith('.js')) {
    scripts += text;
    if (!laboratory) for (const marker of ['prairie-lapins.development.', 'developmentEnvironment', 'dev-time-', 'dev-grant-', 'dev-scenario-']) {
      assert.ok(!text.includes(marker), `Development tool found in normal build: ${marker}`);
    }
  }
}
if (laboratory) for (const marker of ['prairie-lapins.development.', 'dev-time-', 'dev-grant-', 'dev-scenario-']) assert.ok(scripts.includes(marker), `Missing laboratory tool: ${marker}`);
console.log(`${laboratory ? 'Laboratory' : 'Normal production'} checked: ${files.length} files; base ${base}; isolated tools and no local-server URLs.`);
