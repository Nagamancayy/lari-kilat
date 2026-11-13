export const SCORE_KEY = 'platformer2d.bestScore';

export function readBest(storage) {
  let raw;
  try {
    raw = storage.getItem(SCORE_KEY);
  } catch {
    return 0;
  }
  if (raw === null || raw === undefined) return 0;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return 0;
  }

  const value = typeof parsed === 'number' ? parsed : parsed?.best;
  return Number.isSafeInteger(value) && value > 0 ? value : 0;
}

export function recordResult(storage, score) {
  if (!Number.isSafeInteger(score) || score < 0) {
    throw new RangeError(`skor harus bilangan bulat >= 0, didapat ${score}`);
  }

  const previous = readBest(storage);
  const best = Math.max(previous, score);
  const isRecord = best > previous;

  if (!isRecord) return { best, isRecord, saved: true };

  try {
    storage.setItem(SCORE_KEY, JSON.stringify({ best }));
  } catch {
    return { best: previous, isRecord: false, saved: false };
  }

  return { best, isRecord, saved: true };
}
