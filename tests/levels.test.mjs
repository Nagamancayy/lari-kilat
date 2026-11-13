import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { LevelValidationError, parseLevel, parseLevels } from "../lib/game/levels.js";

const root = process.cwd();
const levelsDir = path.join(root, "levels");
const assetsDir = path.join(root, "assets");

function readLevels() {
  return readdirSync(levelsDir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => ({ name, raw: JSON.parse(readFileSync(path.join(levelsDir, name), "utf8")) }));
}

test("semua file level di levels/ valid dan id-nya berurutan", () => {
  const files = readLevels();
  assert.ok(files.length >= 3, "minimal 3 level v1");
  const levels = parseLevels(files.map((file) => file.raw));
  assert.deepEqual(
    levels.map((level) => level.id),
    [1, 2, 3],
  );
});

test("nama file level cocok dengan id di dalamnya", () => {
  for (const { name, raw } of readLevels()) {
    const digits = name.match(/(\d+)\.json$/)?.[1];
    assert.ok(digits, `${name} harus punya nomor`);
    assert.equal(Number(digits), raw.id, `${name} berisi id ${raw.id}`);
  }
});

test("setiap level punya koin, spawn, goal, dan latar yang ada di assets/", () => {
  for (const { raw } of readLevels()) {
    const level = parseLevel(raw);
    assert.ok(level.coins.length > 0, `level ${level.id} harus punya koin`);
    assert.ok(level.platforms.length > 0);
    assert.ok(level.spawn.x >= 0 && level.spawn.x <= level.width);
    assert.ok(level.goal.x + level.goal.width <= level.width);
    const background = path.join(root, level.background);
    assert.ok(readFileSync(background).length > 0, `${level.background} harus ada`);
    if (level.tileset) {
      assert.ok(readFileSync(path.join(root, level.tileset)).length > 0);
    }
  }
});

test("folder assets/ tidak kosong dan semua svg terbaca", () => {
  const files = readdirSync(assetsDir).filter((name) => name.endsWith(".svg"));
  assert.ok(files.length >= 5);
  for (const file of files) {
    const text = readFileSync(path.join(assetsDir, file), "utf8");
    assert.match(text, /^<svg[\s>]/, `${file} bukan SVG`);
  }
});

test("level tanpa spawn ditolak dengan pesan jelas", () => {
  const { raw } = readLevels()[0];
  const broken = { ...raw };
  delete broken.spawn;
  assert.throws(() => parseLevel(broken), (error) => {
    assert.ok(error instanceof LevelValidationError);
    assert.match(error.message, /spawn/);
    return true;
  });
});

test("lebar level di bawah 320 ditolak", () => {
  const { raw } = readLevels()[0];
  assert.throws(() => parseLevel({ ...raw, width: 200 }), /width minimal 320/);
});

test("tema asing ditolak", () => {
  const { raw } = readLevels()[0];
  assert.throws(() => parseLevel({ ...raw, theme: "neon" }), /theme/);
});

test("koin tanpa nilai ditolak", () => {
  const { raw } = readLevels()[0];
  assert.throws(() => parseLevel({ ...raw, coins: [{ x: 10, y: 10 }] }), /value/);
});

test("goal di luar batas level ditolak", () => {
  const { raw } = readLevels()[0];
  assert.throws(() => parseLevel({ ...raw, goal: { ...raw.goal, x: raw.width - 5 } }), /goal/);
});

test("id level duplikat ditolak", () => {
  const { raw } = readLevels()[0];
  assert.throws(() => parseLevels([raw, { ...raw }]), /berurutan/);
});

test("background di luar assets/ ditolak", () => {
  const { raw } = readLevels()[0];
  assert.throws(() => parseLevel({ ...raw, background: "https://example.com/sky.svg" }), /assets/);
});
