import { constants } from 'node:fs';
import { copyFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, join, parse, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const templateDir = fileURLToPath(new URL('../template/', import.meta.url));
const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

export function validateId(id) {
	if (typeof id !== 'string' || id.length > 100 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(id) || reserved.test(id)) {
		throw new Error('插件 ID 必须以小写字母开头，只包含小写字母、数字和单个连字符，最长 100 字符，且不能为系统保留名称。');
	}
	return id;
}

export function defaultId(directory) {
	const value = basename(resolve(directory)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
	try { return validateId(value); } catch { return 'my-notes'; }
}

function text(value, label, fallback) {
	const result = (value ?? fallback).trim();
	if (!result || /[\r\n\x00-\x1f]/.test(result)) throw new Error(`${label}不能为空或包含控制字符。`);
	return result;
}

async function copyTemplate(from, to, prefix) {
	await mkdir(to, { recursive: true });
	for (const entry of await readdir(from, { withFileTypes: true })) {
		const name = entry.name === '_gitignore' ? '.gitignore' : entry.name.replace(/\.template$/, '');
		const source = join(from, entry.name);
		const target = join(to, name);
		if (entry.isDirectory()) await copyTemplate(source, target, prefix);
		else if (entry.isFile()) {
			if (entry.name.endsWith('.ts')) {
				const contents = (await readFile(source, 'utf8')).replaceAll('__CLASS_PREFIX__', prefix);
				await writeFile(target, contents, { flag: 'wx' });
			} else await copyFile(source, target, constants.COPYFILE_EXCL);
		} else throw new Error(`模板包含不支持的文件类型：${source}`);
	}
}

export async function generateProject(directory, options = {}) {
	const target = resolve(directory);
	if (target === parse(target).root) throw new Error('不能在磁盘根目录创建项目。');
	const id = validateId(options.id ?? defaultId(target));
	const name = text(options.name, '插件名称', id.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' '));
	const author = text(options.author, '作者', 'Your name');
	const description = text(options.description, '插件说明', 'A personal note-taking companion.');
	let existing;
	try { existing = await lstat(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
	if (existing && (!existing.isDirectory() || existing.isSymbolicLink() || (await readdir(target)).length)) {
		throw new Error('目标必须是新目录或空目录；不会覆盖已有文件。');
	}
	// 固定前缀保证数字段、保留词和模板示例名称都不会生成非法类名。
	const prefix = 'Notebook' + id.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
	await mkdir(dirname(target), { recursive: true });
	await copyTemplate(templateDir, target, prefix);
	const readJson = async (file) => JSON.parse(await readFile(join(target, file), 'utf8'));
	const writeJson = (file, data) => writeFile(join(target, file), JSON.stringify(data, null, '\t') + '\n');
	const pkg = await readJson('package.json');
	Object.assign(pkg, { name: id, description, author });
	await writeJson('package.json', pkg);
	const manifest = await readJson('manifest.json');
	Object.assign(manifest, { id, name, description, author });
	await writeJson('manifest.json', manifest);
	return { target, id, name };
}
