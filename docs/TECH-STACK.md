# 技术选型与要求

## 一、技术栈

| 类别 | 选择 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue 3 | ^3.4+ | Composition API，开发者熟悉 |
| 状态管理 | Pinia | ^2.1+ | Vue 3 官方推荐，比 Redux 少样板代码 |
| 语言 | TypeScript | ^5.4+ | 类型安全，与 Obsidian API 类型匹配 |
| 日期库 | luxon | ^3.4+ | 支持国际化格式化和时区，与参考项目一致 |
| 图标 | lucide-vue-next | ^0.350+ | 与参考项目 lucide-react 的 Vue 对应版本 |
| 构建 | esbuild | ^0.20+ | 快速打包，通过 esbuild.config.mjs 配置 |
| 包管理 | npm | 最新稳定版 | Obsidian 插件开发标准选择 |

## 二、不引入的依赖（刻意精简）

| 不引入 | 原因 |
|--------|------|
| 农历库 (lunar-typescript) | 第一版不包含农历功能，后续可选加入 |
| 日历组件库 (如 fullcalendar) | 日历视图完全手写，`<div>` 网格即可，不引入外部依赖 |
| CSS 框架 (如 Tailwind) | Obsidian 插件使用原生 CSS + CSS 变量，保持轻量 |
| Vue Router | 日历面板是单视图，不需要路由 |
| Axios / fetch 封装 | 纯本地功能，无网络请求 |

## 三、构建配置

### esbuild.config.mjs

```javascript
import esbuild from 'esbuild';
import process from 'process';

const prod = process.argv[2] === 'production';

esbuild.build({
    entryPoints: ['src/main.ts'],
    bundle: true,
    outfile: 'dist/main.js',
    external: ['obsidian'],
    format: 'cjs',
    target: 'es2018',
    logLevel: 'info',
    sourcemap: prod ? false : 'inline',
    minify: prod,
    treeShaking: true,
    plugins: [
        {
            name: 'vue-sfc',
            setup(build) {
                // 使用 esbuild-plugin-vue 或自定义处理 .vue 文件
            }
        }
    ],
}).catch(() => process.exit(1));
```

### tsconfig.json 关键配置

```json
{
    "compilerOptions": {
        "target": "ES2018",
        "module": "ESNext",
        "moduleResolution": "node",
        "strict": true,
        "jsx": "preserve",
        "lib": ["DOM", "ES2018"],
        "allowSyntheticDefaultImports": true,
        "isolatedModules": true,
        "outDir": "dist",
        "baseUrl": "."
    },
    "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

## 四、关于 Vue SFC 的构建说明

Obsidian 插件标准构建流程使用 esbuild，默认不支持 `.vue` 单文件组件。有两种处理方式：

### 方案 A：使用 TSX 编写组件（推荐）

```typescript
// src/view/CalendarSwitcher.tsx
import { defineComponent, ref } from 'vue';

export default defineComponent({
    setup() {
        const name = ref('生活日历');
        return () => (
            <div class="calendar-switcher">
                <span>{name.value}</span>
            </div>
        );
    }
});
```

- ✅ 不需要额外插件，esbuild 原生支持
- ✅ 与参考项目（React TSX）写法接近
- ⚠️ 模板语法略有不同（JSX vs SFC template）

### 方案 B：使用 esbuild-plugin-vue

安装 `esbuild-plugin-vue` 支持 `.vue` 文件，可以使用 SFC 的 `<template>` / `<script setup>` / `<style scoped>`。

- ✅ 更标准的 Vue 开发体验
- ✅ 样式 scoped 开箱即用
- ⚠️ 额外依赖，需验证与 Obsidian 的兼容性

**最终选择：方案 A（TSX）**。理由：
1. 零额外构建依赖
2. 与参考项目的代码风格一致（都是 TSX）
3. 日历组件结构简单，TSX 完全够用
4. 更易于后续维护者理解（统一的技术表达）

## 五、开发环境

- IDE：VS Code（开发者已在使用）
- 操作系统：Windows 10/11
- Git：版本管理
- 测试 Obsidian：本地 Obsidian vault 的 `.obsidian/plugins/` 目录，通过符号链接或直接复制到插件目录进行测试
