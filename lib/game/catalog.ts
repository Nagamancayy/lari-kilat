import levelOne from "../../levels/level-01.json";
import levelThree from "../../levels/level-03.json";
import levelTwo from "../../levels/level-02.json";
import { parseLevels } from "./levels.ts";
import type { Level } from "./types.ts";

export const LEVELS: Level[] = parseLevels([levelOne, levelTwo, levelThree]);
export const LEVEL_IDS: number[] = LEVELS.map((level) => level.id);

export function getLevel(id: number): Level | undefined {
  return LEVELS.find((level) => level.id === id);
}

export function nextLevel(id: number): Level | undefined {
  return LEVELS.find((level) => level.id === id + 1);
}
