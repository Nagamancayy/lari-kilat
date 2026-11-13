import assert from "node:assert/strict";
import test from "node:test";

import { computeScore, formatTime, SCORE_RULES } from "../lib/game/score.js";

test("skor level selesai menjumlahkan koin, nyawa, waktu, dan bonus finis", () => {
  const breakdown = computeScore({ coinValue: 500, lives: 2, time: 12.7, won: true });
  assert.equal(breakdown.coins, 500);
  assert.equal(breakdown.lifeBonus, 300);
  assert.equal(breakdown.timeBonus, 480);
  assert.equal(breakdown.finishBonus, SCORE_RULES.finishBonus);
  assert.equal(breakdown.total, 1780);
});

test("kalah tidak memberi bonus waktu dan bonus finis", () => {
  const breakdown = computeScore({ coinValue: 200, lives: 0, time: 40, won: false });
  assert.equal(breakdown.timeBonus, 0);
  assert.equal(breakdown.finishBonus, 0);
  assert.equal(breakdown.total, 200);
});

test("bonus waktu tidak pernah negatif", () => {
  const breakdown = computeScore({ coinValue: 0, lives: 0, time: 500, won: true });
  assert.equal(breakdown.timeBonus, 0);
});

test("nyawa di luar 0..3 dijepit", () => {
  assert.equal(computeScore({ coinValue: 0, lives: 9, time: 0, won: true }).lifeBonus, 450);
  assert.equal(computeScore({ coinValue: 0, lives: -2, time: 0, won: true }).lifeBonus, 0);
});

test("format waktu memakai desimal satu digit", () => {
  assert.equal(formatTime(0), "0:00.0");
  assert.equal(formatTime(65.4), "1:05.4");
  assert.equal(formatTime(Number.NaN), "0:00.0");
  assert.equal(formatTime(-3), "0:00.0");
});
