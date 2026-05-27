// Cloudflare D1 원격 데이터베이스를 배포 전 로컬 SQL 파일로 내보낸다.
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const backupDir = join(appRoot, "backups", "d1");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputFile = `prunet_math_learning_db-${stamp}.sql`;
const output = join("backups", "d1", outputFile);

mkdirSync(backupDir, { recursive: true });

const wranglerArgs = ["wrangler", "d1", "export", "prunet_math_learning_db", "--remote", "--output", output, "-y"];
const result = spawnSync(process.platform === "win32" ? "cmd.exe" : "npx", process.platform === "win32" ? ["/d", "/s", "/c", "npx", ...wranglerArgs] : wranglerArgs, {
  cwd: appRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  if (result.error) console.error(result.error.message);
  console.error(`D1 백업 실패: status=${result.status} signal=${result.signal ?? "none"}`);
  process.exit(result.status ?? 1);
}

console.log(`D1 백업 파일 생성: ${output}`);
