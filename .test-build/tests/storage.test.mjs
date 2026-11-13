import assert from "node:assert/strict";
import test from "node:test";
import { bestScore, createProgress, PROGRESS_KEY, readProgress, recordRun, setSound, writeProgress, } from "../lib/game/storage.js";
const IDS = [1, 2, 3];
function fakeStorage(initial = {}) {
    const data = new Map(Object.entries(initial));
    return {
        data,
        getItem: (key) => (data.has(key) ? data.get(key) : null),
        setItem: (key, value) => data.set(key, String(value)),
    };
}
function run(overrides = {}) {
    return {
        levelId: 1,
        score: 1200,
        coinValue: 300,
        coins: 3,
        totalCoins: 5,
        lives: 2,
        time: 33.4,
        won: true,
        ...overrides,
    };
}
test("key skor berversi dan progres awal membuka level 1", () => {
    assert.equal(PROGRESS_KEY, "lari-kilat.progress.v1");
    const progress = readProgress(fakeStorage(), IDS);
    assert.equal(progress.version, 1);
    assert.equal(progress.unlocked, 1);
    assert.equal(progress.sound, true);
    assert.deepEqual(Object.keys(progress.levels), ["1", "2", "3"]);
});
test("tanpa storage hasilnya nilai awal, bukan crash", () => {
    const progress = readProgress(null, IDS);
    assert.equal(progress.unlocked, 1);
    assert.equal(progress.levels["1"].bestScore, 0);
});
test("JSON rusak dibaca sebagai progres awal", () => {
    const progress = readProgress(fakeStorage({ [PROGRESS_KEY]: "{rusak" }), IDS);
    assert.equal(progress.unlocked, 1);
    assert.equal(progress.levels["1"].bestScore, 0);
});
test("versi lain dan skor negatif disanitasi", () => {
    const old = readProgress(fakeStorage({ [PROGRESS_KEY]: JSON.stringify({ version: 0, unlocked: 3 }) }), IDS);
    assert.equal(old.unlocked, 1);
    const dirty = readProgress(fakeStorage({
        [PROGRESS_KEY]: JSON.stringify({
            version: 1,
            unlocked: 99,
            runs: -4,
            levels: { "1": { bestScore: -50, bestTime: -2, completed: "ya", plays: 2.7 } },
        }),
    }), IDS);
    assert.equal(dirty.unlocked, 3);
    assert.equal(dirty.runs, 0);
    assert.equal(dirty.levels["1"].bestScore, 0);
    assert.equal(dirty.levels["1"].bestTime, null);
    assert.equal(dirty.levels["1"].completed, false);
    assert.equal(dirty.levels["1"].plays, 2);
});
test("menyelesaikan level membuka level berikutnya dan menyimpan rekor", () => {
    const first = recordRun(createProgress(IDS), run(), IDS);
    assert.equal(first.unlocked, 2);
    assert.equal(first.runs, 1);
    assert.equal(first.levels["1"].bestScore, 1200);
    assert.equal(first.levels["1"].bestTime, 33.4);
    assert.equal(first.levels["1"].completed, true);
    assert.equal(first.levels["1"].plays, 1);
    const second = recordRun(first, run({ score: 800, time: 20, coins: 2, coinValue: 200 }), IDS);
    assert.equal(second.levels["1"].bestScore, 1200);
    assert.equal(second.levels["1"].bestTime, 20);
    assert.equal(second.levels["1"].plays, 2);
});
test("kalah tidak membuka level berikutnya", () => {
    const progress = recordRun(createProgress(IDS), run({ won: false, score: 300, lives: 0 }), IDS);
    assert.equal(progress.unlocked, 1);
    assert.equal(progress.levels["1"].completed, false);
    assert.equal(progress.levels["1"].bestScore, 300);
    assert.equal(progress.levels["1"].bestTime, null);
});
test("progres bisa ditulis dan dibaca kembali dari storage yang sama", () => {
    const storage = fakeStorage();
    const progress = recordRun(createProgress(IDS), run(), IDS);
    assert.equal(writeProgress(storage, progress), true);
    const reopened = readProgress(storage, IDS);
    assert.equal(reopened.unlocked, 2);
    assert.equal(reopened.levels["1"].bestScore, 1200);
    assert.equal(reopened.levels["1"].bestTime, 33.4);
    assert.equal(bestScore(reopened), 1200);
});
test("storage yang menolak menulis dilaporkan gagal, bukan melempar", () => {
    const failing = {
        getItem: () => null,
        setItem: () => {
            throw new Error("diblokir");
        },
    };
    assert.equal(writeProgress(failing, createProgress(IDS)), false);
});
test("setSound tidak mengubah progres lain", () => {
    const progress = recordRun(createProgress(IDS), run(), IDS);
    const muted = setSound(progress, false);
    assert.equal(muted.sound, false);
    assert.equal(muted.unlocked, progress.unlocked);
    assert.equal(muted.levels["1"].bestScore, 1200);
    assert.equal(progress.sound, true);
});
