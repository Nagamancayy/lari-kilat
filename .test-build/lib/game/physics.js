export const PLAYER_WIDTH = 36;
export const PLAYER_HEIGHT = 48;
export const GRAVITY = 2400;
export const MOVE_ACCEL = 2600;
export const AIR_ACCEL = 1800;
export const MAX_SPEED = 340;
export const FRICTION = 2800;
export const AIR_FRICTION = 700;
export const JUMP_VELOCITY = 780;
export const JUMP_CUT = 300;
export const MAX_FALL = 1200;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;
export const SPRING_VELOCITY = 1150;
export const RESPAWN_DELAY = 0.55;
export const RESPAWN_INVULN = 1.1;
export const START_LIVES = 3;
function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
function approach(value, target, delta) {
    if (value < target)
        return Math.min(value + delta, target);
    if (value > target)
        return Math.max(value - delta, target);
    return target;
}
function emit(state, type, x, y) {
    state.events.push({ type, x, y });
}
function placePlayer(state, at) {
    const player = state.player;
    player.x = at.x - player.width / 2;
    player.y = at.y - player.height;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.squash = 0;
}
export function createGameState(level) {
    const state = {
        level,
        player: {
            x: 0,
            y: 0,
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            vx: 0,
            vy: 0,
            onGround: false,
            face: 1,
            coyote: 0,
            jumpBuffer: 0,
            anim: 0,
            squash: 0,
            invuln: 0,
        },
        coins: level.coins.map((coin) => ({ ...coin, taken: false })),
        coinCount: 0,
        coinScore: 0,
        lives: START_LIVES,
        time: 0,
        status: "playing",
        checkpointOn: false,
        respawnTimer: 0,
        events: [],
    };
    placePlayer(state, level.spawn);
    return state;
}
export function restartGame(state) {
    const fresh = createGameState(state.level);
    state.player = fresh.player;
    state.coins = fresh.coins;
    state.coinCount = 0;
    state.coinScore = 0;
    state.lives = START_LIVES;
    state.time = 0;
    state.status = "playing";
    state.checkpointOn = false;
    state.respawnTimer = 0;
    state.events = [];
}
function respawn(state) {
    const point = state.checkpointOn && state.level.checkpoint ? state.level.checkpoint : state.level.spawn;
    placePlayer(state, point);
    state.player.invuln = RESPAWN_INVULN;
    state.status = "playing";
    state.respawnTimer = 0;
    emit(state, "respawn", point.x, point.y);
}
function hurt(state, x, y) {
    if (state.status !== "playing" || state.player.invuln > 0)
        return;
    state.lives = Math.max(0, state.lives - 1);
    emit(state, "hurt", x, y);
    if (state.lives <= 0) {
        state.status = "lost";
        state.player.vx = 0;
        return;
    }
    state.status = "dying";
    state.respawnTimer = RESPAWN_DELAY;
    state.player.vx = 0;
    state.player.vy = 0;
}
function collectCoins(state) {
    const player = state.player;
    const cx = player.x + player.width / 2;
    const cy = player.y + player.height / 2;
    for (const coin of state.coins) {
        if (coin.taken)
            continue;
        const dx = cx - coin.x;
        const dy = cy - coin.y;
        if (dx * dx + dy * dy <= 34 * 34) {
            coin.taken = true;
            state.coinCount += 1;
            state.coinScore += coin.value;
            emit(state, "coin", coin.x, coin.y);
        }
    }
}
function checkSpikes(state) {
    const player = state.player;
    for (const spike of state.level.spikes) {
        const forgiving = {
            x: spike.x + 3,
            y: spike.y + 7,
            width: Math.max(1, spike.width - 6),
            height: Math.max(1, spike.height - 7),
        };
        if (overlaps(player, forgiving)) {
            hurt(state, player.x + player.width / 2, player.y + player.height);
            return;
        }
    }
}
function checkSprings(state) {
    const player = state.player;
    for (const spring of state.level.springs) {
        if (!overlaps(player, spring) || player.vy < 0)
            continue;
        player.y = spring.y - player.height;
        player.vy = -(spring.power ?? SPRING_VELOCITY);
        player.onGround = false;
        player.jumpBuffer = 0;
        player.squash = -1;
        emit(state, "spring", spring.x + spring.width / 2, spring.y);
        return;
    }
}
export function stepGame(state, input, rawDelta) {
    state.events.length = 0;
    const delta = Math.min(Math.max(rawDelta, 0), 0.05);
    if (delta === 0)
        return;
    if (state.status === "won" || state.status === "lost")
        return;
    if (state.status === "dying") {
        state.respawnTimer -= delta;
        if (state.respawnTimer <= 0)
            respawn(state);
        return;
    }
    const level = state.level;
    const player = state.player;
    player.invuln = Math.max(0, player.invuln - delta);
    state.time += delta;
    const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (direction !== 0) {
        player.vx = approach(player.vx, direction * MAX_SPEED, (player.onGround ? MOVE_ACCEL : AIR_ACCEL) * delta);
        player.face = direction > 0 ? 1 : -1;
    }
    else {
        player.vx = approach(player.vx, 0, (player.onGround ? FRICTION : AIR_FRICTION) * delta);
    }
    if (player.onGround)
        player.coyote = COYOTE_TIME;
    else
        player.coyote = Math.max(0, player.coyote - delta);
    if (input.jumpPressed)
        player.jumpBuffer = JUMP_BUFFER;
    player.jumpBuffer = Math.max(0, player.jumpBuffer - delta);
    if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
        player.vy = -JUMP_VELOCITY;
        player.onGround = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        player.squash = -1;
        emit(state, "jump", player.x + player.width / 2, player.y + player.height);
    }
    if (!input.jumpHeld && player.vy < -JUMP_CUT) {
        player.vy = -JUMP_CUT;
    }
    player.vy = Math.min(player.vy + GRAVITY * delta, MAX_FALL);
    player.x += player.vx * delta;
    for (const platform of level.platforms) {
        if (!overlaps(player, platform))
            continue;
        if (player.vx > 0)
            player.x = platform.x - player.width;
        else if (player.vx < 0)
            player.x = platform.x + platform.width;
        player.vx = 0;
    }
    player.x = Math.max(0, Math.min(player.x, level.width - player.width));
    const wasAirborne = !player.onGround;
    player.onGround = false;
    player.y += player.vy * delta;
    for (const platform of level.platforms) {
        if (!overlaps(player, platform))
            continue;
        if (player.vy > 0) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.onGround = true;
            if (wasAirborne) {
                player.squash = 1;
                emit(state, "land", player.x + player.width / 2, player.y + player.height);
            }
        }
        else if (player.vy < 0) {
            player.y = platform.y + platform.height;
            player.vy = 0;
        }
    }
    player.anim += delta * (0.4 + Math.abs(player.vx) / MAX_SPEED);
    player.squash = approach(player.squash, 0, delta * 6);
    checkSprings(state);
    collectCoins(state);
    if (!state.checkpointOn && level.checkpoint && player.x + player.width / 2 >= level.checkpoint.x) {
        state.checkpointOn = true;
        emit(state, "checkpoint", level.checkpoint.x, level.checkpoint.y);
    }
    checkSpikes(state);
    if (state.status !== "playing")
        return;
    if (player.y > level.height + 160) {
        hurt(state, player.x + player.width / 2, level.height);
        return;
    }
    if (overlaps(player, level.goal)) {
        state.status = "won";
        player.vx = 0;
        player.vy = 0;
        emit(state, "won", level.goal.x + level.goal.width / 2, level.goal.y + level.goal.height / 2);
    }
}
export function hudSnapshot(state) {
    const span = Math.max(1, state.level.goal.x);
    const progress = Math.max(0, Math.min(1, (state.player.x + state.player.width / 2) / span));
    return {
        lives: state.lives,
        coins: state.coinCount,
        totalCoins: state.coins.length,
        time: state.time,
        status: state.status,
        progress,
    };
}
export function playerCenter(state) {
    return {
        x: state.player.x + state.player.width / 2,
        y: state.player.y + state.player.height / 2,
    };
}
