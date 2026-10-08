import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync} from 'node:fs';
import {resolve, relative, join} from 'node:path';

const root = resolve(process.argv[2]);
const base = process.argv[3] || '/Project-L/';
assert.ok(base.startsWith('/') && base.endsWith('/'), 'Base must be an absolute URL path');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
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
for (const path of files) {
  const name = relative(root, path).replaceAll('\\', '/');
  assert.ok(name === 'index.html' || name === 'build-revision.txt' || name === '.nojekyll' || name.startsWith('assets/'), `Unexpected published file: ${name}`);
  if (!/\.(html|js|css)$/.test(path)) continue;
  const text = readFileSync(path, 'utf8');
  assert.ok(!/http:\/\/(localhost|127\.0\.0\.1|192\.168\.)/.test(text), 'Local-server URL found in build');
  if (path.endsWith('.js')) {
    for (const marker of ['prairie-lapins.development.', 'developmentEnvironment', 'Mode test : horloge', '+ 1440 min']) {
      assert.ok(!text.includes(marker), `Development tool found in build: ${marker}`);
    }
  }
}
console.log(`Production checked: ${files.length} files; base ${base}; no development tools or local-server URLs.`);
