import { TFile, normalizePath } from "obsidian";
import type MultiCalendarPlugin from "../main";

// 模板工具基类（策略模式）：
// 不同模板插件的差异在于"模板文件名要拼什么前缀"和"如何执行模板"，子类分别实现
export abstract class TemplateUtil {
    protected plugin: MultiCalendarPlugin;

    constructor(plugin: MultiCalendarPlugin) {
        this.plugin = plugin;
    }

    // 子类实现：把模板文件名解析成完整路径（不处理扩展名）
    abstract resolveTemplatePath(templateName: string): string;

    // 子类实现：调用对应模板插件执行模板，插入当前活动笔记
    // @param templateFile 已找到的模板文件
    abstract insertTemplateIntoActiveNote(templateFile: TFile): Promise<void>;

    // 生成候选路径：优先 vault 根原样，再试插件模板文件夹下，各补一次 .md
    getCandidatePaths(templateName: string): string[] {
        const candidates = new Set<string>();
        candidates.add(templateName);
        if (!templateName.toLowerCase().endsWith(".md")) {
            candidates.add(`${templateName}.md`);
        }
        const withFolder = this.resolveTemplatePath(templateName);
        candidates.add(withFolder);
        if (!withFolder.toLowerCase().endsWith(".md")) {
            candidates.add(`${withFolder}.md`);
        }
        return [...candidates];
    }

    // 查找模板文件：依次尝试候选路径，找到返回，找不到返回 null
    findTemplateFile(templateName: string): TFile | null {
        for (const name of this.getCandidatePaths(templateName)) {
            const path = normalizePath(name);
            const file = this.plugin.app.vault.getAbstractFileByPath(path);
            if (file instanceof TFile) return file;
        }
        return null;
    }
}
