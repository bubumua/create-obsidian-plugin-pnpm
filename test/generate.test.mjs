import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { generateProject, validateId } from '../lib/generate.mjs';

async function workspace(t) {
	const directory = await mkdtemp(join(tmpdir(), 'create-obsidian-test-'));
	t.after(() => rm(directory, { recursive: true, force: true }));
	return directory;
}
const json = async (file) => JSON.parse(await readFile(file, 'utf8'));

test('generates a complete plugin with escaped metadata and consistent class names', async (t) => {
	const root = await workspace(t);
	const destination = join(root, 'with spaces');
	await generateProject(destination, { id: 'daily-notes', name: '日记 "工具"', author: 'Someone', description: 'A note companion.' });
	const manifest = await json(join(destination, 'manifest.json'));
	const pkg = await json(join(destination, 'package.json'));
	assert.equal(manifest.id, pkg.name);
	assert.equal(manifest.name, '日记 "工具"');
	assert.equal(manifest.author, 'Someone');
	assert.equal(manifest.minAppVersion, '1.13.2');
	assert.equal(manifest.fundingUrl, undefined);
	assert.equal(pkg.private, true);
	assert.equal(pkg.devDependencies.obsidian, 'latest');
	assert.equal((await json(join(destination, 'versions.json')))[manifest.version], manifest.minAppVersion);
	for (const file of ['src/main.ts', 'src/settings.ts', 'src/settings/preset-list.ts']) {
		const source = await readFile(join(destination, file), 'utf8');
		assert.doesNotMatch(source, /__CLASS_PREFIX__|MyPlugin|SampleModal|SampleSettingTab|console\.log/);
		assert.match(source, /NotebookDailyNotes/);
	}
	const entries = await readdir(destination);
	for (const file of ['.gitignore', '.github', 'pnpm-lock.yaml', 'package.json', 'README.md', 'LICENSE']) assert.ok(entries.includes(file));
	for (const file of ['node_modules', 'main.js', '.git', 'data.json', 'package-lock.json']) assert.ok(!entries.includes(file));
	assert.match(await readFile(join(destination, '.github/workflows/lint.yml'), 'utf8'), /pnpm install --frozen-lockfile/);
});

test('never overwrites a non-empty destination', async (t) => {
	const root = await workspace(t);
	await writeFile(join(root, 'keep.txt'), 'keep me');
	await assert.rejects(generateProject(root), /不会覆盖/);
	assert.equal(await readFile(join(root, 'keep.txt'), 'utf8'), 'keep me');
	assert.deepEqual(await readdir(root), ['keep.txt']);
});

test('rejects invalid identifiers before writing anything', async (t) => {
	const root = await workspace(t);
	for (const id of ['../escape', 'Bad_Name', '1-start', 'con', 'a--b', 'a'.repeat(101)]) {
		assert.throws(() => validateId(id));
		await assert.rejects(generateProject(join(root, 'project'), { id }));
	}
	assert.deepEqual(await readdir(root), []);
});

test('CLI supports help, defaults and rejects unknown options', async (t) => {
	const root = await workspace(t);
	const cli = fileURLToPath(new URL('../bin/index.mjs', import.meta.url));
	assert.equal(spawnSync(process.execPath, [cli, '--help']).status, 0);
	assert.notEqual(spawnSync(process.execPath, [cli, '--unknown']).status, 0);
	const result = spawnSync(process.execPath, [cli, 'notes', '--yes'], { cwd: root, encoding: 'utf8' });
	assert.equal(result.status, 0, result.stderr);
	assert.equal((await json(join(root, 'notes/manifest.json'))).id, 'notes');
});
