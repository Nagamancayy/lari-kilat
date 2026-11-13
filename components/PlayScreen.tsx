"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameCanvas, { type GameCanvasHandle } from "@/components/GameCanvas";
import { loadAssets, type GameAssets } from "@/lib/game/assets";
import { browserStorage } from "@/lib/game/browser";
import { getLevel, LEVEL_IDS } from "@/lib/game/catalog";
import { formatTime } from "@/lib/game/score";
import { readProgress, setSound, writeProgress } from "@/lib/game/storage";
import type { HudSnapshot, RunResult } from "@/lib/game/types";

function Heart({ filled }: { filled: boolean }) {
  return (
    <svg className={`heart${filled ? "" : " is-lost"}`} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s-7.4-4.6-9.5-9.2A5.4 5.4 0 0 1 12 6.7a5.4 5.4 0 0 1 9.5 5.1C19.4 16.4 12 21 12 21Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function PlayScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const levelId = Number(searchParams.get("level") ?? "1");
  const level = Number.isInteger(levelId) ? getLevel(levelId) : undefined;

  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [hud, setHud] = useState<HudSnapshot>(() => ({
    lives: 3,
    coins: 0,
    totalCoins: level?.coins.length ?? 0,
    time: 0,
    status: "playing",
    progress: 0,
  }));
  const handleRef = useRef<GameCanvasHandle>(null);

  useEffect(() => {
    setMuted(!readProgress(browserStorage(), LEVEL_IDS).sound);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!level) return;
    let cancelled = false;
    setAssets(null);
    setLoadError(null);

    loadAssets(level)
      .then((loaded) => {
        if (!cancelled) setAssets(loaded);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Aset level gagal dimuat. Periksa koneksi lalu coba lagi.");
      });

    return () => {
      cancelled = true;
    };
  }, [level, attempt]);

  const onHud = useCallback((snapshot: HudSnapshot) => {
    setHud(snapshot);
  }, []);

  const onPauseChange = useCallback((value: boolean) => {
    setPaused(value);
  }, []);

  const onFinish = useCallback(
    (result: RunResult) => {
      const params = new URLSearchParams({
        level: String(result.levelId),
        score: String(result.score),
        coinValue: String(result.coinValue),
        coins: String(result.coins),
        totalCoins: String(result.totalCoins),
        lives: String(result.lives),
        time: result.time.toFixed(1),
        status: result.won ? "won" : "lost",
      });
      router.push(`/game-over/?${params.toString()}`);
    },
    [router],
  );

  const onError = useCallback((message: string) => {
    setLoadError(message);
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    const progress = readProgress(browserStorage(), LEVEL_IDS);
    writeProgress(browserStorage(), setSound(progress, !next));
  };

  const progressPercent = Math.round(hud.progress * 100);
  const totalCoins = hud.totalCoins || level?.coins.length || 0;

  const levelKey = useMemo(() => (level ? `${level.id}-${level.name}` : ""), [level]);

  if (!level) {
    return (
      <main className="center-screen">
        <div className="dialog" role="alert">
          <p className="eyebrow">Level tidak ditemukan</p>
          <h1>Level {Number.isFinite(levelId) ? levelId : "?"} tidak ada</h1>
          <p className="muted">Pilih level dari daftar. Level v1 hanya 1 sampai 3.</p>
          <div className="button-row">
            <Link className="btn btn-primary" href="/levels/">
              Pilih level
            </Link>
            <Link className="btn btn-ghost" href="/">
              Menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`play-shell theme-${level.theme}`} key={levelKey}>
      <header className="play-hud">
        <div className="hud-left">
          <Link className="hud-back" href="/levels/" aria-label="Kembali ke pilih level">
            <span aria-hidden="true">←</span>
          </Link>
          <div className="hud-title">
            <p className="hud-eyebrow">Level {level.id}</p>
            <h1>{level.name}</h1>
          </div>
        </div>

        <div className="hud-stats">
          <div className="hearts" aria-label={`Nyawa ${hud.lives} dari 3`}>
            {[0, 1, 2].map((index) => (
              <Heart key={index} filled={index < hud.lives} />
            ))}
          </div>
          <div className="hud-chip">
            <span>Koin</span>
            <b>
              {hud.coins}/{totalCoins}
            </b>
          </div>
          <div className="hud-chip">
            <span>Waktu</span>
            <b>{formatTime(hud.time)}</b>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={() => handleRef.current?.togglePause()}
            aria-label={paused ? "Lanjutkan permainan" : "Jeda permainan"}
          >
            <span aria-hidden="true">{paused ? "▶" : "II"}</span>
          </button>
          <button
            type="button"
            className={`icon-btn${muted ? " is-muted" : ""}`}
            onClick={toggleSound}
            aria-label={muted ? "Nyalakan suara" : "Matikan suara"}
            aria-pressed={!muted}
          >
            <span aria-hidden="true">♪</span>
          </button>
        </div>
      </header>

      <div
        className="progress-track"
        role="progressbar"
        aria-label="Progres menuju finis"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressPercent}
      >
        <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="stage-wrap">
        <div className="stage">
          {assets ? (
            <GameCanvas
              ref={handleRef}
              level={level}
              assets={assets}
              muted={muted}
              reducedMotion={reducedMotion}
              onHud={onHud}
              onFinish={onFinish}
              onPauseChange={onPauseChange}
              onError={onError}
            />
          ) : loadError ? (
            <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="asset-error-title">
              <div className="dialog">
                <p className="eyebrow">Galat</p>
                <h2 id="asset-error-title">Level gagal dimuat</h2>
                <p className="muted">{loadError}</p>
                <div className="button-col">
                  <button type="button" className="btn btn-primary" onClick={() => setAttempt((value) => value + 1)}>
                    Coba lagi
                  </button>
                  <Link className="btn btn-ghost" href="/levels/">
                    Pilih level
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="overlay" aria-live="polite">
              <div className="loading-card">
                <span className="spinner" aria-hidden="true" />
                <p>Menyiapkan level…</p>
              </div>
            </div>
          )}

          {assets && assets.failed.length > 0 && (
            <p className="asset-warning" role="status">
              Grafik cadangan aktif · {assets.failed.length} aset gagal dimuat
            </p>
          )}

          {paused && (
            <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title">
              <div className="dialog">
                <p className="eyebrow">Jeda</p>
                <h2 id="pause-title">Berhenti sebentar</h2>
                <p className="muted">Waktu berhenti. Nyawa dan koin tetap di tempatnya.</p>
                <div className="button-col">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleRef.current?.togglePause()}
                    autoFocus
                  >
                    Lanjut
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => handleRef.current?.restart()}>
                    Ulangi level
                  </button>
                  <Link className="btn btn-ghost" href="/levels/">
                    Pilih level
                  </Link>
                  <Link className="btn btn-quiet" href="/">
                    Menu
                  </Link>
                </div>
              </div>
            </div>
          )}

          {loadError && assets && (
            <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="load-error-title">
              <div className="dialog">
                <p className="eyebrow">Galat</p>
                <h2 id="load-error-title">Level gagal dimuat</h2>
                <p className="muted">{loadError}</p>
                <div className="button-col">
                  <button type="button" className="btn btn-primary" onClick={() => setAttempt((value) => value + 1)}>
                    Coba lagi
                  </button>
                  <Link className="btn btn-ghost" href="/levels/">
                    Pilih level
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="play-help">
        <span>
          <kbd>←</kbd> <kbd>→</kbd> gerak
        </span>
        <span>
          <kbd>Spasi</kbd> lompat
        </span>
        <span>
          <kbd>Esc</kbd> jeda
        </span>
        <span className="play-help-touch">Sentuh: tombol kiri, kanan, lompat</span>
      </p>
    </main>
  );
}
