import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { checkConfigSource } from '../scripts/verify-static-export.mjs';
import { parseYaml } from './yaml-lite.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = join(root, '.github', 'workflows', 'ci.yml');
const scriptPath = join(root, 'scripts', 'verify-static-export.mjs');
const localGatePath = join(root, 'scripts', 'ci-local.sh');

const workflowText = readFileSync(workflowPath, 'utf8');
const workflow = parseYaml(workflowText);
const buildSteps = workflow.jobs.build.steps;
const deploySteps = workflow.jobs.deploy.steps;
const buildRuns = buildSteps.filter((step) => step.run).map((step) => step.run);

function collectUses() {
  return Object.values(workflow.jobs).flatMap((job) =>
    job.steps.filter((step) => step.uses).map((step) => step.uses),
  );
}

function runNode(args) {
  try {
    const stdout = execFileSync(process.execPath, args, { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return {
      status: error.status ?? 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    };
  }
}

function withTempConfig(name, source) {
  const dir = mkdtempSync(join(tmpdir(), 'ci-export-'));
  writeFileSync(join(dir, name), source);
  return dir;
}

test('workflow punya dua job: build lalu deploy', () => {
  assert.equal(workflow.name, 'ci');
  assert.deepEqual(Object.keys(workflow.jobs), ['build', 'deploy']);
  assert.equal(workflow.jobs.build['runs-on'], 'ubuntu-latest');
  assert.equal(workflow.jobs.build['timeout-minutes'], 15);
});

test('workflow jalan di PR ke main, push main, dan manual', () => {
  assert.deepEqual(workflow.on.pull_request.branches, ['main']);
  assert.deepEqual(workflow.on.push.branches, ['main']);
  assert.ok('workflow_dispatch' in workflow.on);
});

test('build menjalankan npm ci, check, gate export, lalu build sesuai urutan', () => {
  assert.deepEqual(buildRuns, [
    'npm ci',
    'npm run check',
    'node scripts/verify-static-export.mjs',
    'npm run build',
  ]);
});

test('Node dipasang dari env NODE_VERSION dengan cache npm', () => {
  assert.equal(workflow.env.NODE_VERSION, '20');
  const setup = buildSteps.find((step) => step.uses.startsWith('actions/setup-node'));
  assert.equal(setup.with['node-version'], '${{ env.NODE_VERSION }}');
  assert.equal(setup.with.cache, 'npm');
});

test('artefak yang diunggah adalah out/ dari Next static export', () => {
  const upload = buildSteps.find((step) => step.uses.startsWith('actions/upload-pages-artifact'));
  assert.equal(upload.with.path, 'out');
  assert.match(upload.if, /refs\/heads\/main/);
  assert.match(upload.if, /event_name == 'push'/);
});

test('deploy hanya dari main setelah build lulus', () => {
  const deploy = workflow.jobs.deploy;
  assert.equal(deploy.needs, 'build');
  assert.match(deploy.if, /refs\/heads\/main/);
  assert.match(deploy.if, /event_name == 'push'/);
  const step = deploySteps.find((item) => item.uses.startsWith('actions/deploy-pages'));
  assert.equal(step.id, 'deployment');
});

test('izin workflow minimal, tanpa secret tersimpan', () => {
  assert.deepEqual(workflow.permissions, { contents: 'read' });
  assert.deepEqual(workflow.jobs.deploy.permissions, { pages: 'write', 'id-token': 'write' });
  assert.ok(!workflowText.includes('secrets.'));
  assert.ok(!workflowText.includes('write-all'));
  assert.ok(!workflowText.includes('pull_request_target'));
});

test('setiap step tanpa pengecualian diam-diam', () => {
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) {
      assert.notEqual(step['continue-on-error'], true);
      if (step.run) assert.ok(!step.run.includes('|| true'));
    }
  }
});

test('semua action dipin ke tag versi utama', () => {
  const uses = collectUses();
  assert.ok(uses.length >= 5);
  for (const action of uses) {
    assert.match(action, /^[\w-]+\/[\w-]+@v\d+(\.\d+)*$/, `belum dipin: ${action}`);
  }
});

test('gate export menerima config statis yang benar', () => {
  const dir = withTempConfig(
    'next.config.ts',
    [
      "const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';",
      'const nextConfig = {',
      "  output: 'export',",
      '  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? \'\',',
      '  assetPrefix: basePath || undefined,',
      '};',
      'export default nextConfig;',
      '',
    ].join('\n'),
  );

  try {
    const result = runNode([scriptPath, dir]);
    assert.equal(result.status, 0);
    assert.match(result.stdout, /^OK: .*next\.config\.ts siap untuk export statis/m);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('gate export menolak build yang butuh server', () => {
  const dir = withTempConfig(
    'next.config.ts',
    'const nextConfig = { reactStrictMode: true };\nexport default nextConfig;\n',
  );

  try {
    const result = runNode([scriptPath, dir]);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /output: 'export' tidak ada/);
    assert.match(result.stderr, /basePath tidak membaca/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('gate export menolak basePath hardcoded', () => {
  const problems = checkConfigSource(
    "const nextConfig = { output: 'export', basePath: '/bangun-game' };\n",
  );
  assert.deepEqual(problems, [
    'basePath tidak membaca process.env.NEXT_PUBLIC_BASE_PATH, aset akan 404 di /<repo>/ pada GitHub Pages.',
  ]);
});

test('skrip gate lokal memakai perintah yang sama dan berhenti saat gagal', () => {
  const gate = readFileSync(localGatePath, 'utf8');
  assert.match(gate, /set -euo pipefail/);

  const order = ['npm ci', 'npm run check', 'node scripts/verify-static-export.mjs', 'npm run build'];
  let cursor = -1;
  for (const command of order) {
    const next = gate.indexOf(command, cursor + 1);
    assert.ok(next > cursor, `${command} tidak ada atau urutannya salah`);
    cursor = next;
  }

  assert.match(gate, /package\.json belum ada/);
  assert.match(gate, /out\/index\.html/);
  assert.doesNotThrow(() => execFileSync('bash', ['-n', localGatePath], { encoding: 'utf8' }));
});
