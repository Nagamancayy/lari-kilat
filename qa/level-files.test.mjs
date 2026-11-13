import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { indexProblems, listAssets, loadLevels, missingAssets } from './level-contract.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const levelsDir = join(root, 'levels');
const assetsDir = join(root, 'assets');
const skip = existsSync(levelsDir) ? false : 'levels/ belum ada — menunggu Arif/Ravi';

test('menu bisa dibuka: levels/ berisi level yang sah dan bernomor urut', { skip }, () => {
  const { levels, problems } = loadLevels(levelsDir);
  assert.deepEqual(problems, []);
  assert.deepEqual(indexProblems(levels), []);
});

test('pilih level memuat level yang nomornya dipilih, bukan level lain', { skip }, () => {
  const files = readdirSync(levelsDir).filter((name) => name.endsWith('.json')).sort();
  assert.ok(files.length > 0, 'tidak ada file level');

  for (const file of files) {
    const level = JSON.parse(readFileSync(join(levelsDir, file), 'utf8'));
    const digits = file.replace(/\.json$/, '').match(/(\d+)$/)?.[1];
    assert.ok(digits, `${file} tidak punya nomor level di namanya`);
    assert.equal(Number(digits), level.id, `${file} berisi level dengan id ${level.id}`);
  }
});

test('folder assets/ milik build tidak kosong', { skip }, () => {
  assert.ok(listAssets(assetsDir).size > 0, 'assets/ kosong atau tidak ada');
});

if (existsSync(levelsDir)) {
  const { levels } = loadLevels(levelsDir);
  const present = listAssets(assetsDir);

  for (const level of levels) {
    test(`aset level ${level.id} (${level.name}) ada di assets/`, () => {
      assert.deepEqual(missingAssets(level, present), []);
    });
  }
}
