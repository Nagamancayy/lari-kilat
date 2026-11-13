import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="center-screen">
      <div className="dialog" role="alert">
        <p className="eyebrow">404</p>
        <h1>Halaman tidak ada</h1>
        <p className="muted">Alamat yang dibuka tidak dikenal. Kembali ke menu untuk mulai main.</p>
        <Link className="btn btn-primary" href="/">
          Ke menu
        </Link>
      </div>
    </main>
  );
}
