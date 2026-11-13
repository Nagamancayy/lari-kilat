import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const LEVEL_DIR = 'levels';
export const ASSET_DIR = 'assets';

const isInt = (value) => Number.isInteger(value);
const isPoint = (point) => Boolean(point) && isInt(point.x) && isInt(point.y);

export function validateLevel(level) {
  if (!level || typeof level !== 'object') return ['level bukan objek JSON'];

  const problems = [];
  const inBounds = (point) =>
    isPoint(point) && point.x >= 0 && point.x <= level.width && point.y >= 0 && point.y <= level.height;

  if (!isInt(level.id) || level.id < 1) problems.push('id harus bilangan bulat >= 1');
  if (typeof level.name !== 'string' || level.name.trim() === '') problems.push('name harus teks tidak kosong');
  if (!isInt(level.width) || level.width < 320) problems.push('width harus bilangan bulat >= 320 px');
  if (!isInt(level.height) || level.height < 240) problems.push('height harus bilangan bulat >= 240 px');

  if (!isPoint(level.spawn)) problems.push('spawn butuh x dan y bilangan bulat');
  else if (!inBounds(level.spawn)) problems.push('spawn harus di dalam batas level');

  if (!isPoint(level.goal)) problems.push('goal butuh x dan y bilangan bulat');
  else if (!inBounds(level.goal)) problems.push('goal harus di dalam batas level');

  if (isPoint(level.spawn) && isPoint(level.goal) && level.spawn.x === level.goal.x && level.spawn.y === level.goal.y) {
    problems.push('spawn dan goal tidak boleh di titik yang sama');
  }

  if (!Array.isArray(level.platforms) || level.platforms.length === 0) {
    problems.push('platforms minimal berisi satu platform');
  } else {
    level.platforms.forEach((platform, index) => {
      if (!isPoint(platform) || !isInt(platform.width) || !isInt(platform.height) || platform.width < 1 || platform.height < 1) {
        problems.push(`platform ${index} butuh x, y, width, height bilangan bulat positif`);
      }
    });
  }

  if (!Array.isArray(level.coins)) {
    problems.push('coins harus array');
  } else if (level.coins.length === 0) {
    problems.push('coins minimal satu, kalau kosong skor tidak bisa bertambah saat main (MAIN-09)');
  } else {
    level.coins.forEach((coin, index) => {
      if (!isPoint(coin) || !isInt(coin.value) || coin.value < 1) {
        problems.push(`coin ${index} butuh x, y dan value bilangan bulat >= 1`);
      }
    });
  }

  if (typeof level.background !== 'string' || !level.background.startsWith(`${ASSET_DIR}/`)) {
    problems.push(`background harus path relatif yang mulai dengan "${ASSET_DIR}/"`);
  }

  return problems;
}

export function referencedAssets(level) {
  return [level.background, level.tileset].filter((value) => typeof value === 'string');
}

export function missingAssets(level, presentAssets) {
  return referencedAssets(level).filter((path) => !presentAssets.has(path));
}

export function indexProblems(levels) {
  const ids = levels.map((level) => level.id).sort((a, b) => a - b);
  const expected = ids.map((_, index) => index + 1);
  if (ids.length === 0) return ['belum ada level sama sekali'];
  if (ids.join(',') !== expected.join(',')) {
    return [`nomor level harus berurutan 1..${ids.length} tanpa duplikat, didapat ${ids.join(', ')}`];
  }
  return [];
}

export function scoreFromCoins(level, taken = level.coins.length) {
  return level.coins.slice(0, taken).reduce((total, coin) => total + coin.value, 0);
}

export function findLevel(levels, id) {
  return levels.find((level) => level.id === id) ?? null;
}

export function loadLevels(dir) {
  if (!existsSync(dir)) return { levels: [], problems: [`folder ${dir} tidak ada`] };

  const files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  const levels = [];
  const problems = [];

  if (files.length === 0) problems.push(`${dir} tidak berisi file .json`);

  for (const file of files) {
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    } catch (error) {
      problems.push(`${file}: JSON tidak bisa dibaca (${error.message})`);
      continue;
    }
    for (const problem of validateLevel(parsed)) problems.push(`${file}: ${problem}`);
    levels.push(parsed);
  }

  return { levels, problems };
}

export function listAssets(dir, prefix = ASSET_DIR) {
  const found = new Set();
  if (!existsSync(dir)) return found;

  const walk = (current, relative) => {
    for (const name of readdirSync(current).sort()) {
      const absolute = join(current, name);
      const next = relative ? `${relative}/${name}` : name;
      if (statSync(absolute).isDirectory()) walk(absolute, next);
      else found.add(`${prefix}/${next}`);
    }
  };

  walk(dir, '');
  return found;
}
