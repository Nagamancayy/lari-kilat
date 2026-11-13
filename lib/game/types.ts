export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CoinDef extends Point {
  value: number;
}

export interface SpringDef extends Rect {
  power?: number;
}

export type ThemeName = "meadow" | "dusk" | "summit";

export interface Level {
  id: number;
  name: string;
  hint: string;
  theme: ThemeName;
  width: number;
  height: number;
  background: string;
  tileset?: string;
  spawn: Point;
  checkpoint?: Point;
  goal: Rect;
  platforms: Rect[];
  coins: CoinDef[];
  spikes: Rect[];
  springs: SpringDef[];
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  onGround: boolean;
  face: 1 | -1;
  coyote: number;
  jumpBuffer: number;
  anim: number;
  squash: number;
  invuln: number;
}

export interface CoinState extends CoinDef {
  taken: boolean;
}

export type GameStatus = "playing" | "dying" | "won" | "lost";

export type GameEventType =
  | "jump"
  | "land"
  | "coin"
  | "spring"
  | "checkpoint"
  | "hurt"
  | "respawn"
  | "won";

export interface GameEvent {
  type: GameEventType;
  x: number;
  y: number;
}

export interface GameState {
  level: Level;
  player: PlayerState;
  coins: CoinState[];
  coinCount: number;
  coinScore: number;
  lives: number;
  time: number;
  status: GameStatus;
  checkpointOn: boolean;
  respawnTimer: number;
  events: GameEvent[];
}

export interface StepInput {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
}

export interface HudSnapshot {
  lives: number;
  coins: number;
  totalCoins: number;
  time: number;
  status: GameStatus;
  progress: number;
}

export interface RunResult {
  levelId: number;
  score: number;
  coinValue: number;
  coins: number;
  totalCoins: number;
  lives: number;
  time: number;
  won: boolean;
}
