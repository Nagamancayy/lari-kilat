import type { GameAssets } from "./assets.js";
import type { GameState, Level, Rect, ThemeName } from "./types.js";

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export interface SceneParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  shape: "circle" | "square" | "line";
}

export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface SceneOptions {
  ctx: CanvasRenderingContext2D;
  state: GameState;
  assets: GameAssets;
  camera: number;
  time: number;
  shake: number;
  flash: number;
  particles: SceneParticle[];
  floaters: Floater[];
  reducedMotion: boolean;
}

interface Palette {
  skyTop: string;
  skyBottom: string;
  sun: string;
  farHill: string;
  midHill: string;
  nearHill: string;
  grass: string;
  grassEdge: string;
  dirt: string;
  dirtDark: string;
  block: string;
  blockEdge: string;
  glow: string;
}

const PALETTES: Record<ThemeName, Palette> = {
  meadow: {
    skyTop: "#3fb8d8",
    skyBottom: "#d9f7d2",
    sun: "#ffd166",
    farHill: "#8fdcb4",
    midHill: "#56bf8d",
    nearHill: "#2f8f63",
    grass: "#4ecf8f",
    grassEdge: "#2f9e6e",
    dirt: "#7a5137",
    dirtDark: "#553424",
    block: "#c97a4a",
    blockEdge: "#8b4b2b",
    glow: "#ffe9a8",
  },
  dusk: {
    skyTop: "#2a1e5c",
    skyBottom: "#ffb37a",
    sun: "#ffb37a",
    farHill: "#6a4b87",
    midHill: "#4a3369",
    nearHill: "#2f2149",
    grass: "#48c295",
    grassEdge: "#2c8a68",
    dirt: "#4f3a5f",
    dirtDark: "#34263f",
    block: "#a8656f",
    blockEdge: "#713f4a",
    glow: "#ffd8a8",
  },
  summit: {
    skyTop: "#0d2b4e",
    skyBottom: "#a8e6ff",
    sun: "#e9fbff",
    farHill: "#7fb2cf",
    midHill: "#4f86a8",
    nearHill: "#2f5f80",
    grass: "#7fd8c0",
    grassEdge: "#4b9e8c",
    dirt: "#5a6b8a",
    dirtDark: "#3b4760",
    block: "#8fa3c4",
    blockEdge: "#5d6f8e",
    glow: "#d8f7ff",
  },
};

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSky(ctx: CanvasRenderingContext2D, level: Level, assets: GameAssets, palette: Palette, camera: number, time: number): void {
  if (assets.background) {
    ctx.drawImage(assets.background, 0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  } else {
    const gradient = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

    const sun = ctx.createRadialGradient(1080, 150, 10, 1080, 150, 220);
    sun.addColorStop(0, palette.sun);
    sun.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sun;
    ctx.fillRect(820, 0, 520, 420);
  }

  for (let index = 0; index < 4; index += 1) {
    const span = 1700;
    const x = (((index * 430 - camera * 0.14 + time * 6) % span) + span) % span - 180;
    const y = 58 + (index % 3) * 52;
    if (assets.cloud) {
      ctx.globalAlpha = 0.42 + (index % 2) * 0.12;
      ctx.drawImage(assets.cloud, x, y, 240, 120);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = `rgba(255,255,255,${0.32 + (index % 2) * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(x + 80, y + 60, 74, 26, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 136, y + 48, 54, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const layers = [
    { factor: 0.08, base: 596, amplitude: 34, color: palette.farHill },
    { factor: 0.18, base: 616, amplitude: 44, color: palette.midHill },
    { factor: 0.32, base: 640, amplitude: 52, color: palette.nearHill },
  ];

  for (const [index, layer] of layers.entries()) {
    ctx.beginPath();
    ctx.moveTo(-120, VIEW_HEIGHT);
    for (let x = -120; x <= VIEW_WIDTH + 120; x += 20) {
      const world = x + camera * layer.factor;
      const y =
        layer.base +
        Math.sin(world * 0.006 + index * 1.7) * layer.amplitude +
        Math.sin(world * 0.014 + index) * layer.amplitude * 0.32;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_WIDTH + 120, VIEW_HEIGHT);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }
}

function drawPlatform(ctx: CanvasRenderingContext2D, platform: Rect, palette: Palette): void {
  if (platform.height >= 80) {
    const dirt = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
    dirt.addColorStop(0, palette.dirt);
    dirt.addColorStop(1, palette.dirtDark);
    ctx.fillStyle = dirt;
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

    ctx.fillStyle = palette.grass;
    ctx.fillRect(platform.x, platform.y, platform.width, 16);
    ctx.fillStyle = palette.grassEdge;
    ctx.fillRect(platform.x, platform.y + 16, platform.width, 6);

    ctx.fillStyle = palette.grass;
    for (let x = platform.x + 6; x < platform.x + platform.width - 4; x += 34) {
      const height = 7 + ((x * 7) % 5);
      ctx.beginPath();
      ctx.moveTo(x, platform.y + 2);
      ctx.lineTo(x + 4, platform.y - height);
      ctx.lineTo(x + 8, platform.y + 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "rgba(0,0,0,0.12)";
    for (let x = platform.x + 18; x < platform.x + platform.width; x += 62) {
      for (let y = platform.y + 44; y < platform.y + platform.height - 8; y += 34) {
        ctx.beginPath();
        ctx.arc(x + ((y * 3) % 17), y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }

  rounded(ctx, platform.x, platform.y, platform.width, platform.height, 7);
  const body = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
  body.addColorStop(0, palette.block);
  body.addColorStop(1, palette.blockEdge);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.22)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(platform.x + 6, platform.y + 4, platform.width - 12, 3);
}

function drawSpike(ctx: CanvasRenderingContext2D, spike: Rect): void {
  const teeth = Math.max(2, Math.round(spike.width / 16));
  const width = spike.width / teeth;
  const gradient = ctx.createLinearGradient(0, spike.y, 0, spike.y + spike.height);
  gradient.addColorStop(0, "#dfe9f2");
  gradient.addColorStop(0.55, "#8ba3b8");
  gradient.addColorStop(1, "#3a4d60");

  ctx.fillStyle = gradient;
  for (let index = 0; index < teeth; index += 1) {
    const x = spike.x + index * width;
    ctx.beginPath();
    ctx.moveTo(x, spike.y + spike.height);
    ctx.lineTo(x + width / 2, spike.y - 4);
    ctx.lineTo(x + width, spike.y + spike.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#243447";
  ctx.fillRect(spike.x, spike.y + spike.height - 3, spike.width, 3);
}

function drawSpring(ctx: CanvasRenderingContext2D, spring: Rect, time: number): void {
  const compress = Math.max(0, Math.sin(time * 6) * 2);
  ctx.fillStyle = "#23384d";
  rounded(ctx, spring.x, spring.y + spring.height - 6, spring.width, 6, 3);
  ctx.fill();

  ctx.strokeStyle = "#8fd7ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let index = 0; index < 3; index += 1) {
    const y = spring.y + 6 - compress + index * 4;
    ctx.moveTo(spring.x + 14, y);
    ctx.lineTo(spring.x + spring.width - 14, y + 3);
  }
  ctx.stroke();

  ctx.fillStyle = "#ffd166";
  rounded(ctx, spring.x + 6, spring.y - compress, spring.width - 12, 7, 3.5);
  ctx.fill();
}

function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, index: number, time: number, assets: GameAssets): void {
  const bob = Math.sin(time * 3 + index * 1.4) * 5;
  const spin = Math.abs(Math.cos(time * 2.6 + index * 0.9));
  const width = 18 + spin * 16;

  ctx.save();
  ctx.translate(x, y + bob);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 34);
  glow.addColorStop(0, "rgba(255,209,102,0.5)");
  glow.addColorStop(1, "rgba(255,209,102,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  if (assets.coin) {
    ctx.drawImage(assets.coin, -width / 2, -width / 2, width, width);
  } else {
    ctx.fillStyle = "#e0a12c";
    ctx.beginPath();
    ctx.ellipse(0, 0, width / 2, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe9a8";
    ctx.beginPath();
    ctx.ellipse(-2, -3, Math.max(2, width / 5), 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, x: number, y: number, active: boolean, time: number): void {
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e8f7ee";
  ctx.fillRect(x - 2, y - 96, 5, 96);
  ctx.fillStyle = active ? "#35e0a1" : "#7c93a6";

  const wobble = active ? Math.sin(time * 6) * 4 : 0;
  ctx.beginPath();
  ctx.moveTo(x + 3, y - 94);
  ctx.lineTo(x + 44 + wobble, y - 78);
  ctx.lineTo(x + 3, y - 60);
  ctx.closePath();
  ctx.fill();

  if (active) {
    const glow = ctx.createRadialGradient(x, y - 70, 4, x, y - 70, 58);
    glow.addColorStop(0, "rgba(53,224,161,0.35)");
    glow.addColorStop(1, "rgba(53,224,161,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 60, y - 130, 120, 120);
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, goal: Rect, assets: GameAssets, time: number, palette: Palette): void {
  const pulse = 0.5 + Math.sin(time * 3) * 0.18;
  const glow = ctx.createRadialGradient(goal.x + 20, goal.y + goal.height / 2, 8, goal.x + 20, goal.y + goal.height / 2, 90);
  glow.addColorStop(0, `rgba(255,255,255,${0.25 + pulse * 0.2})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(goal.x - 70, goal.y - 50, 190, goal.height + 90);

  ctx.fillStyle = "#e8f7ee";
  ctx.fillRect(goal.x + 8, goal.y, 5, goal.height);

  if (assets.flag) {
    ctx.drawImage(assets.flag, goal.x + 8, goal.y + 4, 66, 90);
  } else {
    ctx.fillStyle = "#ff7a59";
    ctx.beginPath();
    ctx.moveTo(goal.x + 13, goal.y + 4);
    ctx.lineTo(goal.x + 63 + Math.sin(time * 5) * 4, goal.y + 30);
    ctx.lineTo(goal.x + 13, goal.y + 56);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  rounded(ctx, goal.x - 6, goal.y - 34, 66, 22, 8);
  ctx.fill();
  ctx.fillStyle = palette.glow;
  ctx.font = "800 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FINIS", goal.x + 27, goal.y - 19);
  ctx.textAlign = "left";
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, time: number, reducedMotion: boolean): void {
  const player = state.player;
  const walk = Math.abs(player.vx) > 24 && player.onGround;
  const swing = walk ? Math.sin(player.anim * 16) : 0;
  const blink = player.invuln > 0 && Math.floor(time * 12) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = blink ? 0.45 : 1;
  ctx.translate(player.x + player.width / 2, player.y + player.height);

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  let scaleX = 1;
  let scaleY = 1;
  if (player.squash > 0) {
    scaleX = 1 + player.squash * 0.14;
    scaleY = 1 - player.squash * 0.16;
  } else if (player.squash < 0) {
    scaleX = 1 + player.squash * 0.08;
    scaleY = 1 - player.squash * 0.1;
  }
  ctx.scale(scaleX, scaleY);

  const legSwing = walk ? swing * 6 : player.onGround ? 0 : 3;
  ctx.fillStyle = "#1d6d57";
  rounded(ctx, -12 + legSwing, -13, 9, 13, 4);
  ctx.fill();
  rounded(ctx, 3 - legSwing, -13, 9, 13, 4);
  ctx.fill();

  const cape = ctx.createLinearGradient(0, -34, 0, -10);
  cape.addColorStop(0, "#ffb36b");
  cape.addColorStop(1, "#ff7a59");
  ctx.fillStyle = cape;
  ctx.beginPath();
  ctx.moveTo(-player.face * 12, -34);
  ctx.lineTo(-player.face * 32, -24 + Math.sin(time * 8) * 3);
  ctx.lineTo(-player.face * 14, -14);
  ctx.closePath();
  ctx.fill();

  const body = ctx.createLinearGradient(0, -46, 0, -6);
  body.addColorStop(0, "#ff9a72");
  body.addColorStop(1, "#ff5f45");
  ctx.fillStyle = body;
  rounded(ctx, -player.width / 2, -46, player.width, 38, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(74,26,18,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#ffe7d1";
  rounded(ctx, -9, -25, 18, 14, 7);
  ctx.fill();

  const eyeX = player.face * 6;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(player.face * 4, -36, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#12233a";
  ctx.beginPath();
  ctx.arc(eyeX, -36, 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#7a2a1c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (reducedMotion || player.onGround) {
    ctx.arc(player.face * 3, -29, 4, 0.15, Math.PI - 0.15);
  } else {
    ctx.arc(player.face * 3, -27, 3, 0, Math.PI * 2);
  }
  ctx.stroke();

  ctx.fillStyle = "#35e0a1";
  rounded(ctx, -player.width / 2 + 3, -46, player.width - 6, 5, 2.5);
  ctx.fill();
  ctx.restore();
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: SceneParticle[]): void {
  for (const particle of particles) {
    const alpha = Math.max(0, Math.min(1, particle.life / particle.maxLife));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    if (particle.shape === "square") {
      ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    } else if (particle.shape === "line") {
      ctx.fillRect(particle.x - particle.size / 2, particle.y - 1.5, particle.size, 3);
    } else {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawFloaters(ctx: CanvasRenderingContext2D, floaters: Floater[]): void {
  ctx.textAlign = "center";
  ctx.font = "800 17px system-ui, sans-serif";
  for (const floater of floaters) {
    const alpha = Math.max(0, Math.min(1, floater.life / floater.maxLife));
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(10,25,40,0.7)";
    ctx.strokeText(floater.text, floater.x, floater.y);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

export function renderScene(options: SceneOptions): void {
  const { ctx, state, assets, camera, time, particles, floaters, reducedMotion } = options;
  const level = state.level;
  const palette = PALETTES[level.theme];
  const shakeX = reducedMotion ? 0 : (Math.random() - 0.5) * options.shake;
  const shakeY = reducedMotion ? 0 : (Math.random() - 0.5) * options.shake * 0.6;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawSky(ctx, level, assets, palette, camera, time);

  ctx.save();
  ctx.translate(-camera, 0);

  for (const platform of level.platforms) drawPlatform(ctx, platform, palette);
  for (const spike of level.spikes) drawSpike(ctx, spike);
  for (const spring of level.springs) drawSpring(ctx, spring, time);

  if (level.checkpoint) drawCheckpoint(ctx, level.checkpoint.x, level.checkpoint.y, state.checkpointOn, time);
  drawGoal(ctx, level.goal, assets, time, palette);

  state.coins.forEach((coin, index) => {
    if (!coin.taken) drawCoin(ctx, coin.x, coin.y, index, time, assets);
  });

  drawPlayer(ctx, state, time, reducedMotion);
  drawParticles(ctx, particles);
  drawFloaters(ctx, floaters);

  ctx.restore();

  if (options.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.35, options.flash * 0.22)})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }

  const vignette = ctx.createRadialGradient(VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.35, VIEW_WIDTH / 2, VIEW_HEIGHT / 2, VIEW_HEIGHT * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(6,20,32,0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  ctx.restore();
}
