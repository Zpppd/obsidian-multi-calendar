import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type MultiCalendarPlugin from "../../main";
import { NoteType } from "src/base/types";
import type { NoteConfig } from "src/entity/CalendarProfile";

// 五种笔记类型的展示顺序和中文名
const NOTE_TYPES: Array<{ type: NoteType; label: string }> = [
    { type: NoteType.DAILY, label: "每日笔记" },
    { type: NoteType.WEEKLY, label: "每周笔记" },
    { type: NoteType.MONTHLY, label: "每月笔记" },
    { type: NoteType.QUARTERLY, label: "每季笔记" },
    { type: NoteType.YEARLY, label: "每年笔记" },
];

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
        this.renderCalendarManagement(containerEl);
        this.renderNoteConfigs(containerEl);
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
                }));

        new Setting(container)
            .setName("标记颜色")
            .addText(text => text
                .setValue(profile.color)
                .onChange(async value => {
                    this.plugin.calendarManager.updateCalendar(profile.id, { color: value });
                }));

        // 五种笔记类型各自的配置
        for (const { type, label } of NOTE_TYPES) {
            this.renderNoteTypeConfig(container, profile.id, type, label);
        }
    }

    // 单个笔记类型的配置：开关 + 路径规则 + 模板文件
    private renderNoteTypeConfig(container: HTMLElement, profileId: string, type: NoteType, label: string): void {
        const profile = this.plugin.calendarManager.listCalendars().find(c => c.id === profileId);
        if (!profile) return;
        const config = profile.notes[type];

        const patchNote = (patch: Partial<NoteConfig>) => {
            const notes = { ...profile.notes, [type]: { ...config, ...patch } };
            this.plugin.calendarManager.updateCalendar(profileId, { notes });
        };

        new Setting(container)
            .setName(label)
            .setHeading()
            .addToggle(toggle => toggle
                .setValue(config.enabled)
                .onChange(value => patchNote({ enabled: value })));

        new Setting(container)
            .setName("路径规则")
            .setDesc("使用 luxon 格式，如 yyyy-MM-dd")
            .addText(text => text
                .setValue(config.pathPattern)
                .setPlaceholder("日记/yyyy-MM-dd")
                .onChange(value => patchNote({ pathPattern: value })));

        new Setting(container)
            .setName("模板文件")
            .addText(text => text
                .setValue(config.templateFile)
                .setPlaceholder("daily-template.md")
                .onChange(value => patchNote({ templateFile: value })));
    }
}
