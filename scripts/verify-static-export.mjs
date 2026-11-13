import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CANDIDATES = [
  'next.config.ts',
  'next.config.mts',
  'next.config.js',
  'next.config.mjs',
  'next.config.cjs',
];

const BASE_PATH_PATTERN = /basePath\s*:\s*[\w.]*process\.env\.NEXT_PUBLIC_BASE_PATH/;
const EXPORT_PATTERN = /output\s*:\s*['"]export['"]/;

export function findConfig(dir) {
  for (const name of CANDIDATES) {
    const file = join(dir, name);
    if (existsSync(file)) return file;
  }
  return null;
}

export function checkConfigSource(source) {
  const problems = [];

  if (!EXPORT_PATTERN.test(source)) {
    problems.push("output: 'export' tidak ada, build Next.js akan butuh server dan upload ke Pages gagal.");
  }
  if (!BASE_PATH_PATTERN.test(source)) {
    problems.push('basePath tidak membaca process.env.NEXT_PUBLIC_BASE_PATH, aset akan 404 di /<repo>/ pada GitHub Pages.');
  }

  return problems;
}

function main() {
  const dir = resolve(process.argv[2] ?? process.cwd());
  const file = findConfig(dir);

  if (!file) {
    console.error(`GAGAL: next.config.* tidak ditemukan di ${dir}`);
    console.error('Pipeline butuh konfigurasi statis untuk GitHub Pages.');
    process.exitCode = 1;
    return;
  }

  const problems = checkConfigSource(readFileSync(file, 'utf8'));
  if (problems.length > 0) {
    console.error(`GAGAL: ${file}`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(`OK: ${file} siap untuk export statis di GitHub Pages.`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
