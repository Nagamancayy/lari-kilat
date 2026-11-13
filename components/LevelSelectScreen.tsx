"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { browserStorage } from "@/lib/game/browser";
import { LEVELS, LEVEL_IDS } from "@/lib/game/catalog";
import { formatTime } from "@/lib/game/score";
import { readProgress, type Progress } from "@/lib/game/storage";

export default function LevelSelectScreen() {
  const [progress, setProgress] = useState<Progress | null>(null);

  useEffect(() => {
    setProgress(readProgress(browserStorage(), LEVEL_IDS));
  }, []);

  return (
    <main className="page-shell">
      <header className="page-top">
        <Link className="btn btn-quiet btn-small" href="/">
          <span aria-hidden="true">←</span> Menu
        </Link>
        <span className="brand brand-small">Rakit Studio</span>
      </header>

      <section className="page-heading">
        <p className="eyebrow">Pilih level</p>
        <h1>Tiga bukit, satu finis.</h1>
        <p className="lede">Selesaikan level untuk membuka level berikutnya. Level terkunci tetap terlihat.</p>
      </section>

      {LEVELS.length === 0 ? (
        <div className="empty-state" role="status">
          <h2>Belum ada level</h2>
          <p>Folder <code>levels/</code> kosong. Kembali ke menu atau hubungi Ravi.</p>
          <Link className="btn btn-primary" href="/">
            Ke menu
          </Link>
        </div>
      ) : (
        <ul className="level-grid" aria-busy={progress === null}>
          {LEVELS.map((level, index) => {
            const key = String(level.id);
            const saved = progress?.levels[key];
            const unlocked = progress ? index + 1 <= progress.unlocked : false;
            const number = String(level.id).padStart(2, "0");

            if (!progress) {
              return (
                <li key={level.id} className="level-card skeleton-card" aria-hidden="true">
                  <span className="skeleton-line wide" />
                  <span className="skeleton-line" />
                  <span className="skeleton-line short" />
                </li>
              );
            }

            const content = (
              <>
                <div className="level-card-top">
                  <span className="level-number">{number}</span>
                  <span className={`level-theme theme-${level.theme}`} aria-hidden="true" />
                </div>
                <h2>{level.name}</h2>
                <p className="level-hint">{level.hint}</p>
                <div className="level-meta">
                  <span>{level.coins.length} koin</span>
                  <span>{saved?.bestScore ? `${saved.bestScore.toLocaleString("id-ID")} skor` : "Belum dimainkan"}</span>
                  {saved?.bestTime ? <span>{formatTime(saved.bestTime)}</span> : null}
                </div>
                <div className="level-footer">
                  {saved?.completed ? (
                    <span className="badge badge-done">Selesai</span>
                  ) : unlocked ? (
                    <span className="badge">Siap dimainkan</span>
                  ) : (
                    <span className="badge badge-locked">
                      <span aria-hidden="true">▮</span> Terkunci
                    </span>
                  )}
                  {unlocked ? (
                    <span className="level-play" aria-hidden="true">
                      Main →
                    </span>
                  ) : null}
                </div>
              </>
            );

            return (
              <li key={level.id}>
                {unlocked ? (
                  <Link className={`level-card theme-${level.theme}`} href={`/play/?level=${level.id}`}>
                    {content}
                  </Link>
                ) : (
                  <div className="level-card is-locked" aria-disabled="true">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="fine">
        Progres dibaca dari perangkat ini. Membuka <code>/play?level=2</code> langsung juga bisa untuk pengujian
        (asumsi).
      </p>
    </main>
  );
}
