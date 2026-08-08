import { TFile, Modal, normalizePath, Notice } from "obsidian";
import { DateTime } from "luxon";
import type MultiCalendarPlugin from "../main";
import type { NoteType } from "src/base/types";
import { formatMoment } from "../util/momentFormat";

// 创建笔记前的确认弹窗
class ConfirmModal extends Modal {
    private onConfirm: () => void;

    constructor(plugin: MultiCalendarPlugin, onConfirm: () => void) {
        super(plugin.app);
        this.onConfirm = onConfirm;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.createEl("p", { text: "确定创建这条笔记吗？" });
        contentEl.createEl("button", { text: "创建" }).addEventListener("click", () => {
            this.onConfirm();
            this.close();
        });
    }

    onClose(): void {
        this.contentEl.empty();
    }
}

// 笔记服务：根据日历档案的路径规则，打开或创建笔记
export class NoteService {
    private plugin: MultiCalendarPlugin;

    constructor(plugin: MultiCalendarPlugin) {
        this.plugin = plugin;
    }

    // 获取笔记文件路径，未启用或未配置路径时返回 null
    getNotePath(date: DateTime, noteType: NoteType): string | null {
        const profile = this.plugin.calendarManager.getActiveProfile();
        const config = profile.notes[noteType];
        if (!config.enabled || !config.pathPattern) {
            return null;
        }
        // 路径规则使用 moment 语法（与 Obsidian 原生日记一致，支持 dddd 等）
        const folderAndName = formatMoment(date.toJSDate(), config.pathPattern);
        return normalizePath(`${folderAndName}.md`);
    }

    // 检查笔记是否存在
    hasNote(date: DateTime, noteType: NoteType): boolean {
        const path = this.getNotePath(date, noteType);
        if (!path) return false;
        return this.plugin.app.vault.getAbstractFileByPath(path) instanceof TFile;
    }

    // 统计某日笔记的字数（找不到笔记或未配置时返回 0）
    // 统计规则：汉字、英文字母单词、数字各算一个字/词
    async countWords(date: DateTime, noteType: NoteType): Promise<number> {
        const path = this.getNotePath(date, noteType);
        if (!path) return 0;
        const file = this.plugin.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) return 0;

        const content = await this.plugin.app.vault.cachedRead(file);
        const result = content.match(/[一-龥]|[A-Za-z]+[0-9]*[A-Za-z0-9]*|[0-9]+/g);
        return result ? result.length : 0;
    }

    // 根据配置的字数换算统计点数：一个点 wordsPerDot 字，上限 dotUpperLimit
    getDotCount(words: number): number {
        const settings = this.plugin.database.getSettings();
        const wordsPerDot = settings.wordsPerDot || 100;
        const dotUpperLimit = settings.dotUpperLimit || 3;
        const dots = Math.ceil(words / wordsPerDot);
        return Math.min(dots, dotUpperLimit);
    }

    // 打开已有笔记，或创建新笔记
    async openOrCreate(date: DateTime, noteType: NoteType): Promise<void> {
        const path = this.getNotePath(date, noteType);
        if (!path) {
            new Notice("未配置该笔记类型的路径规则，或未启用。请到设置中配置。");
            return;
        }

        // 已有笔记：直接打开
        const existing = this.plugin.app.vault.getAbstractFileByPath(path);
        if (existing instanceof TFile) {
            await this.plugin.app.workspace.getLeaf(false).openFile(existing);
            return;
        }

        // 新建笔记：先确认再创建
        const settings = this.plugin.database.getSettings();
        const doCreate = async () => {
            await this.ensureFolder(path);
            const file = await this.plugin.app.vault.create(path, "");
            // 先打开笔记成为活动笔记，再插入模板（模板插件通过 activeEditor 定位插入点）
            await this.plugin.app.workspace.getLeaf(false).openFile(file);
            await this.plugin.templateService.insertTemplate(noteType);
        };

        try {
            if (settings.shouldConfirmBeforeCreate) {
                new ConfirmModal(this.plugin, doCreate).open();
            } else {
                await doCreate();
            }
        } catch (e) {
            new Notice(`创建笔记失败：${(e as Error).message}`);
        }
    }

    // 确保父级目录存在（路径可以包含多级文件夹）
    private async ensureFolder(path: string): Promise<void> {
        const folderPath = path.substring(0, path.lastIndexOf("/"));
        if (!folderPath) return;

        const parts = folderPath.split("/");
        let current = "";
        for (const part of parts) {
            current = current ? `${current}/${part}` : part;
            if (!this.plugin.app.vault.getAbstractFileByPath(current)) {
                await this.plugin.app.vault.createFolder(current);
            }
        }
    }
}
