#!/usr/bin/env bash
# Jalankan gate CI yang sama dengan .github/workflows/ci.yml, tanpa GitHub.
set -euo pipefail

if [ ! -f package.json ]; then
  echo "GAGAL: package.json belum ada (milik Ravi). Pipeline belum bisa jalan." >&2
  exit 1
fi

if [ ! -f package-lock.json ]; then
  echo "GAGAL: package-lock.json belum ada. npm ci butuh lockfile." >&2
  exit 1
fi

rm -rf out

echo "== npm ci"
npm ci

echo "== npm run check"
npm run check

echo "== verify-static-export"
node scripts/verify-static-export.mjs

echo "== npm run build"
npm run build

if [ ! -f out/index.html ]; then
  echo "GAGAL: out/index.html tidak ada setelah build." >&2
  exit 1
fi

echo "OK: gate lokal lulus, out/index.html ada."
