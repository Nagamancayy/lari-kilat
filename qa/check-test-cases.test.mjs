import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'test-cases.md'), 'utf8');

function section(heading) {
  const start = source.indexOf(heading);
  assert.notEqual(start, -1, `bagian "${heading}" hilang dari test-cases.md`);
  const rest = source.slice(start + heading.length);
  const end = rest.search(/\n## /);
  return end === -1 ? rest : rest.slice(0, end);
}

function rows(heading) {
  return section(heading)
    .split('\n')
    .filter((line) => line.trim().startsWith('|') && !/^\|\s*-/.test(line.trim()))
    .slice(1)
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
}

const cases = rows('## Tabel test case');
const criteria = rows('## Daftar kriteria');

test('setiap baris test case punya 7 kolom dan tidak ada sel kosong', () => {
  assert.ok(cases.length > 0, 'tabel test case kosong');
  for (const row of cases) {
    assert.equal(row.length, 7, `kolom tidak lengkap: ${row.join(' | ')}`);
    for (const [index, cell] of row.entries()) {
      assert.ok(cell.length > 0, `sel kosong di kolom ${index + 1} pada ${row[0]}`);
    }
  }
});

test('ID test case unik', () => {
  const ids = cases.map((row) => row[0]);
  assert.equal(new Set(ids).size, ids.length, 'ada ID yang dipakai dua kali');
});

test('langkah memakai penomoran yang bisa diulang orang lain', () => {
  for (const row of cases) {
    const steps = row[3];
    assert.match(steps, /1\)/, `${row[0]} tidak punya langkah bernomor "1)"`);
    assert.ok(steps.split(/\d\)/).length >= 3, `${row[0]} hanya punya satu langkah`);
  }
});

test('setiap kriteria punya minimal satu test case', () => {
  assert.ok(criteria.length > 0, 'daftar kriteria kosong');
  for (const [id] of criteria) {
    const covered = cases.filter((row) => row[5].split(',').map((v) => v.trim()).includes(id));
    assert.ok(covered.length >= 1, `kriteria ${id} belum punya test case`);
  }
});

test('setiap test case menunjuk kriteria yang benar-benar terdaftar', () => {
  const known = new Set(criteria.map((row) => row[0]));
  for (const row of cases) {
    for (const ac of row[5].split(',').map((v) => v.trim())) {
      assert.ok(known.has(ac), `${row[0]} menunjuk ${ac} yang tidak ada di daftar kriteria`);
    }
  }
});

test('keempat layar v1 tercakup', () => {
  for (const screen of ['menu', 'pilih level', 'main', 'game over']) {
    const found = cases.filter((row) => row[1].toLowerCase() === screen);
    assert.ok(found.length >= 3, `layar "${screen}" hanya punya ${found.length} test case`);
  }
});

test('status hanya boleh salah satu dari dua label bukti', () => {
  const allowed = new Set(['belum diverifikasi', 'lulus', 'gagal']);
  for (const row of cases) {
    assert.ok(allowed.has(row[6]), `status tidak dikenal pada ${row[0]}: "${row[6]}"`);
  }
});

test('selama belum ada bukti browser, tidak boleh ada baris berstatus lulus', () => {
  if (source.includes('hanya berisi `.git`')) {
    const passed = cases.filter((row) => row[6] === 'lulus').map((row) => row[0]);
    assert.deepEqual(passed, [], `klaim lulus tanpa bukti: ${passed.join(', ')}`);
  }
});

test('asumsi dan angka yang belum diputuskan ditandai inline', () => {
  const undecided = cases.filter((row) => /belum ada dari Bos/.test(row[2] + row[4]));
  for (const row of undecided) {
    assert.match(row[2] + row[4], /asumsi/, `${row[0]} menyebut angka Bos tanpa label (asumsi)`);
  }
  assert.match(source, /belum diverifikasi/, 'tidak ada label (belum diverifikasi) di dokumen');
});
