import { TFile } from "obsidian";
import type MultiCalendarPlugin from "../main";

// 模板工具基类（策略模式）：
// 不同模板插件的差异只在于"模板文件从哪个目录找"，子类实现 findTemplateFile 即可
export abstract class TemplateUtil {
    protected plugin: MultiCalendarPlugin;

    constructor(plugin: MultiCalendarPlugin) {
        this.plugin = plugin;
    }

    // 根据文件名查找模板文件，找不到返回 null
    abstract findTemplateFile(templateName: string): TFile | null;

    // 读取模板内容
    async readTemplate(templateFile: TFile): Promise<string> {
        return this.plugin.app.vault.read(templateFile);
    }
}
