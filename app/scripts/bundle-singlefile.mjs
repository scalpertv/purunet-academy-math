// 빌드 결과(dist)를 자바스크립트·CSS·아이콘까지 모두 인라인한
// 단일 HTML 한 파일로 합쳐, 더블클릭만으로 열리게 만든다.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, "..", "dist");
const outDir = resolve(here, "..", "..", "CODEX 수학 익힘북 전자북(26.05.17)");
const outFile = resolve(outDir, "CODEX-수학-익힘북-전자북.html");

let html = await readFile(resolve(distDir, "index.html"), "utf8");

const isExternal = (u) => /^(https?:)?\/\//.test(u);

// 번들 JS 모듈을 인라인 <script type="module">로 치환 (외부 URL은 그대로 둠)
const scriptRe = /<script[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g;
for (const m of [...html.matchAll(scriptRe)]) {
  if (isExternal(m[1])) continue;
  const file = m[1].replace(/^\.?\//, "");
  const code = (await readFile(resolve(distDir, file), "utf8")).replace(
    /<\/script>/g,
    "<\\/script>",
  );
  // 함수 치환: 압축 JS의 $`, $&, $' 등이 치환 패턴으로 해석되지 않게 함
  html = html.replace(m[0], () => `<script type="module">\n${code}\n</script>`);
}

// 번들 CSS를 인라인 <style>로 치환 (CDN 폰트 등 외부 URL은 그대로 둠)
const cssRe = /<link[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/g;
for (const m of [...html.matchAll(cssRe)]) {
  if (isExternal(m[1])) continue;
  const file = m[1].replace(/^\.?\//, "");
  const css = await readFile(resolve(distDir, file), "utf8");
  html = html.replace(m[0], () => `<style>\n${css}\n</style>`);
}

// 파비콘을 data URI로 인라인 (완전 독립 파일)
const favRe = /<link[^>]*\brel="icon"[^>]*\bhref="([^"]+)"[^>]*>/;
const fav = html.match(favRe);
if (fav) {
  const file = fav[1].replace(/^\.?\//, "");
  try {
    const svg = await readFile(resolve(distDir, file));
    const data = `data:image/svg+xml;base64,${svg.toString("base64")}`;
    html = html.replace(fav[0], () => `<link rel="icon" href="${data}" />`);
  } catch {
    /* 파비콘 없으면 무시 */
  }
}

await mkdir(outDir, { recursive: true });
await writeFile(outFile, html, "utf8");
console.log(`단일 파일 생성: ${outFile}`);
console.log(`크기: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
