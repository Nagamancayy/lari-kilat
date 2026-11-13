import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "assets");
const target = path.join(root, "public", "assets");

if (!existsSync(source)) {
  console.error("assets/ tidak ditemukan");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });

const count = readdirSync(target).filter((file) => !file.startsWith(".")).length;
console.log(`assets/ -> public/assets/ (${count} file)`);
