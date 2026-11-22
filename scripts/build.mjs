import { build, context } from "esbuild";
import { readFile, writeFile, mkdir, copyFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
async function renderPage() {
  let html = await readFile(path.join(root, "index.html"), "utf8");
  // 루트 index.html을 바로 연 사람을 dist로 보내는 줄은 배포본에서 뺍니다.
  html = html.replace(/^.*data-source-only.*\r?\n/m, "");
  for (const match of html.matchAll(/<!-- component:([a-z-]+) -->/g)) {
    html = html.replace(
      match[0],
      await readFile(path.join(root, "src/components", `${match[1]}.html`), "utf8"),
    );
  }
  return html;
}

const outdir = path.join(root, "dist");
const serve = process.argv.includes("--serve");
await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
const options = {
  absWorkingDir: root,
  entryPoints: { game: "src/main.js" },
  bundle: true,
  outdir,
  format: "iife",
  platform: "browser",
  target: "es2020",
  charset: "utf8",
  loader: { ".wav": "base64", ".mp3": "base64", ".ttf": "file" },
  assetNames: "assets/[name]-[hash]",
  plugins: [
    {
      name: "html-components",
      setup(builder) {
        builder.onEnd(async (result) => {
          if (!result.errors.length) {
            await writeFile(path.join(outdir, "index.html"), await renderPage());
            await copyFile(path.join(root, "assets/scenes/first-day.webp"), path.join(outdir, "assets/first-day.webp"));
            await copyFile(
              path.join(root, "assets/FONT-LICENSE.txt"),
              path.join(outdir, "FONT-LICENSE.txt"),
            );
          }
        });
      },
    },
  ],
};
if (serve) {
  const ctx = await context(options);
  const { hosts, port } = await ctx.serve({ host: "127.0.0.1", port: 8765, servedir: outdir });
  console.log(`조달의 달인: http://${hosts[0]}:${port} (종료: Ctrl+C)`);
  // Serve rebuilds on requests, including HTML fragments read in onEnd.
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, async () => {
      await ctx.dispose();
      process.exit(0);
    });
} else {
  await build(options);
  console.log("실행 파일: dist/index.html — dist 폴더 전체를 함께 배포하세요.");
}
