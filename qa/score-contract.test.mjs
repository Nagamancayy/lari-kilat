import test from 'node:test';
import assert from 'node:assert/strict';

import { SCORE_KEY, readBest, recordResult } from './score-contract.mjs';

function fakeStorage(data = new Map()) {
  return {
    data,
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

test('skor akhir sesi disimpan lokal sebagai JSON di key yang disepakati', () => {
  const storage = fakeStorage();
  const result = recordResult(storage, 120);

  assert.deepEqual(result, { best: 120, isRecord: true, saved: true });
  assert.deepEqual(JSON.parse(storage.data.get(SCORE_KEY)), { best: 120 });
});

test('skor lebih rendah tidak menimpa rekor', () => {
  const storage = fakeStorage();
  recordResult(storage, 120);
  const second = recordResult(storage, 40);

  assert.deepEqual(second, { best: 120, isRecord: false, saved: true });
  assert.deepEqual(JSON.parse(storage.data.get(SCORE_KEY)), { best: 120 });
});

test('rekor tetap terbaca setelah game ditutup dan dibuka lagi', () => {
  const browserStorage = new Map();
  recordResult(fakeStorage(browserStorage), 95);

  const afterReopen = fakeStorage(browserStorage);
  assert.equal(readBest(afterReopen), 95);
  assert.deepEqual(recordResult(afterReopen, 20), { best: 95, isRecord: false, saved: true });
});

test('belum pernah main berarti rekor 0, bukan error', () => {
  assert.equal(readBest(fakeStorage()), 0);
});

test('isi storage rusak atau bukan angka dianggap rekor 0', () => {
  const cases = ['{bukan json', '{"best":"banyak"}', '{"best":-5}', 'null', '7'];

  for (const raw of cases) {
    const storage = fakeStorage();
    storage.data.set(SCORE_KEY, raw);
    assert.equal(readBest(storage), raw === '7' ? 7 : 0, `isi "${raw}" salah dibaca`);
  }
});

test('storage penuh tidak membuat game crash, kegagalan simpan dilaporkan', () => {
  const storage = fakeStorage();
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };

  assert.deepEqual(recordResult(storage, 50), { best: 0, isRecord: false, saved: false });
});

test('skor negatif atau pecahan ditolak sebelum ditulis', () => {
  const storage = fakeStorage();
  assert.throws(() => recordResult(storage, -1), RangeError);
  assert.throws(() => recordResult(storage, 1.5), RangeError);
  assert.equal(storage.data.size, 0);
});
