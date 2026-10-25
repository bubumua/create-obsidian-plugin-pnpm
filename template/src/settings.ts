import { type App, Notice, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type __CLASS_PREFIX__Plugin from './main';
import { createPresetList } from './settings/preset-list';

export interface __CLASS_PREFIX__Settings {
	mySetting: string;
	notes: string;
	advanced: boolean;
	mode: 'compact' | 'comfortable';
	itemLimit: number;
	opacity: number;
	accentColor: string;
	templatePath: string;
	outputFolder: string;
	secretKey: string;
	presets: string[];
}

export const DEFAULT_SETTINGS: __CLASS_PREFIX__Settings = {
	mySetting: 'default',
	notes: '',
	advanced: false,
	mode: 'comfortable',
	itemLimit: 20,
	opacity: 80,
	accentColor: '#7c3aed',
	templatePath: '',
	outputFolder: '/',
	secretKey: '',
	presets: ['日常记录', '阅读笔记'],
};

export class __CLASS_PREFIX__SettingTab extends PluginSettingTab {
	plugin: __CLASS_PREFIX__Plugin;

	constructor(app: App, plugin: __CLASS_PREFIX__Plugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	// key 被限制为真实设置字段，拼写错误会在编译期报错。
	// 此方法也用于搜索索引：只构造定义，不读写文件、不发请求。
	getSettingDefinitions(): SettingDefinitionItem<keyof __CLASS_PREFIX__Settings>[] {
		return [
			{
				name: '设置示例',
				desc: '演示控件和本地保存。不会同步笔记、创建文件或连接外部服务。',
			},
			{
				type: 'group',
				heading: '基本控件',
				items: [
					{
						name: '显示名称',
						desc: '输入 1–40 个字符。保留原模板的 mySetting 存储键。',
						aliases: ['display name', '名称'],
						control: {
							type: 'text', key: 'mySetting', placeholder: '例如：个人笔记',
							validate: (value) => value.trim().length > 0 && value.length <= 40
								? undefined : '请输入 1–40 个字符，不能只包含空白。',
						},
					},
					{
						name: '备注',
						desc: '多行文本示例，仅保存在插件设置中。',
						control: { type: 'textarea', key: 'notes', rows: 3, placeholder: '写下使用说明…' },
					},
					{
						name: '布局',
						control: {
							type: 'dropdown', key: 'mode', defaultValue: DEFAULT_SETTINGS.mode,
							options: { compact: '紧凑', comfortable: '宽松' },
						},
					},
					{
						name: '显示高级选项',
						desc: '开启后显示数量限制，并允许调整透明度。',
						control: { type: 'toggle', key: 'advanced' },
					},
					{
						name: '数量限制',
						visible: () => this.plugin.settings.advanced,
						control: {
							type: 'number', key: 'itemLimit', min: 1, max: 100, step: 1,
							validate: (value) => Number.isInteger(value) ? undefined : '请输入整数。',
						},
					},
					{
						name: '透明度',
						desc: '需先开启高级选项。这里只保存数值，不修改界面样式。',
						control: {
							type: 'slider', key: 'opacity', min: 10, max: 100, step: 5,
							displayFormat: (value) => `${value}%`,
							disabled: () => !this.plugin.settings.advanced,
						},
					},
					{
						name: '强调色',
						control: { type: 'color', key: 'accentColor' },
					},
				],
			},
			{
				type: 'page',
				name: '路径与密钥',
				desc: '演示仓库路径选择和安全存储引用。',
				items: [
					{
						name: '模板笔记',
						desc: '可留空；选择当前仓库中的 Markdown 文件。',
						control: {
							type: 'file', key: 'templatePath', placeholder: 'Templates/日记.md',
							filter: (file) => file.extension === 'md',
							// filter 只过滤建议，手动输入仍需 validate。
							validate: (value) => {
								if (!value) return;
								const file = this.app.vault.getFileByPath(value);
								return file?.extension === 'md' ? undefined : '请选择仓库中已有的 Markdown 文件。';
							},
						},
					},
					{
						name: '目标文件夹',
						desc: '选择已有文件夹；根目录为 /。不会创建或移动文件。',
						control: {
							type: 'folder', key: 'outputFolder', includeRoot: true,
							validate: (value) => this.app.vault.getFolderByPath(value)
								? undefined : '请选择仓库中已有的文件夹。',
						},
					},
					{
						name: '密钥引用',
						desc: '可选。设置中仅保存密钥名称；密钥内容由 Obsidian 管理。本示例不读取或发送密钥。',
						// secret 控件要求 Obsidian 1.13.2+，不要改成明文 text。
						control: { type: 'secret', key: 'secretKey' },
					},
				],
			},
			createPresetList(this),
			{
				type: 'group',
				heading: '操作与自定义渲染',
				items: [
					{
						name: '预览显示名称',
						desc: '点击整行显示本地通知。',
						action: () => { new Notice(`当前名称：${this.plugin.settings.mySetting}`); },
					},
					{
						name: '切换布局',
						desc: '演示一行多个按钮，以及自定义控件的手动保存。',
						// control、action、render 三者互斥。render 不会自动保存。
						render: (setting) => {
							for (const [mode, label] of [['compact', '紧凑'], ['comfortable', '宽松']] as const) {
								setting.addButton((button) => button.setButtonText(label).onClick(async () => {
									this.plugin.settings.mode = mode;
									await this.saveAndRefresh();
								}));
							}
						},
					},
				],
			},
		];
	}

	// 仅供自定义 render / 列表操作调用；control 默认自动写入 settings 并 saveData。
	async saveAndRefresh(): Promise<void> {
		try {
			await this.plugin.saveSettings();
		} catch {
			new Notice('设置保存失败，请检查仓库是否可写。');
		} finally {
			// 列表结构或显示值改变时重建定义；仅条件状态变化可用 refreshDomState()。
			this.update();
		}
	}
}
