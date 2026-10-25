# create-obsidian-plugin-pnpm

用 pnpm 创建 Obsidian 插件项目。零运行时依赖，使用 Node.js 内置 API 复制内置模板；创建过程不访问网络、不安装依赖、不执行 Git 命令。

## 使用

需要 Node.js 22.13+，推荐 Node.js 24。生成的插件使用 pnpm 12.15.0，最低 Obsidian 1.13.2。

发布到 npm 后：

```sh
pnpm create obsidian-plugin-pnpm my-notes
```

交互式填写插件 ID、显示名称、作者、说明。自动化使用：

```sh
pnpm create obsidian-plugin-pnpm my-notes --yes --id my-notes --name "My notes" --author "Your name" --description "A note-taking companion."
```

`--yes` 或非交互环境使用默认值，未填写作者时为 `Your name`。目标必须是新目录或空目录。参数详情：`--help`。

```sh
cd my-notes
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

`obsidian` 的版本声明是 `latest`，锁文件固定模板验证过的解析版本。需要升级时运行 `pnpm update obsidian --latest` 并重新检查兼容性。

## 模板内容与维护

- TypeScript 严格检查、esbuild、ESLint、pnpm 锁文件和 GitHub CI / 草稿 release 工作流。
- 声明式设置：10 种控件、分组、子页、搜索、输入校验、条件状态、列表增删排序、自定义按钮。
- 自动写入 package.json / manifest.json 元数据，替换 TypeScript 类名。插件模板保持 `private: true`，通过 GitHub release 分发；脚手架包自身可发布到 npm。
- 从 obsidian-veysync 的当前模板复制。仅在模板副本中移除了演示定时日志、全局点击通知；未修改来源项目。

目录：`bin/` 是入口，`lib/` 是生成逻辑，`template/` 是模板，`test/` 是 Node 内置测试。

模板中的 `package.json.template` / `pnpm-lock.yaml.template` 在生成时去掉 `.template`；`_gitignore` 还原为 `.gitignore`，避免打包工具忽略或改名。源码用 `__CLASS_PREFIX__` 占位。更新模板配置或依赖时，应生成测试项目、更新其锁文件，再把锁文件复制回 `template/pnpm-lock.yaml.template`。不要复制 node_modules、构建产物或仓库私有数据。

```sh
pnpm check
node bin/index.mjs .smoke --yes --id smoke-notes --author "Template test"
pnpm --dir .smoke install --frozen-lockfile
pnpm --dir .smoke check
```

模板来源于 Obsidian sample plugin，保留原 LICENSE（0-BSD）。项目与 Obsidian 官方无隶属关系。

## 发布前需要填写的信息

编辑根目录 `package.json`，不要误改 `template/package.json.template`：

| 字段 | 应填写内容 | 要求 |
| --- | --- | --- |
| `name` | 当前为 `create-obsidian-plugin-pnpm` | 发布时必须可用且你有权限；若改名需同步 bin、README 的创建命令 |
| `version` | 当前为 `0.1.0` | 每次发布使用未发布过的版本 |
| `author` | 你的公开署名，可用字符串或 `{ "name": "...", "url": "..." }` | 推荐补充，邮箱可省略 |
| `repository` | `{ "type": "git", "url": "git+https://github.com/你的账号/create-obsidian-plugin-pnpm.git" }` | 推荐补充真实仓库地址 |
| `homepage` | `https://github.com/你的账号/create-obsidian-plugin-pnpm#readme` | 推荐 |
| `bugs` | `{ "url": "https://github.com/你的账号/create-obsidian-plugin-pnpm/issues" }` | 推荐 |
| `description` / `license` | 已设置说明和 `0-BSD` | 确认即可；保留上游授权文字 |

GitHub 仓库尚未创建，未配置远程地址。发布不要求必须有 GitHub，但推荐先创建仓库并推送代码。`author` 等元数据不是 npm 登录凭据。

你还需要 npm 账号及包名发布权限；按 npm 当前要求配置账号验证/2FA。不要把 token、密码或验证码写进仓库或发给助手。

手动发布流程（以下命令不会被脚手架自动执行）：

```sh
pnpm view create-obsidian-plugin-pnpm name version
npm login
pnpm check
pnpm pack
# 检查生成的 tgz 确实包含 bin、lib、template，以及模板的隐藏配置。
# 提交并推送本地修改，确保 Git 工作区干净。
pnpm publish --access public
```

`npm login` 仅用于登录 npm registry；依赖安装、构建和发布仍用 pnpm。查询包名返回 404 仅表示当时未查询到包，不保证发布时一定可注册。`prepublishOnly` 会运行测试；CI 只验证，不自动发布。

发布完成后可从其他目录运行 `pnpm create obsidian-plugin-pnpm my-notes`。本地尚未发布时使用 `node bin/index.mjs <目标目录>`。

参考：[pnpm create](https://pnpm.io/cli/create)、[npm 发布指南](https://docs.npmjs.com/creating-and-publishing-unscoped-public-packages/)。
