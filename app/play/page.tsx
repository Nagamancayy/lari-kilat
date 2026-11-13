import { Suspense } from "react";
import PlayScreen from "@/components/PlayScreen";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="center-screen">
          <div className="loading-card" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p>Menyiapkan level…</p>
          </div>
        </main>
      }
    >
      <PlayScreen />
    </Suspense>
  );
}
