import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import type { NoteConfig } from "src/entity/CalendarProfile";
import { formatMoment } from "../../util/momentFormat";

// 用 moment 格式化生成预览路径（与 Obsidian 原生日记语法一致，无 pattern 时返回空）
function previewPath(pattern: string): string {
    if (!pattern) return "";
    try {
        return formatMoment(new Date(), pattern);
    } catch {
        return "";
    }
}

// 五种笔记类型的展示顺序和中文名
const NOTE_TYPES: Array<{ type: NoteType; label: string }> = [
    { type: NoteType.DAILY, label: "每日笔记" },
    { type: NoteType.WEEKLY, label: "每周笔记" },
    { type: NoteType.MONTHLY, label: "每月笔记" },
    { type: NoteType.QUARTERLY, label: "每季笔记" },
    { type: NoteType.YEARLY, label: "每年笔记" },
];

// 每种笔记类型的常用路径示例（moment 语法）
const PATH_EXAMPLES: Record<NoteType, string> = {
    [NoteType.DAILY]: "日记/yyyy-MM-dd dddd",
    [NoteType.WEEKLY]: "日记/yyyy年/第WW周",
    [NoteType.MONTHLY]: "日记/yyyy年MM月",
    [NoteType.QUARTERLY]: "日记/yyyy年/[第]Q[季度]",
    [NoteType.YEARLY]: "日记/yyyy年",
};

// moment 语法速查（鼠标悬停显示完整提示）
// 说明：moment 中方括号 [...] 内的文字原样输出，如 第Q季度 → 第1季度
const TOKEN_HINTS = "语法：yyyy=年, MM=月, DD=日, dddd=星期几, WW=周数, Q=季度; 方括号内文字原样输出，如 日记/yyyy年/[第]Q[季度] → 日记/2026年/第3季度";

// 设置面板：日历管理 + 笔记配置
export class MainSettingTab extends PluginSettingTab {
    private plugin: MultiCalendarPlugin;
    private editingId: string;

    constructor(app: App, plugin: MultiCalendarPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.editingId = plugin.calendarManager.getActiveProfile().id;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        this.renderGlobalSettings(containerEl);
        this.renderCalendarManagement(containerEl);
        this.renderNoteConfigs(containerEl);
    }

    // 全局设置：模板插件类型 + 统计点配置
    private renderGlobalSettings(container: HTMLElement): void {
        new Setting(container).setName("全局设置").setHeading();

        const settings = this.plugin.database.getSettings();
        new Setting(container)
            .setName("模板插件")
            .setDesc("选择模板文件由哪个插件管理，新建笔记时会套用对应模板")
            .addDropdown(dropdown => dropdown
                .addOption("obsidian", "Obsidian 核心模板")
                .addOption("templater", "Templater")
                .setValue(settings.templatePlugin)
                .onChange(async value => {
                    const type = value as "obsidian" | "templater";
                    settings.templatePlugin = type;
                    await this.plugin.database.saveSettings(settings);
                    this.plugin.templateService.setPlugin(type);
                }));

        // 创建行为
        new Setting(container)
            .setName("创建前确认")
            .setDesc(settings.shouldConfirmBeforeCreate ? "创建新笔记前需要确认" : "创建新笔记前不确认")
            .addToggle(toggle => toggle
                .setValue(settings.shouldConfirmBeforeCreate)
                .onChange(async value => {
                    settings.shouldConfirmBeforeCreate = value;
                    await this.plugin.database.saveSettings(settings);
                }));

        // 显示设置
        new Setting(container).setName("显示设置").setHeading();

        new Setting(container)
            .setName("显示农历")
            .setDesc(settings.shouldDisplayLunarInfo ?? true ? "在日期格子里显示农历" : "不显示农历")
            .addToggle(toggle => toggle
                .setValue(settings.shouldDisplayLunarInfo ?? true)
                .onChange(async value => {
                    settings.shouldDisplayLunarInfo = value;
                    await this.plugin.database.saveSettings(settings);
                    this.plugin.notifyViewRefresh();
                }));

        new Setting(container)
            .setName("显示节假日/调休")
            .setDesc(settings.shouldDisplayHolidayInfo ?? true ? "标记法定假日和调休上班日" : "不显示节假日")
            .addToggle(toggle => toggle
                .setValue(settings.shouldDisplayHolidayInfo ?? true)
                .onChange(async value => {
                    settings.shouldDisplayHolidayInfo = value;
                    await this.plugin.database.saveSettings(settings);
                    this.plugin.notifyViewRefresh();
                }));

        // 统计点配置（旧数据可能缺字段，用 ?? 兜底）
        new Setting(container).setName("笔记统计点").setHeading();

        new Setting(container)
            .setName("颜色")
            .addText(text => text
                .setValue(settings.dotColor ?? "#4A90D9")
                .onChange(async value => {
                    settings.dotColor = value || "#4A90D9";
                    await this.plugin.database.saveSettings(settings);
                    this.plugin.notifyViewRefresh();
                }));

        new Setting(container)
            .setName("每个点的字数")
            .addText(text => text
                .setValue(String(settings.wordsPerDot ?? 100))
                .setPlaceholder("100")
                .onChange(async value => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num > 0) {
                        settings.wordsPerDot = num;
                        await this.plugin.database.saveSettings(settings);
                        this.plugin.notifyViewRefresh();
                    }
                }));

        new Setting(container)
            .setName("最多显示点数")
            .addText(text => text
                .setValue(String(settings.dotUpperLimit ?? 3))
                .setPlaceholder("3")
                .onChange(async value => {
                    const num = parseInt(value, 10);
                    if (!isNaN(num) && num >= 0) {
                        settings.dotUpperLimit = num;
                        await this.plugin.database.saveSettings(settings);
                        this.plugin.notifyViewRefresh();
                    }
                }));
    }

    // 日历管理区：列出所有日历，支持切换编辑、新增、删除
    private renderCalendarManagement(container: HTMLElement): void {
        new Setting(container).setName("日历管理").setHeading();

        const calendars = this.plugin.calendarManager.listCalendars();
        for (const cal of calendars) {
            const isEditing = cal.id === this.editingId;
            new Setting(container)
                .setName(cal.name)
                .setDesc(isEditing ? "正在编辑" : "点击开始编辑该日历")
                .addButton(btn => btn
                    .setButtonText("编辑")
                    .onClick(() => {
                        this.editingId = cal.id;
                        this.display();
                    }))
                .addButton(btn => btn
                    .setIcon("trash")
                    .setTooltip("删除")
                    .onClick(() => {
                        try {
                            this.plugin.calendarManager.deleteCalendar(cal.id);
                            if (this.editingId === cal.id) {
                                this.editingId = this.plugin.calendarManager.getActiveProfile().id;
                            }
                            this.display();
                            this.plugin.notifyViewRefresh();
                        } catch (e) {
                            new Notice((e as Error).message);
                        }
                    }));
        }

        new Setting(container)
            .addButton(btn => btn
                .setButtonText("+ 新增日历")
                .onClick(async () => {
                    // 简化：用默认名称创建，用户可在下方重命名
                    const profile = this.plugin.calendarManager.createCalendar("新日历");
                    this.editingId = profile.id;
                    this.display();
                    this.plugin.notifyViewRefresh();
                }));
    }

    // 笔记配置区：当前编辑日历的 5 种笔记类型配置
    private renderNoteConfigs(container: HTMLElement): void {
        const profile = this.plugin.calendarManager
            .listCalendars()
            .find(c => c.id === this.editingId);
        if (!profile) return;

        new Setting(container).setName(`正在编辑：${profile.name}`).setHeading();

        // 日历基础信息：名称 + 颜色
        new Setting(container)
            .setName("日历名称")
            .addText(text => text
                .setValue(profile.name)
                .onChange(async value => {
                    this.plugin.calendarManager.updateCalendar(profile.id, { name: value });
                    this.plugin.notifyViewRefresh();
                }));

        new Setting(container)
            .setName("标记颜色")
            .addText(text => text
                .setValue(profile.color)
                .onChange(async value => {
                    this.plugin.calendarManager.updateCalendar(profile.id, { color: value });
                    this.plugin.notifyViewRefresh();
                }));

        // 五种笔记类型各自的配置
        for (const { type, label } of NOTE_TYPES) {
            this.renderNoteTypeConfig(container, profile.id, type, label);
        }
    }

    // 路径预览文案
    private pathPreviewText(pattern: string): string {
        if (!pattern) return "未配置路径规则，双击不会创建笔记";
        const preview = previewPath(pattern);
        return preview ? `实际路径示例：${preview}.md` : "路径规则无法解析";
    }

    // 单个笔记类型的配置：开关 + 路径规则 + 模板文件
    private renderNoteTypeConfig(container: HTMLElement, profileId: string, type: NoteType, label: string): void {
        const profile = this.plugin.calendarManager.listCalendars().find(c => c.id === profileId);
        if (!profile) return;
        const config = profile.notes[type];

        // 保存时从最新数据读取，避免用渲染时的旧快照覆盖其他字段
        const patchNote = (patch: Partial<NoteConfig>) => {
            const current = this.plugin.calendarManager.listCalendars().find(c => c.id === profileId);
            if (!current) return;
            const notes = { ...current.notes, [type]: { ...current.notes[type], ...patch } };
            this.plugin.calendarManager.updateCalendar(profileId, { notes });
            this.plugin.notifyViewRefresh();
        };

        new Setting(container)
            .setName(label)
            .setHeading();

        const enableSetting = new Setting(container)
            .setName("启用")
            .setDesc(config.enabled ? "已启用" : "已停用")
            .addToggle(toggle => toggle
                .setValue(config.enabled)
                .onChange(value => {
                    patchNote({ enabled: value });
                    // 同步更新描述文字
                    enableSetting.descEl.setText(value ? "已启用" : "已停用");
                }));

        const pathSetting = new Setting(container)
            .setName("路径规则")
            .setDesc("");

        // 示例 + 语法速查（悬停显示完整说明）
        pathSetting.descEl.empty();
        pathSetting.descEl.createSpan({
            text: `示例：${PATH_EXAMPLES[type]}`,
        }).addEventListener("mouseenter", e => { void e; });
        pathSetting.descEl.createEl("br");
        pathSetting.descEl.createEl("small", {
            text: "语法：yyyy=年 MM=月 DD=日 dddd=星期几 WW=周数 Q=季度",
            attr: { title: TOKEN_HINTS },
        });

        // 输入框 + 实时预览
        const previewEl = pathSetting.descEl.createEl("br");
        const previewSpan = pathSetting.descEl.createSpan({
            text: this.pathPreviewText(config.pathPattern),
        });

        pathSetting.addText(text => text
            .setValue(config.pathPattern)
            .setPlaceholder("日记/yyyy-MM-dd")
            .onChange(value => {
                patchNote({ pathPattern: value });
                previewSpan.setText(this.pathPreviewText(value));
            }));

        void previewEl;

        new Setting(container)
            .setName("模板文件")
            .addText(text => text
                .setValue(config.templateFile)
                .setPlaceholder("daily-template.md")
                .onChange(value => patchNote({ templateFile: value })));
    }
}
