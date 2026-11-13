"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserStorage } from "@/lib/game/browser";
import { LEVELS, LEVEL_IDS } from "@/lib/game/catalog";
import { bestScore, readProgress, setSound, writeProgress, type Progress } from "@/lib/game/storage";

export default function MenuScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    const storage = browserStorage();
    setStorageOk(storage !== null);
    setProgress(readProgress(storage, LEVEL_IDS));
  }, []);

  const isFirstRun = !progress || progress.unlocked <= 1;
  const currentLevel = LEVELS[Math.max(0, Math.min((progress?.unlocked ?? 1) - 1, LEVELS.length - 1))];
  const best = progress ? bestScore(progress) : 0;
  const soundOn = progress?.sound !== false;

  const toggleSound = () => {
    if (!progress) return;
    const next = setSound(progress, !progress.sound);
    setProgress(next);
    if (!writeProgress(browserStorage(), next)) setStorageOk(false);
  };

  return (
    <main className="menu-shell" aria-busy={progress === null}>
      <div className="atmosphere" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <header className="menu-top">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
          </span>
          Rakit Studio
        </span>
        <button
          type="button"
          className="btn btn-quiet btn-small"
          onClick={toggleSound}
          disabled={!progress}
          aria-pressed={soundOn}
        >
          Suara: {progress ? (soundOn ? "aktif" : "mati") : "memuat"}
        </button>
      </header>

      <section className="menu-grid">
        <div className="menu-copy">
          <p className="eyebrow">
            Platformer 2D · v1 · {LEVELS.length} level
          </p>
          <h1 className="title">
            Lari
            <span>Kilat</span>
          </h1>
          <p className="lede">
            Satu sesi 2–5 menit. Lompati jurang, ambil koin, hindari duri, lalu sentuh bendera finis.
          </p>

          <div className="menu-actions">
            {progress ? (
              <Link className="btn btn-primary btn-wide" href={`/play/?level=${currentLevel?.id ?? 1}`}>
                {isFirstRun ? "Mulai main" : `Lanjut · ${currentLevel?.name ?? "Level 1"}`}
                <span className="btn-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ) : (
              <span className="btn btn-primary btn-wide is-loading" aria-hidden="true">
                Memuat…
              </span>
            )}
            <Link className="btn btn-ghost" href="/levels/">
              Pilih level
            </Link>
          </div>

          <dl className="stat-grid">
            <div>
              <dt>Skor terbaik</dt>
              <dd>{progress ? best.toLocaleString("id-ID") : "—"}</dd>
            </div>
            <div>
              <dt>Level terbuka</dt>
              <dd>
                {progress ? `${progress.unlocked}/${LEVELS.length}` : "—"}
              </dd>
            </div>
            <div>
              <dt>Login</dt>
              <dd>Tidak perlu</dd>
            </div>
          </dl>

          {!storageOk && (
            <p className="notice" role="status">
              Browser memblokir penyimpanan lokal. Skor hanya bertahan selama sesi ini.
            </p>
          )}

          <p className="fine">
            Tanpa server · skor disimpan di perangkat ini · nama kerja v1 (asumsi)
          </p>
        </div>

        <div className="menu-side">
          <div className="hero-art" aria-hidden="true">
            <span className="art-sun" />
            <span className="art-cloud art-cloud-a" />
            <span className="art-cloud art-cloud-b" />
            <span className="art-hill art-hill-far" />
            <span className="art-hill art-hill-near" />
            <span className="art-platform" />
            <span className="art-coin art-coin-a" />
            <span className="art-coin art-coin-b" />
            <span className="art-runner">
              <i className="art-eye" />
              <i className="art-scarf" />
            </span>
            <span className="art-flag" />
          </div>

          <div className="how-card">
            <h2>Kontrol</h2>
            <ul className="key-list">
              <li>
                <span>
                  <kbd>←</kbd> <kbd>→</kbd> atau <kbd>A</kbd> <kbd>D</kbd>
                </span>
                <span>Kiri / kanan</span>
              </li>
              <li>
                <span>
                  <kbd>Spasi</kbd> atau <kbd>W</kbd>
                </span>
                <span>Lompat</span>
              </li>
              <li>
                <span>
                  <kbd>Esc</kbd>
                </span>
                <span>Jeda</span>
              </li>
              <li>
                <span>Layar sentuh</span>
                <span>Tombol kiri, kanan, lompat</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
