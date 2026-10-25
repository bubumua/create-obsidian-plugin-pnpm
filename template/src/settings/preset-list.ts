import { Notice, type SettingDefinitionList } from 'obsidian';
import type { __CLASS_PREFIX__Settings, __CLASS_PREFIX__SettingTab } from '../settings';

// 单独封装动态列表，避免 settings.ts 随示例数量无限增长。
export function createPresetList(tab: __CLASS_PREFIX__SettingTab): SettingDefinitionList<keyof __CLASS_PREFIX__Settings> {
  return {
    type: 'list',
    heading: '预设列表',
    emptyState: '暂无预设，选择添加按钮创建一个。',
    items: tab.plugin.settings.presets.map((name) => ({
      name,
      desc: '点击预览；拖动排序，或选择删除按钮移除。',
      action: () => { new Notice(`预设：${name}`); },
    })),
    addItem: {
      name: '添加预设',
      action: () => {
        const presets = tab.plugin.settings.presets;
        let suffix = 1;
        while (presets.includes(`预设 ${suffix}`)) suffix++;
        presets.push(`预设 ${suffix}`);
        void tab.saveAndRefresh();
      },
    },
    onDelete: (index) => {
      tab.plugin.settings.presets.splice(index, 1);
      void tab.saveAndRefresh();
    },
    onReorder: (from, to) => {
      const presets = tab.plugin.settings.presets;
      if (from < 0 || to < 0 || from >= presets.length || to >= presets.length) return;
      const [entry] = presets.splice(from, 1);
      if (entry === undefined) return;
      presets.splice(to, 0, entry);
      void tab.saveAndRefresh();
    },
  };
}
