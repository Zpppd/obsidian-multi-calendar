import esbuild from "esbuild";
import process from "process";
import fs from "fs";

const prod = process.argv[2] === "production";

const ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/main.js",
    external: ["obsidian"],
    format: "cjs",
    target: "es2018",
    logLevel: "info",
    sourcemap: prod ? false : "inline",
    minify: prod,
    treeShaking: true,
    // 增加对 JSX 的支持
    jsxFactory: "h",
    jsxFragment: "Fragment",
    inject: ["src/shims-vue.ts"],
});

if (prod) {
    await ctx.rebuild();
    await ctx.dispose();
    fs.copyFileSync("manifest.json", "dist/manifest.json");
    fs.copyFileSync("styles.css", "dist/styles.css");
    console.log("✅ Production build complete.");
} else {
    // 先执行一次构建，确保 dist/ 存在
     await ctx.rebuild();
    console.log("📦 Build done, copying static files...");
    fs.copyFileSync("manifest.json", "dist/manifest.json");
    fs.copyFileSync("styles.css", "dist/styles.css");
    console.log("📋 Copied:", fs.readdirSync("dist"));
    await ctx.watch();
    console.log("👀 Watching for changes...");
}

