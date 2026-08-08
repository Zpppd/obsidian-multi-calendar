import { TFile, Notice, normalizePath } from "obsidian";
import type MultiCalendarPlugin from "../main";
import type { NoteType, TemplatePluginType } from "src/base/types";
import { TemplateUtil } from "../util/TemplateUtil";
import { ObsidianTemplateUtil } from "../util/ObsidianTemplateUtil";
import { TemplaterUtil } from "../util/TemplaterUtil";

// 模板服务：根据 templatePlugin 设置选择对应适配器，查找模板文件并调用插件执行
export class TemplateService {
    private plugin: MultiCalendarPlugin;
    private util: TemplateUtil;

    constructor(plugin: MultiCalendarPlugin) {
        this.plugin = plugin;
        const type = plugin.database.getSettings().templatePlugin;
        this.util = this.createUtil(type);
    }

    // 切换模板插件策略
    setPlugin(type: TemplatePluginType): void {
        this.util = this.createUtil(type);
    }

    private createUtil(type: TemplatePluginType): TemplateUtil {
        switch (type) {
            case "obsidian":
                return new ObsidianTemplateUtil(this.plugin);
            case "templater":
                return new TemplaterUtil(this.plugin);
        }
    }

    // 获取当前日历档案中指定笔记类型的模板文件
    getTemplateFile(noteType: NoteType): TFile | null {
        const profile = this.plugin.calendarManager.getActiveProfile();
        const templateName = profile.notes[noteType].templateFile;
        if (!templateName) return null;
        return this.util.findTemplateFile(templateName);
    }

    // 执行模板：等待当前活动笔记就绪后，调用对应模板插件执行语法并插入
    // 调用前需已打开目标笔记（插件通过 activeEditor 找到插入位置）
    async insertTemplate(noteType: NoteType): Promise<void> {
        const profile = this.plugin.calendarManager.getActiveProfile();
        const templateName = profile.notes[noteType].templateFile;
        if (!templateName) return;

        const templateFile = this.getTemplateFile(noteType);
        if (!templateFile) {
            const tried = this.util.getCandidatePaths(templateName).map(p => normalizePath(p)).join(", ");
            new Notice(`找不到模板文件，尝试过：${tried}。请检查路径和模板插件设置。`);
            return;
        }

        // 等待编辑器就绪（新建笔记打开后 activeEditor 可能尚未赋值）
        const editor = await this.waitForActiveEditor();
        if (!editor) {
            new Notice("插入模板失败：编辑器尚未就绪。");
            return;
        }

        await this.util.insertTemplateIntoActiveNote(templateFile);
    }

    // 循环等待 activeEditor 就绪，最多 2 秒
    private waitForActiveEditor(): Promise<boolean> {
        return new Promise(resolve => {
            let attempts = 0;
            const check = () => {
                if (this.plugin.app.workspace.activeEditor?.editor) {
                    resolve(true);
                } else if (attempts >= 20) {
                    resolve(false);
                } else {
                    attempts++;
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
}
