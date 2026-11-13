import { Suspense } from "react";
import GameOverScreen from "@/components/GameOverScreen";

export default function GameOverPage() {
  return (
    <Suspense
      fallback={
        <main className="center-screen">
          <div className="loading-card" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Menyimpan skor…</p>
          </div>
        </main>
      }
    >
      <GameOverScreen />
    </Suspense>
  );
}
