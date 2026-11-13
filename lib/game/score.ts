export interface ScoreInput {
  coinValue: number;
  lives: number;
  time: number;
  won: boolean;
}

export interface ScoreBreakdown {
  coins: number;
  lifeBonus: number;
  timeBonus: number;
  finishBonus: number;
  total: number;
}

export const SCORE_RULES = {
  lifeBonus: 150,
  finishBonus: 500,
  timeBase: 600,
  timePenaltyPerSecond: 10,
};

export function computeScore({ coinValue, lives, time, won }: ScoreInput): ScoreBreakdown {
  const coins = Math.max(0, Math.round(coinValue));
  const lifeBonus = Math.max(0, Math.min(3, Math.round(lives))) * SCORE_RULES.lifeBonus;
  const timeBonus = won
    ? Math.max(0, SCORE_RULES.timeBase - Math.floor(Math.max(0, time)) * SCORE_RULES.timePenaltyPerSecond)
    : 0;
  const finishBonus = won ? SCORE_RULES.finishBonus : 0;

  return {
    coins,
    lifeBonus,
    timeBonus,
    finishBonus,
    total: coins + lifeBonus + timeBonus + finishBonus,
  };
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const minutes = Math.floor(safe / 60);
  const rest = safe - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, "0")}`;
}
