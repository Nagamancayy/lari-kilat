"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { browserStorage } from "@/lib/game/browser";
import { getLevel, LEVEL_IDS, nextLevel } from "@/lib/game/catalog";
import { computeScore, formatTime } from "@/lib/game/score";
import { readProgress, recordRun, writeProgress } from "@/lib/game/storage";
import type { RunResult } from "@/lib/game/types";

interface Summary {
  best: number;
  isRecord: boolean;
  saved: boolean;
}

function clampInt(value: string | null, fallback: number, max: number): number {
  if (value === null) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(max, Math.floor(parsed)));
}

function clampTime(value: string | null): number {
  if (value === null) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(3600, Math.round(parsed * 10) / 10);
}

export default function GameOverScreen() {
  const params = useSearchParams();
  const levelId = clampInt(params.get("level"), 1, 9999);
  const level = getLevel(levelId);
  const won = params.get("status") === "won";
  const score = clampInt(params.get("score"), 0, 9_999_999);
  const coins = clampInt(params.get("coins"), 0, 99);
  const totalCoins = clampInt(params.get("totalCoins"), level?.coins.length ?? 0, 99);
  const coinValue = clampInt(params.get("coinValue"), coins * 100, 99_999);
  const lives = clampInt(params.get("lives"), won ? 3 : 0, 3);
  const time = clampTime(params.get("time"));

  const [summary, setSummary] = useState<Summary | null>(null);
  const recorded = useRef(false);

  const run: RunResult = useMemo(
    () => ({
      levelId,
      score,
      coinValue,
      coins,
      totalCoins,
      lives,
      time,
      won,
    }),
    [levelId, score, coinValue, coins, totalCoins, lives, time, won],
  );

  useEffect(() => {
    if (!level || recorded.current) return;
    recorded.current = true;

    const storage = browserStorage();
    const before = readProgress(storage, LEVEL_IDS);
    const previousBest = before.levels[String(level.id)]?.bestScore ?? 0;
    const after = recordRun(before, run, LEVEL_IDS);
    const saved = writeProgress(storage, after);

    setSummary({
      best: after.levels[String(level.id)]?.bestScore ?? 0,
      isRecord: run.score > previousBest,
      saved,
    });
  }, [level, run]);

  const breakdown = computeScore({ coinValue, lives, time, won });
  const next = level ? nextLevel(level.id) : undefined;

  if (!level) {
    return (
      <main className="center-screen">
        <div className="dialog" role="alert">
          <p className="eyebrow">Hasil tidak ditemukan</p>
          <h1>Level {levelId} tidak ada</h1>
          <p className="muted">Kembali ke menu dan mulai dari level yang tersedia.</p>
          <div className="button-row">
            <Link className="btn btn-primary" href="/">
              Ke menu
            </Link>
            <Link className="btn btn-ghost" href="/levels/">
              Pilih level
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="result-shell">
      <section className={`result-card${won ? " is-won" : " is-lost"}`} aria-busy={summary === null}>
        <p className="eyebrow">
          Level {level.id} · {level.name}
        </p>
        <h1>{won ? "Level selesai" : "Game over"}</h1>
        <p className="lede">
          {won
            ? "Bendera finis tersentuh. Skor disimpan di perangkat ini."
            : "Nyawa habis. Skor sesi ini tetap dihitung dan disimpan."}
        </p>

        <div className="score-hero">
          <span className="score-label">Skor akhir</span>
          <strong>{score.toLocaleString("id-ID")}</strong>
          {summary?.isRecord && <span className="badge badge-record">Rekor baru</span>}
        </div>

        <dl className="result-stats">
          <div>
            <dt>Koin</dt>
            <dd>
              {coins}/{totalCoins}
            </dd>
          </div>
          <div>
            <dt>Nyawa</dt>
            <dd>{lives}</dd>
          </div>
          <div>
            <dt>Waktu</dt>
            <dd>{formatTime(time)}</dd>
          </div>
        </dl>

        <div className="breakdown">
          <div>
            <span>Koin</span>
            <b>+{breakdown.coins}</b>
          </div>
          <div>
            <span>Sisa nyawa</span>
            <b>+{breakdown.lifeBonus}</b>
          </div>
          <div>
            <span>Bonus waktu</span>
            <b>+{breakdown.timeBonus}</b>
          </div>
          <div>
            <span>Bonus finis</span>
            <b>+{breakdown.finishBonus}</b>
          </div>
        </div>

        <p className="result-best">
          {summary === null ? (
            "Menyimpan skor…"
          ) : summary.saved ? (
            <>
              Rekor level ini: <b>{summary.best.toLocaleString("id-ID")}</b>
            </>
          ) : (
            "Penyimpanan browser diblokir — skor hanya bertahan di sesi ini."
          )}
        </p>

        <div className="button-row">
          <Link className="btn btn-primary" href={`/play/?level=${level.id}`}>
            {won ? "Main lagi" : "Coba lagi"}
          </Link>
          {won && next ? (
            <Link className="btn btn-sun" href={`/play/?level=${next.id}`}>
              Level berikutnya
            </Link>
          ) : null}
          <Link className="btn btn-ghost" href="/levels/">
            Pilih level
          </Link>
          <Link className="btn btn-quiet" href="/">
            Menu
          </Link>
        </div>

        {won && !next && <p className="fine">Semua level v1 sudah selesai. Level baru menunggu keputusan Bos.</p>}

        <p className="fine">
          Skor = koin + sisa nyawa ×150 + bonus waktu (maks 600) + 500 saat finis.
        </p>
      </section>
    </main>
  );
}
