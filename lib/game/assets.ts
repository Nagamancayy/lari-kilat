import type { Level } from "./types.js";

export interface GameAssets {
  background: HTMLImageElement | null;
  tiles: HTMLImageElement | null;
  coin: HTMLImageElement | null;
  cloud: HTMLImageElement | null;
  flag: HTMLImageElement | null;
  spring: HTMLImageElement | null;
  failed: string[];
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function assetUrl(path: string): string {
  const clean = path.replace(/^\/+/, "");
  return `${BASE_PATH}/${clean}`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

export async function loadAssets(level: Level): Promise<GameAssets> {
  const paths = {
    background: level.background,
    tiles: level.tileset ?? "assets/tiles.svg",
    coin: "assets/coin.svg",
    cloud: "assets/cloud.svg",
    flag: "assets/flag.svg",
    spring: "assets/spring.svg",
  };

  const entries = await Promise.all(
    Object.entries(paths).map(async ([key, path]) => [key, await loadImage(assetUrl(path)), path] as const),
  );

  const assets: GameAssets = {
    background: null,
    tiles: null,
    coin: null,
    cloud: null,
    flag: null,
    spring: null,
    failed: [],
  };

  for (const [key, image, path] of entries) {
    if (image) {
      assets[key as keyof Omit<GameAssets, "failed">] = image;
    } else {
      assets.failed.push(path);
    }
  }

  return assets;
}
