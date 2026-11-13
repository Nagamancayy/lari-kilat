"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="center-screen">
      <div className="dialog" role="alert">
        <p className="eyebrow">Galat</p>
        <h1>Ada yang gagal dimuat</h1>
        <p className="muted">Muat ulang halaman. Kalau tetap gagal, buka lewat browser lain.</p>
        <div className="button-row">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Coba lagi
          </button>
          <Link className="btn btn-ghost" href="/">
            Menu
          </Link>
        </div>
      </div>
    </main>
  );
}
