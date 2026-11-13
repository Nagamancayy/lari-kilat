"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { GameAssets } from "@/lib/game/assets";
import { GameEngine } from "@/lib/game/engine";
import type { HudSnapshot, Level, RunResult } from "@/lib/game/types";

export interface GameCanvasHandle {
  togglePause: () => void;
  restart: () => void;
}

interface GameCanvasProps {
  level: Level;
  assets: GameAssets;
  muted: boolean;
  reducedMotion: boolean;
  onHud: (hud: HudSnapshot) => void;
  onFinish: (result: RunResult) => void;
  onPauseChange: (paused: boolean) => void;
  onError: (message: string) => void;
}

const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  { level, assets, muted, reducedMotion, onHud, onFinish, onPauseChange, onError },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const callbacks = useRef({ onHud, onFinish, onPauseChange, onError });
  const mutedRef = useRef(muted);

  useEffect(() => {
    callbacks.current = { onHud, onFinish, onPauseChange, onError };
  }, [onHud, onFinish, onPauseChange, onError]);

  useEffect(() => {
    mutedRef.current = muted;
    engineRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: GameEngine | null = null;
    try {
      engine = new GameEngine({
        canvas,
        level,
        assets,
        muted: mutedRef.current,
        reducedMotion,
        onHud: (hud) => callbacks.current.onHud(hud),
        onFinish: (result) => callbacks.current.onFinish(result),
        onPauseChange: (paused) => callbacks.current.onPauseChange(paused),
      });
      engineRef.current = engine;
    } catch (error) {
      callbacks.current.onError(error instanceof Error ? error.message : "Game gagal dimulai");
    }

    return () => {
      engine?.destroy();
      engineRef.current = null;
    };
  }, [level, assets, reducedMotion]);

  useImperativeHandle(
    ref,
    () => ({
      togglePause: () => engineRef.current?.togglePause(),
      restart: () => engineRef.current?.restart(),
    }),
    [],
  );

  const stopAll = () => {
    engineRef.current?.setLeft(false);
    engineRef.current?.setRight(false);
    engineRef.current?.releaseJump();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        tabIndex={0}
        role="application"
        aria-label="Area permainan Lari Kilat. Gunakan panah kiri dan kanan untuk bergerak, spasi untuk melompat, Escape untuk jeda."
        onContextMenu={(event) => event.preventDefault()}
      />

      <div className="touch-controls" aria-label="Kontrol sentuh">
        <div className="touch-group">
          <button
            type="button"
            className="touch-btn"
            aria-label="Gerak kiri"
            onPointerDown={(event) => {
              event.preventDefault();
              engineRef.current?.setLeft(true);
            }}
            onPointerUp={stopAll}
            onPointerCancel={stopAll}
            onPointerLeave={stopAll}
            onContextMenu={(event) => event.preventDefault()}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className="touch-btn"
            aria-label="Gerak kanan"
            onPointerDown={(event) => {
              event.preventDefault();
              engineRef.current?.setRight(true);
            }}
            onPointerUp={stopAll}
            onPointerCancel={stopAll}
            onPointerLeave={stopAll}
            onContextMenu={(event) => event.preventDefault()}
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>
        <button
          type="button"
          className="touch-btn touch-jump"
          aria-label="Lompat"
          onPointerDown={(event) => {
            event.preventDefault();
            engineRef.current?.pressJump();
          }}
          onPointerUp={() => engineRef.current?.releaseJump()}
          onPointerCancel={() => engineRef.current?.releaseJump()}
          onPointerLeave={() => engineRef.current?.releaseJump()}
          onContextMenu={(event) => event.preventDefault()}
        >
          Lompat
        </button>
      </div>
    </>
  );
});

export default GameCanvas;
