import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  findLevel,
  indexProblems,
  listAssets,
  loadLevels,
  missingAssets,
  scoreFromCoins,
  validateLevel,
} from './level-contract.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureLevels = join(here, 'fixtures', 'levels');
const fixtureAssets = join(here, 'fixtures', 'assets');

const { levels, problems } = loadLevels(fixtureLevels);
const present = listAssets(fixtureAssets);

test('level contoh lolos validasi tanpa masalah', () => {
  assert.deepEqual(problems, []);
  assert.equal(levels.length, 2);
});

test('nomor level di menu berurutan mulai 1 tanpa duplikat', () => {
  assert.deepEqual(indexProblems(levels), []);
});

test('pilih level memuat level yang nomornya dipilih', () => {
  assert.equal(findLevel(levels, 1).name, 'Lereng Batu');
  assert.equal(findLevel(levels, 2).name, 'Gua Bara');
  assert.equal(findLevel(levels, 3), null);
});

test('semua aset yang dirujuk level ada di folder aset', () => {
  for (const level of levels) {
    assert.deepEqual(missingAssets(level, present), [], `level ${level.id} merujuk aset hilang`);
  }
});

test('aset yang tidak ada dilaporkan dengan path-nya', () => {
  assert.deepEqual(missingAssets(levels[0], new Set()), ['assets/sky.svg', 'assets/tile.svg']);
  assert.deepEqual(missingAssets(levels[0], new Set(['assets/sky.svg'])), ['assets/tile.svg']);
});

test('level tanpa goal ditolak', () => {
  const { goal, ...withoutGoal } = levels[0];
  assert.deepEqual(validateLevel(withoutGoal), ['goal butuh x dan y bilangan bulat']);
});

test('level dengan spawn di luar batas ditolak', () => {
  const outside = { ...levels[0], spawn: { x: 4000, y: 600 } };
  assert.deepEqual(validateLevel(outside), ['spawn harus di dalam batas level']);
});

test('level dengan spawn sama dengan goal ditolak', () => {
  const same = { ...levels[0], goal: { ...levels[0].spawn } };
  assert.deepEqual(validateLevel(same), ['spawn dan goal tidak boleh di titik yang sama']);
});

test('level tanpa platform dan coin bernilai nol ditolak', () => {
  const broken = { ...levels[0], platforms: [], coins: [{ x: 10, y: 10, value: 0 }] };
  assert.deepEqual(validateLevel(broken), [
    'platforms minimal berisi satu platform',
    'coin 0 butuh x, y dan value bilangan bulat >= 1',
  ]);
});

test('skor bertambah tepat sebesar nilai coin yang diambil', () => {
  const level = levels[0];
  assert.equal(scoreFromCoins(level, 0), 0);
  assert.equal(scoreFromCoins(level, 1), level.coins[0].value);
  assert.ok(scoreFromCoins(level, 2) > scoreFromCoins(level, 1));
  assert.equal(scoreFromCoins(level, 2), level.coins[0].value + level.coins[1].value);
});

test('level tanpa coin ditolak karena skor tidak bisa bertambah saat main', () => {
  const noCoins = { ...levels[0], coins: [] };
  assert.deepEqual(validateLevel(noCoins), [
    'coins minimal satu, kalau kosong skor tidak bisa bertambah saat main (MAIN-09)',
  ]);
});

test('background di luar folder assets/ ditolak', () => {
  const external = { ...levels[0], background: 'https://cdn.example.com/sky.png' };
  assert.deepEqual(validateLevel(external), ['background harus path relatif yang mulai dengan "assets/"']);
});

test('JSON rusak dilaporkan per file dan level lain tetap terbaca', () => {
  const dir = mkdtempSync(join(tmpdir(), 'level-broken-'));
  const good = readFileSync(join(fixtureLevels, 'level-01.json'), 'utf8');

  try {
    writeFileSync(join(dir, 'level-01.json'), good);
    writeFileSync(join(dir, 'level-02.json'), '{"id": 2,');

    const result = loadLevels(dir);
    assert.equal(result.levels.length, 1);
    assert.equal(result.problems.length, 1);
    assert.match(result.problems[0], /^level-02\.json: JSON tidak bisa dibaca/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
