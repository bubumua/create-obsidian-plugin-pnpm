#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { defaultId, generateProject } from '../lib/generate.mjs';

const help = `创建一个使用 pnpm 的 Obsidian 插件项目。

用法：pnpm create obsidian-plugin-pnpm [目录] [选项]

  --id <id>               插件 ID，例如 daily-notes
  --name <name>           插件显示名称
  --author <author>       作者名称
  --description <text>    插件说明
  --yes, -y              使用默认值，不询问
  --help, -h             显示帮助

示例：
  pnpm create obsidian-plugin-pnpm my-notes
  pnpm create obsidian-plugin-pnpm my-notes --yes --author "Your name"

只生成文件，不自动安装依赖、不初始化 Git、不覆盖非空目录。`;

try {
    const { values, positionals } = parseArgs({
        allowPositionals: true,
        options: {
            id: { type: 'string' }, name: { type: 'string' }, author: { type: 'string' },
            description: { type: 'string' }, yes: { type: 'boolean', short: 'y' }, help: { type: 'boolean', short: 'h' },
        },
    });
    if (values.help) {
        console.log(help);
    } else {
        if (positionals.length > 1) throw new Error('只能指定一个目标目录。');
        let directory = positionals[0] ?? 'my-obsidian-plugin';
        const options = { id: values.id, name: values.name, author: values.author, description: values.description };
        if (!values.yes && process.stdin.isTTY && process.stdout.isTTY) {
            const rl = createInterface({ input: process.stdin, output: process.stdout });
            try {
                const ask = async (label, fallback) => (await rl.question(`${label} (${fallback})：`)).trim() || fallback;
                if (!positionals[0]) directory = await ask('项目目录', directory);
                options.id ??= await ask('插件 ID', defaultId(directory));
                options.name ??= await ask('显示名称', options.id);
                options.author ??= await ask('作者', 'Your name');
                options.description ??= await ask('插件说明', 'A personal note-taking companion.');
            } finally { rl.close(); }
        }
        const result = await generateProject(directory, options);
        console.log(`\n已创建：${result.target}\n\n进入该目录，然后运行：\n  pnpm install --frozen-lockfile\n  pnpm check\n  pnpm dev\n\n安装到 Obsidian 时，插件文件夹名称应为：${result.id}`);
    }
} catch (error) {
    console.error(`创建失败：${error.message}`);
    process.exitCode = 1;
}
