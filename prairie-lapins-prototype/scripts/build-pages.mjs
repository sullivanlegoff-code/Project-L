import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {resolve, join} from 'node:path';
import {tmpdir} from 'node:os';

const root = resolve(process.argv[2] || join(tmpdir(), 'prairie-pages'));
const base = '/Project-L/';
const revision = process.env.VITE_BUILD_REVISION || 'local';
const run = (command, args) => execFileSync(command, args, {stdio: 'inherit'});
// A single artifact replaces BOTH routes atomically. No independent Pages deployment.
run('npm', ['run', 'build', '--', '--base=' + base, '--outDir', root, '--emptyOutDir']);
writeFileSync(join(root, 'build-revision.txt'), revision + '\n');
writeFileSync(join(root, '.nojekyll'), '');
run('npm', ['run', 'build:lab', '--', '--base=' + base + 'dev/', '--outDir', join(root, 'dev'), '--emptyOutDir']);
writeFileSync(join(root, 'dev', 'build-revision.txt'), revision + '\n');
run('node', ['scripts/verify-production.mjs', root, base]);
run('node', ['scripts/verify-production.mjs', join(root, 'dev'), base + 'dev/', 'laboratory']);
