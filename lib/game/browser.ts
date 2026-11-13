import type { StorageLike } from "./storage.js";

export function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") return null;
    const testKey = "lari-kilat.test";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}
