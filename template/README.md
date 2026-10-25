# Obsidian 插件项目

由 create-obsidian-plugin-pnpm 生成，插件名称、ID 和作者见 manifest.json。

## 开发

使用 Node.js 24（最低 22.13）和 pnpm 12.15.0。

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm dev
# 另开终端持续检查类型
pnpm typecheck:watch
```

发布到 Obsidian 前，将 main.js、manifest.json、styles.css 复制到测试仓库的 `.obsidian/plugins/<manifest.id>/` 并启用插件。main.js 不提交 Git，发布时作为 release 附件。

`obsidian: latest` 使用锁文件中的版本；主动升级：`pnpm update obsidian --latest`。最低 Obsidian 版本为 1.13.2。当前功能仅为本地演示，无同步或网络请求。

通过 `pnpm version patch` 更新版本，提交后推送与版本一致、不带 v 的 tag；附带的 release 工作流会构建并创建 GitHub 草稿 release，需人工检查后发布。

## 声明式设置示例

插件最低要求 Obsidian **1.13.2**（`secret` 控件的引入版本）。`src/settings.ts` 使用 `getSettingDefinitions()`，不再覆盖 `display()`；列表示例单独放在 `src/settings/preset-list.ts`。

| 示例 | 展示的能力 |
| --- | --- |
| 显示名称、备注 | `text` / `textarea`、输入校验、搜索别名 |
| 布局、高级选项 | `dropdown` / `toggle`、默认值 |
| 数量限制、透明度 | `number` / `slider`、范围与整数校验、条件显示/禁用、数值格式 |
| 强调色 | `color`，保存十六进制颜色 |
| 路径与密钥子页 | `page`、`file` / `folder` 建议与校验、`secret` 引用 |
| 预设列表 | `list`、空状态、添加、删除、拖动排序 |
| 预览与布局按钮 | `action`、`render`、多按钮、手动保存与刷新 |

这些控件仅演示设置和本地保存，不执行同步或修改笔记。`control.key` 对应 `plugin.settings` 的字段，Obsidian 自动写入并保存；自定义 `render` 和列表操作需要自行保存。`getSettingDefinitions()` 也会用于搜索索引，因此不能在其中执行 I/O。`validate` 仅拦截界面输入，不会清理历史存储数据；实际功能读取设置时应另行校验。新增数组默认值使用深拷贝，避免列表操作污染默认配置。

手动验收（Obsidian 1.13.2+）：

1. 安装构建产物并打开设置页，应出现基本控件、路径子页、预设列表和操作分组。
2. 修改各控件后重启插件，值应保留；输入空白名称、小数数量或不存在的路径，应提示错误且不保存无效值。
3. 切换高级选项，数量限制应显示/隐藏，透明度应启用/禁用。
4. 在设置搜索中搜索“显示名称”或 `display name`，应找到对应项；打开路径子页后可正常返回。
5. 添加、排序、删除预设，重新打开设置确认顺序持久化；全部删除后应显示空状态。
6. 选择“紧凑”或“宽松”按钮，布局下拉值应同步并持久化；点击预览行应显示通知。
7. 若测试密钥控件，使用测试密钥；插件 `data.json` 的 `secretKey` 应只保存引用名称，不包含密钥内容。

参考：[Obsidian 声明式设置迁移指南](https://docs.obsidian.md/plugins/guides/migrate-declarative-settings)。

