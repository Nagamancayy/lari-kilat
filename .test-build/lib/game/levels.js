export class LevelValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "LevelValidationError";
    }
}
const THEMES = ["meadow", "dusk", "summit"];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function numberField(value, path) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new LevelValidationError(`${path} harus angka`);
    }
    return value;
}
function integer(value, path) {
    const parsed = numberField(value, path);
    if (!Number.isInteger(parsed)) {
        throw new LevelValidationError(`${path} harus bilangan bulat`);
    }
    return parsed;
}
function text(value, path) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new LevelValidationError(`${path} harus teks tidak kosong`);
    }
    return value.trim();
}
function point(value, path) {
    if (!isRecord(value))
        throw new LevelValidationError(`${path} harus objek {x,y}`);
    return { x: integer(value.x, `${path}.x`), y: integer(value.y, `${path}.y`) };
}
function rect(value, path) {
    const base = point(value, path);
    const width = integer(isRecord(value) ? value.width : undefined, `${path}.width`);
    const height = integer(isRecord(value) ? value.height : undefined, `${path}.height`);
    if (width < 1 || height < 1)
        throw new LevelValidationError(`${path} butuh width/height positif`);
    return { ...base, width, height };
}
function arrayOf(value, path, parse) {
    if (!Array.isArray(value))
        throw new LevelValidationError(`${path} harus array`);
    return value.map((item, index) => parse(item, `${path}[${index}]`));
}
function coin(value, path) {
    if (!isRecord(value))
        throw new LevelValidationError(`${path} harus objek {x,y,value}`);
    const base = point(value, path);
    const valueScore = integer(value.value, `${path}.value`);
    if (valueScore < 1)
        throw new LevelValidationError(`${path}.value minimal 1`);
    return { ...base, value: valueScore };
}
function spring(value, path) {
    const base = rect(value, path);
    const power = isRecord(value) && value.power !== undefined ? numberField(value.power, `${path}.power`) : undefined;
    if (power !== undefined && (power < 400 || power > 2000)) {
        throw new LevelValidationError(`${path}.power harus 400..2000`);
    }
    return power === undefined ? base : { ...base, power };
}
export function parseLevel(raw, source = "level") {
    if (!isRecord(raw))
        throw new LevelValidationError(`${source}: level harus objek JSON`);
    const id = integer(raw.id, "id");
    if (id < 1)
        throw new LevelValidationError("id minimal 1");
    const width = integer(raw.width, "width");
    const height = integer(raw.height, "height");
    if (width < 320)
        throw new LevelValidationError("width minimal 320");
    if (height < 240)
        throw new LevelValidationError("height minimal 240");
    const themeValue = text(raw.theme ?? "meadow", "theme");
    if (!THEMES.includes(themeValue)) {
        throw new LevelValidationError(`theme harus salah satu: ${THEMES.join(", ")}`);
    }
    const spawn = point(raw.spawn, "spawn");
    const goal = rect(raw.goal, "goal");
    const background = text(raw.background, "background");
    if (!background.startsWith("assets/")) {
        throw new LevelValidationError("background harus path relatif yang mulai dengan assets/");
    }
    const tileset = raw.tileset === undefined ? undefined : text(raw.tileset, "tileset");
    if (tileset !== undefined && !tileset.startsWith("assets/")) {
        throw new LevelValidationError("tileset harus path relatif yang mulai dengan assets/");
    }
    const platforms = arrayOf(raw.platforms, "platforms", rect);
    if (platforms.length === 0)
        throw new LevelValidationError("platforms minimal satu");
    const coins = arrayOf(raw.coins, "coins", coin);
    const spikes = raw.spikes === undefined ? [] : arrayOf(raw.spikes, "spikes", rect);
    const springs = raw.springs === undefined ? [] : arrayOf(raw.springs, "springs", spring);
    const checkpoint = raw.checkpoint === undefined ? undefined : point(raw.checkpoint, "checkpoint");
    const insideX = (value) => value >= 0 && value <= width;
    const inside = (value) => value >= 0 && value <= height;
    if (!insideX(spawn.x) || !inside(spawn.y)) {
        throw new LevelValidationError("spawn harus di dalam batas level");
    }
    if (!insideX(goal.x) || !insideX(goal.x + goal.width) || !inside(goal.y) || !inside(goal.y + goal.height)) {
        throw new LevelValidationError("goal harus di dalam batas level");
    }
    for (const [index, platform] of platforms.entries()) {
        if (platform.x < 0 || platform.x + platform.width > width) {
            throw new LevelValidationError(`platforms[${index}] keluar batas lebar level`);
        }
    }
    for (const [index, item] of [...spikes, ...springs].entries()) {
        if (item.x < 0 || item.x + item.width > width) {
            throw new LevelValidationError(`rintangan[${index}] keluar batas lebar level`);
        }
    }
    for (const [index, item] of coins.entries()) {
        if (!insideX(item.x) || !inside(item.y)) {
            throw new LevelValidationError(`coins[${index}] harus di dalam batas level`);
        }
    }
    if (checkpoint !== undefined && (!insideX(checkpoint.x) || !inside(checkpoint.y))) {
        throw new LevelValidationError("checkpoint harus di dalam batas level");
    }
    if (spawn.x === goal.x && spawn.y === goal.y) {
        throw new LevelValidationError("spawn dan goal tidak boleh di titik yang sama");
    }
    return {
        id,
        name: text(raw.name, "name"),
        hint: typeof raw.hint === "string" ? raw.hint : "",
        theme: themeValue,
        width,
        height,
        background,
        tileset,
        spawn,
        checkpoint,
        goal,
        platforms,
        coins,
        spikes,
        springs,
    };
}
export function parseLevels(raws) {
    const levels = raws.map((raw, index) => parseLevel(raw, `level[${index}]`));
    const ids = levels.map((level) => level.id).sort((a, b) => a - b);
    const expected = ids.map((_, index) => index + 1);
    if (ids.join(",") !== expected.join(",")) {
        throw new LevelValidationError(`id level harus berurutan 1..${ids.length}, didapat ${ids.join(", ")}`);
    }
    return levels.sort((a, b) => a.id - b.id);
}
