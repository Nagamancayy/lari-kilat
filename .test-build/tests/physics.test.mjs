import assert from "node:assert/strict";
import test from "node:test";
import { createGameState, PLAYER_HEIGHT, stepGame, hudSnapshot, } from "../lib/game/physics.js";
const IDLE = { left: false, right: false, jumpHeld: false, jumpPressed: false };
const DT = 1 / 60;
function makeLevel(overrides = {}) {
    return {
        id: 1,
        name: "Uji",
        hint: "",
        theme: "meadow",
        width: 1200,
        height: 720,
        background: "assets/sky-meadow.svg",
        tileset: "assets/tiles.svg",
        spawn: { x: 100, y: 600 },
        goal: { x: 1000, y: 500, width: 56, height: 110 },
        platforms: [{ x: 0, y: 600, width: 1200, height: 120 }],
        coins: [],
        spikes: [],
        springs: [],
        ...overrides,
    };
}
function settle(state, frames = 8) {
    for (let index = 0; index < frames; index += 1)
        stepGame(state, IDLE, DT);
}
test("pemain jatuh lalu mendarat di atas platform", () => {
    const state = createGameState(makeLevel());
    assert.equal(state.player.onGround, false);
    settle(state);
    assert.equal(state.player.onGround, true);
    assert.equal(state.player.y, 600 - PLAYER_HEIGHT);
    assert.equal(state.lives, 3);
});
test("lompat hanya saat menapak dan menghasilkan event jump", () => {
    const state = createGameState(makeLevel());
    settle(state);
    stepGame(state, { left: false, right: false, jumpHeld: true, jumpPressed: true }, DT);
    assert.ok(state.player.vy < 0, "kecepatan vertikal harus negatif");
    assert.ok(state.events.some((event) => event.type === "jump"));
});
test("lompat dipotong saat tombol dilepas (variable jump)", () => {
    const high = createGameState(makeLevel());
    const low = createGameState(makeLevel());
    settle(high);
    settle(low);
    stepGame(high, { left: false, right: false, jumpHeld: true, jumpPressed: true }, DT);
    stepGame(low, { left: false, right: false, jumpHeld: true, jumpPressed: true }, DT);
    for (let index = 0; index < 10; index += 1) {
        stepGame(high, { left: false, right: false, jumpHeld: true, jumpPressed: false }, DT);
        stepGame(low, { left: false, right: false, jumpHeld: false, jumpPressed: false }, DT);
    }
    assert.ok(high.player.y < low.player.y, "lompat yang ditahan harus lebih tinggi");
});
test("koin terambil sekali dan menambah skor", () => {
    const level = makeLevel({ coins: [{ x: 118, y: 576, value: 100 }] });
    const state = createGameState(level);
    stepGame(state, IDLE, DT);
    assert.equal(state.coinCount, 1);
    assert.equal(state.coinScore, 100);
    assert.ok(state.events.some((event) => event.type === "coin"));
    stepGame(state, IDLE, DT);
    assert.equal(state.coinCount, 1);
});
test("duri mengurangi nyawa dan memulai respawn", () => {
    const level = makeLevel({ spikes: [{ x: 60, y: 576, width: 80, height: 24 }] });
    const state = createGameState(level);
    stepGame(state, IDLE, DT);
    assert.equal(state.lives, 2);
    assert.equal(state.status, "dying");
    for (let index = 0; index < 14; index += 1)
        stepGame(state, IDLE, 0.05);
    assert.equal(state.status, "playing");
    assert.ok(state.player.invuln > 0);
});
test("jatuh ke pit mengurangi nyawa, nyawa habis jadi lost", () => {
    const level = makeLevel({
        platforms: [{ x: 0, y: 600, width: 100, height: 120 }],
        spawn: { x: 500, y: 600 },
    });
    const state = createGameState(level);
    for (let index = 0; index < 120 && state.status === "playing"; index += 1) {
        stepGame(state, IDLE, DT);
    }
    assert.equal(state.lives, 2);
    assert.equal(state.status, "dying");
    state.lives = 1;
    state.status = "playing";
    state.player.x = 500;
    state.player.y = level.height + 200;
    state.player.invuln = 0;
    stepGame(state, IDLE, DT);
    assert.equal(state.status, "lost");
    assert.equal(state.lives, 0);
});
test("checkpoint mengubah titik respawn", () => {
    const level = makeLevel({ checkpoint: { x: 400, y: 600 } });
    const state = createGameState(level);
    state.player.x = 400;
    stepGame(state, IDLE, DT);
    assert.equal(state.checkpointOn, true);
    assert.ok(state.events.some((event) => event.type === "checkpoint"));
    state.lives = 2;
    state.status = "dying";
    state.respawnTimer = 0;
    stepGame(state, IDLE, DT);
    assert.equal(state.status, "playing");
    assert.equal(state.player.x + state.player.width / 2, 400);
});
test("pegas melempar pemain ke atas", () => {
    const level = makeLevel({ springs: [{ x: 60, y: 584, width: 64, height: 16, power: 1200 }] });
    const state = createGameState(level);
    stepGame(state, IDLE, DT);
    assert.ok(state.player.vy < -1000, `vy ${state.player.vy}`);
    assert.ok(state.events.some((event) => event.type === "spring"));
});
test("menyentuh goal menyelesaikan level", () => {
    const level = makeLevel();
    const state = createGameState(level);
    state.player.x = level.goal.x + 10;
    state.player.y = level.goal.y + 20;
    stepGame(state, IDLE, DT);
    assert.equal(state.status, "won");
    assert.ok(state.events.some((event) => event.type === "won"));
});
test("pemain tidak bisa keluar batas kiri dan kanan", () => {
    const state = createGameState(makeLevel({ goal: { x: 99999, y: -1000, width: 10, height: 10 } }));
    settle(state);
    for (let index = 0; index < 120; index += 1) {
        stepGame(state, { left: true, right: false, jumpHeld: false, jumpPressed: false }, DT);
    }
    assert.ok(state.player.x >= 0);
    for (let index = 0; index < 400; index += 1) {
        stepGame(state, { left: false, right: true, jumpHeld: false, jumpPressed: false }, DT);
    }
    assert.ok(state.player.x + state.player.width <= state.level.width);
    assert.equal(state.player.x + state.player.width, state.level.width);
});
test("hud melaporkan nyawa, koin, dan progres", () => {
    const state = createGameState(makeLevel({ coins: [{ x: 118, y: 576, value: 100 }] }));
    stepGame(state, IDLE, DT);
    const hud = hudSnapshot(state);
    assert.equal(hud.lives, 3);
    assert.equal(hud.coins, 1);
    assert.equal(hud.totalCoins, 1);
    assert.ok(hud.progress > 0 && hud.progress < 1);
});
