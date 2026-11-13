import { GameAudio } from "./audio.js";
import { createGameState, hudSnapshot, restartGame, stepGame } from "./physics.js";
import { renderScene, VIEW_HEIGHT, VIEW_WIDTH, type Floater, type SceneParticle } from "./render.js";
import { computeScore } from "./score.js";
import type { GameAssets } from "./assets.js";
import type { GameEvent, GameState, HudSnapshot, Level, RunResult, StepInput } from "./types.js";

const FIXED_STEP = 1 / 60;

export interface GameEngineOptions {
  canvas: HTMLCanvasElement;
  level: Level;
  assets: GameAssets;
  muted: boolean;
  reducedMotion: boolean;
  onHud: (hud: HudSnapshot) => void;
  onFinish: (result: RunResult) => void;
  onPauseChange: (paused: boolean) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class GameEngine {
  private readonly options: GameEngineOptions;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly audio: GameAudio;
  private readonly resizeObserver: ResizeObserver | null;
  private state: GameState;
  private camera = 0;
  private time = 0;
  private last = 0;
  private accumulator = 0;
  private raf = 0;
  private paused = false;
  private finished = false;
  private finishDelay: number | null = null;
  private destroyed = false;
  private jumpQueued = false;
  private input = { left: false, right: false, jumpHeld: false };
  private particles: SceneParticle[] = [];
  private floaters: Floater[] = [];
  private shake = 0;
  private flash = 0;
  private hudTimer = 0;
  private lastHudKey = "";

  constructor(options: GameEngineOptions) {
    this.options = options;
    const context = options.canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D tidak didukung browser ini");
    this.ctx = context;
    this.audio = new GameAudio(options.muted);
    this.state = createGameState(options.level);
    this.camera = this.cameraTarget();
    this.last = performance.now();

    this.resize();
    this.resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            this.resize();
          });
    this.resizeObserver?.observe(options.canvas);

    window.addEventListener("keydown", this.handleKeyDown, { passive: false });
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    document.addEventListener("visibilitychange", this.handleVisibility);
    options.canvas.addEventListener("pointerdown", this.handleCanvasPointer);

    this.emitHud(true);
    this.raf = requestAnimationFrame(this.frame);
  }

  private cameraTarget(): number {
    const player = this.state.player;
    const target = player.x + player.width / 2 - VIEW_WIDTH * 0.38;
    return clamp(target, 0, Math.max(0, this.state.level.width - VIEW_WIDTH));
  }

  private resize(): void {
    const canvas = this.options.canvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(320, Math.round(rect.width * dpr));
    const height = Math.max(180, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    const code = event.code;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(code)) {
      event.preventDefault();
    }
    if (event.repeat) return;

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if ((tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") && (code === "Space" || code === "Enter")) {
      return;
    }

    if (code === "Escape" || code === "KeyP") {
      this.togglePause();
      return;
    }
    if (code === "KeyR") {
      this.restart();
      return;
    }
    if (this.paused) return;

    if (code === "ArrowLeft" || code === "KeyA") this.input.left = true;
    if (code === "ArrowRight" || code === "KeyD") this.input.right = true;
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") this.pressJump();
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    const code = event.code;
    if (code === "ArrowLeft" || code === "KeyA") this.input.left = false;
    if (code === "ArrowRight" || code === "KeyD") this.input.right = false;
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") this.input.jumpHeld = false;
  };

  private handleBlur = (): void => {
    this.clearInputs();
    if (this.state.status === "playing" && !this.paused && !this.finished) this.setPaused(true);
  };

  private handleVisibility = (): void => {
    if (document.hidden) this.handleBlur();
  };

  private handleCanvasPointer = (): void => {
    this.audio.resume();
    this.options.canvas.focus({ preventScroll: true });
  };

  private clearInputs(): void {
    this.input.left = false;
    this.input.right = false;
    this.input.jumpHeld = false;
    this.jumpQueued = false;
  }

  pressJump(): void {
    if (this.paused || this.finished) return;
    this.jumpQueued = true;
    this.input.jumpHeld = true;
    this.audio.resume();
  }

  releaseJump(): void {
    this.input.jumpHeld = false;
  }

  setLeft(active: boolean): void {
    if (this.paused || this.finished) return;
    this.input.left = active;
    this.audio.resume();
  }

  setRight(active: boolean): void {
    if (this.paused || this.finished) return;
    this.input.right = active;
    this.audio.resume();
  }

  setMuted(muted: boolean): void {
    this.audio.setMuted(muted);
  }

  setPaused(paused: boolean): void {
    if (this.finished || this.destroyed || this.paused === paused) return;
    this.paused = paused;
    this.clearInputs();
    this.options.onPauseChange(paused);
    this.last = performance.now();
    this.accumulator = 0;
  }

  togglePause(): void {
    if (this.finished) return;
    this.setPaused(!this.paused);
  }

  restart(): void {
    restartGame(this.state);
    this.camera = this.cameraTarget();
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.flash = 0;
    this.finishDelay = null;
    this.finished = false;
    this.paused = false;
    this.accumulator = 0;
    this.clearInputs();
    this.options.onPauseChange(false);
    this.emitHud(true);
  }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver?.disconnect();
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
    document.removeEventListener("visibilitychange", this.handleVisibility);
    this.options.canvas.removeEventListener("pointerdown", this.handleCanvasPointer);
  }

  private frame = (now: number): void => {
    if (this.destroyed) return;

    const delta = Math.min(0.1, Math.max(0, (now - this.last) / 1000));
    this.last = now;

    if (!this.paused) {
      this.time += delta;

      if (this.state.status === "playing" || this.state.status === "dying") {
        this.accumulator += delta;
        let steps = 0;
        while (this.accumulator >= FIXED_STEP && steps < 5) {
          const input: StepInput = {
            left: this.input.left,
            right: this.input.right,
            jumpHeld: this.input.jumpHeld,
            jumpPressed: this.jumpQueued,
          };
          this.jumpQueued = false;
          stepGame(this.state, input, FIXED_STEP);
          this.handleEvents(this.state.events);
          this.accumulator -= FIXED_STEP;
          steps += 1;
        }
        if (steps >= 5) this.accumulator = 0;
      }

      this.updateEffects(delta);
      this.updateCamera(delta);

      if (this.state.status === "won" || this.state.status === "lost") {
        if (this.finishDelay === null) this.finishDelay = this.state.status === "won" ? 0.9 : 0.65;
        this.finishDelay -= delta;
        if (this.finishDelay <= 0 && !this.finished) {
          this.finished = true;
          this.options.onFinish(this.result());
        }
      }

      this.emitHud(false);
    }

    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };

  private result(): RunResult {
    const state = this.state;
    const won = state.status === "won";
    const breakdown = computeScore({
      coinValue: state.coinScore,
      lives: state.lives,
      time: state.time,
      won,
    });
    return {
      levelId: state.level.id,
      score: breakdown.total,
      coinValue: state.coinScore,
      coins: state.coinCount,
      totalCoins: state.coins.length,
      lives: state.lives,
      time: state.time,
      won,
    };
  }

  private handleEvents(events: GameEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case "jump": {
          this.audio.play("jump");
          this.spawnParticles(event.x, event.y, 4, { color: "#e9fff6", speed: 70, size: 3, gravity: 120 });
          break;
        }
        case "land": {
          this.audio.play("land");
          this.spawnParticles(event.x, event.y, 6, { color: "#d9f7d2", speed: 90, size: 3.5, gravity: 200 });
          break;
        }
        case "coin": {
          this.audio.play("coin");
          this.spawnParticles(event.x, event.y, 12, { color: "#ffd166", speed: 210, size: 3.4, gravity: 420 });
          this.addFloater(event.x, event.y - 16, "+100", "#ffe9a8");
          break;
        }
        case "spring": {
          this.audio.play("spring");
          this.spawnParticles(event.x, event.y, 7, { color: "#9bd7ff", speed: 160, size: 3, gravity: 260 });
          break;
        }
        case "checkpoint": {
          this.audio.play("checkpoint");
          this.spawnParticles(event.x, event.y - 70, 16, { color: "#35e0a1", speed: 140, size: 3.2, gravity: 60 });
          this.addFloater(event.x, event.y - 120, "Checkpoint!", "#8dffcf");
          break;
        }
        case "hurt": {
          this.audio.play("hurt");
          this.shake = 11;
          this.flash = 0.9;
          this.spawnParticles(event.x, event.y, 14, { color: "#ff7a59", speed: 230, size: 4, gravity: 620 });
          break;
        }
        case "respawn": {
          this.audio.play("respawn");
          this.flash = 0.55;
          break;
        }
        case "won": {
          this.audio.play("won");
          this.flash = 0.6;
          this.confetti(event.x, event.y);
          break;
        }
      }
    }
  }

  private spawnParticles(
    x: number,
    y: number,
    count: number,
    options: { color: string; speed: number; size: number; gravity: number },
  ): void {
    const total = this.options.reducedMotion ? Math.ceil(count * 0.35) : count;
    for (let index = 0; index < total; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = options.speed * (0.35 + Math.random() * 0.8);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - options.speed * 0.35,
        life: 0.45 + Math.random() * 0.35,
        maxLife: 0.8,
        size: options.size * (0.7 + Math.random() * 0.7),
        color: options.color,
        gravity: options.gravity,
        shape: "circle",
      });
    }
  }

  private confetti(x: number, y: number): void {
    const colors = ["#ff7a59", "#ffd166", "#35e0a1", "#8fd7ff", "#ffe9a8", "#c7a6ff"];
    const total = this.options.reducedMotion ? 18 : 70;
    for (let index = 0; index < total; index += 1) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 260,
        y: y - Math.random() * 120,
        vx: (Math.random() - 0.5) * 420,
        vy: -Math.random() * 380,
        life: 1.4 + Math.random() * 0.9,
        maxLife: 2.3,
        size: 3 + Math.random() * 4,
        color: colors[index % colors.length],
        gravity: 720,
        shape: Math.random() > 0.5 ? "square" : "line",
      });
    }
    this.addFloater(x, y - 60, "Selesai!", "#ffe9a8");
  }

  private addFloater(x: number, y: number, text: string, color: string): void {
    this.floaters.push({ x, y, text, color, life: 1, maxLife: 1 });
  }

  private updateEffects(delta: number): void {
    for (let index = this.particles.length - 1; index >= 0; index -= 1) {
      const particle = this.particles[index];
      particle.life -= delta;
      if (particle.life <= 0) {
        this.particles.splice(index, 1);
        continue;
      }
      particle.vy += particle.gravity * delta;
      particle.vx *= 1 - 0.9 * delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
    }

    for (let index = this.floaters.length - 1; index >= 0; index -= 1) {
      const floater = this.floaters[index];
      floater.life -= delta * 0.85;
      floater.y -= 38 * delta;
      if (floater.life <= 0) this.floaters.splice(index, 1);
    }

    this.shake = Math.max(0, this.shake - delta * 38);
    this.flash = Math.max(0, this.flash - delta * 2.6);
  }

  private updateCamera(delta: number): void {
    const target = this.cameraTarget();
    this.camera += (target - this.camera) * Math.min(1, delta * 9);
  }

  private emitHud(force: boolean): void {
    this.hudTimer += 1 / 60;
    const hud = hudSnapshot(this.state);
    const key = `${hud.lives}|${hud.coins}|${hud.status}|${Math.floor(hud.time * 5)}|${Math.round(hud.progress * 200)}`;
    if (force || key !== this.lastHudKey || this.hudTimer > 0.25) {
      this.lastHudKey = key;
      this.hudTimer = 0;
      this.options.onHud(hud);
    }
  }

  private render(): void {
    const canvas = this.options.canvas;
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#081724";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.min(canvas.width / VIEW_WIDTH, canvas.height / VIEW_HEIGHT);
    const offsetX = (canvas.width - VIEW_WIDTH * scale) / 2;
    const offsetY = (canvas.height - VIEW_HEIGHT * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    renderScene({
      ctx,
      state: this.state,
      assets: this.options.assets,
      camera: this.camera,
      time: this.time,
      shake: this.shake,
      flash: this.flash,
      particles: this.particles,
      floaters: this.floaters,
      reducedMotion: this.options.reducedMotion,
    });
  }
}
