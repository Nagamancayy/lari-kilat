import { execFileSync } from "node:child_process";
import { readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const build = path.join(root, ".test-build");
const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");

rmSync(build, { recursive: true, force: true });
execFileSync(process.execPath, [tsc, "-p", path.join(root, "tsconfig.test.json")], {
  cwd: root,
  stdio: "inherit",
});

const testDir = path.join(build, "tests");
const files = readdirSync(testDir)
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => path.join(testDir, name));

if (files.length === 0) {
  console.error("Tidak ada file tes di tests/");
  process.exit(1);
}

execFileSync(process.execPath, ["--test", ...files], { cwd: root, stdio: "inherit" });
