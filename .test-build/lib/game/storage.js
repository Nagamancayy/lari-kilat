export const PROGRESS_KEY = "lari-kilat.progress.v1";
function emptyLevel() {
    return { bestScore: 0, bestTime: null, completed: false, plays: 0 };
}
export function createProgress(levelIds) {
    const levels = {};
    for (const id of levelIds)
        levels[String(id)] = emptyLevel();
    return { version: 1, unlocked: 1, levels, sound: true, runs: 0 };
}
function safeInt(value, fallback = 0) {
    return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}
function sanitizeLevel(value) {
    if (typeof value !== "object" || value === null)
        return emptyLevel();
    const raw = value;
    const bestScore = safeInt(raw.bestScore);
    const bestTime = typeof raw.bestTime === "number" && Number.isFinite(raw.bestTime) && raw.bestTime > 0
        ? Math.round(raw.bestTime * 10) / 10
        : null;
    return {
        bestScore,
        bestTime,
        completed: raw.completed === true,
        plays: safeInt(raw.plays),
    };
}
export function readProgress(storage, levelIds) {
    const fallback = createProgress(levelIds);
    if (!storage)
        return fallback;
    let raw;
    try {
        raw = storage.getItem(PROGRESS_KEY);
    }
    catch {
        return fallback;
    }
    if (raw === null || raw === "")
        return fallback;
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch {
        return fallback;
    }
    if (typeof parsed !== "object" || parsed === null)
        return fallback;
    const data = parsed;
    if (data.version !== 1)
        return fallback;
    const levels = {};
    const storedLevels = typeof data.levels === "object" && data.levels !== null ? data.levels : {};
    for (const id of levelIds)
        levels[String(id)] = sanitizeLevel(storedLevels[String(id)]);
    const maxUnlocked = Math.max(1, levelIds.length);
    const unlockedValue = safeInt(data.unlocked, 1);
    const unlocked = Math.max(1, Math.min(maxUnlocked, unlockedValue === 0 ? 1 : unlockedValue));
    return {
        version: 1,
        unlocked,
        levels,
        sound: data.sound !== false,
        runs: safeInt(data.runs),
    };
}
export function writeProgress(storage, progress) {
    if (!storage)
        return false;
    try {
        storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        return true;
    }
    catch {
        return false;
    }
}
export function recordRun(progress, run, levelIds) {
    const key = String(run.levelId);
    const previous = progress.levels[key] ?? emptyLevel();
    const score = safeInt(run.score);
    const won = run.won === true;
    const time = Number.isFinite(run.time) && run.time > 0 ? run.time : null;
    const updated = {
        bestScore: Math.max(previous.bestScore, score),
        bestTime: won && time !== null ? (previous.bestTime === null ? time : Math.min(previous.bestTime, time)) : previous.bestTime,
        completed: previous.completed || won,
        plays: previous.plays + 1,
    };
    const levels = { ...progress.levels, [key]: updated };
    const index = levelIds.indexOf(run.levelId);
    const unlocked = won && index >= 0 ? Math.max(progress.unlocked, Math.min(levelIds.length, index + 2)) : progress.unlocked;
    return {
        version: 1,
        unlocked: Math.max(1, unlocked),
        levels,
        sound: progress.sound,
        runs: progress.runs + 1,
    };
}
export function setSound(progress, sound) {
    return { ...progress, sound };
}
export function bestScore(progress) {
    return Object.values(progress.levels).reduce((best, level) => Math.max(best, level.bestScore), 0);
}
