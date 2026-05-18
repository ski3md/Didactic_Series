// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

type ImportRun = {
  status: number | null;
  stdout: string;
  stderr: string;
  workspace: string;
  indexPath: string;
  publicIndexPath: string;
  summary: {
    output: string;
    sourceRoots: string[];
    missingRoots?: string[];
    imageCount: number;
    sourceFileCounts: Record<string, number>;
    rootCounts: Record<string, number>;
    specialtyCounts: Record<string, number>;
  };
  index?: {
    imageCount: number;
    missingRoots?: string[];
    images: Array<{
      sourcePath: string;
      sourceRelativePath: string;
      sourceDocument: string;
      sourceRoot: string;
      sourceCollection: string;
      sourceType: string;
      sha1: string;
      caption?: string;
    }>;
  };
  publicIndex?: {
    imageCount: number;
    missingRoots?: string[];
    images: Array<{
      sourcePath: string;
      sourceRelativePath: string;
      sourceDocument: string;
      sourceRoot: string;
      sourceCollection: string;
      sourceType: string;
      sha1: string;
      caption?: string;
    }>;
  };
};

const scriptPath = fileURLToPath(new URL('../../../scripts/import_apcpboards_reference_images.cjs', import.meta.url));
const tempRoots: string[] = [];

const cleanupTempRoots = () => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop();
    if (!root) continue;
    rmSync(root, { recursive: true, force: true });
  }
};

afterEach(() => {
  cleanupTempRoots();
});

const makeTempRoot = (prefix: string) => {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(root);
  return root;
};

const writeBinary = (filePath: string, bytes: Buffer | string) => {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, bytes);
};

const runImport = ({
  workspace,
  roots,
  extraArgs = [],
  env = {},
}: {
  workspace: string;
  roots: string[];
  extraArgs?: string[];
  env?: NodeJS.ProcessEnv;
}): ImportRun => {
  const indexPath = path.join(workspace, 'src', 'content', 'images', 'apcpboards_reference_images.json');
  const publicIndexPath = path.join(workspace, 'public', 'reference-images', 'apcpboards_reference_images.json');
  const result = spawnSync(
    process.execPath,
    [scriptPath, '--roots', roots.join(path.delimiter), '--include-all-images', '--max-depth=4', '--max-files=all', ...extraArgs],
    {
      cwd: workspace,
      encoding: 'utf8',
      env: {
        ...process.env,
        ...env,
      },
    }
  );

  const parsed = result.stdout.trim() ? (JSON.parse(result.stdout.trim()) as ImportRun['summary']) : undefined;
  if (!parsed) {
    throw new Error(`Expected JSON stdout from import script, received: ${result.stdout}`);
  }

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    workspace,
    indexPath,
    publicIndexPath,
    summary: parsed,
    index: fsExists(indexPath) ? readJson(indexPath) : undefined,
    publicIndex: fsExists(publicIndexPath) ? readJson(publicIndexPath) : undefined,
  };
};

const readJson = <T>(filePath: string) => JSON.parse(readFileSync(filePath, 'utf8')) as T;

describe('apcp boards reference image extraction', () => {
  it('deduplicates identical content by sha1 while preserving the handoff artifact', () => {
    const workspace = makeTempRoot('didactic-apcp-dedupe-workspace-');
    const localRoot = makeTempRoot('didactic-apcp-dedupe-local-');
    const externalRoot = makeTempRoot('didactic-apcp-dedupe-external-');

    writeBinary(path.join(localRoot, 'breast', 'shared-figure-a.jpg'), Buffer.from('same-image-bytes'));
    writeBinary(path.join(externalRoot, 'general', 'shared-figure-b.jpg'), Buffer.from('same-image-bytes'));

    const run = runImport({ workspace, roots: [localRoot, externalRoot] });

    expect(run.status).toBe(0);
    expect(run.summary.output).toBe(path.relative(workspace, run.indexPath));
    expect(run.summary.imageCount).toBe(1);
    expect(run.summary.sourceFileCounts[localRoot]).toBe(1);
    expect(run.summary.sourceFileCounts[externalRoot]).toBe(1);
    expect(run.index?.imageCount).toBe(1);
    expect(run.publicIndex?.imageCount).toBe(1);
    expect(run.index?.images?.[0]).toMatchObject({
      sourcePath: path.join(localRoot, 'breast', 'shared-figure-a.jpg'),
      sourceRoot: localRoot,
      sourceCollection: path.basename(localRoot),
      sourceType: 'local-image',
    });
    expect(run.index?.images?.[0]?.sha1).toHaveLength(40);
  });

  it('skips inaccessible roots safely while still producing the report artifact', () => {
    const workspace = makeTempRoot('didactic-apcp-missing-workspace-');
    const validRoot = makeTempRoot('didactic-apcp-missing-valid-');
    const missingRoot = path.join(workspace, 'missing-backup-root');

    writeBinary(path.join(validRoot, 'hematopathology', 'fallback-image.jpg'), Buffer.from('unique-image-bytes'));

    const run = runImport({ workspace, roots: [validRoot, missingRoot] });

    expect(run.status).toBe(1);
    expect(run.summary.missingRoots).toContain(missingRoot);
    expect(run.summary.imageCount).toBe(1);
    expect(run.summary.sourceFileCounts[validRoot]).toBe(1);
    expect(run.index?.missingRoots).toContain(missingRoot);
    expect(run.publicIndex?.imageCount).toBe(1);
  });

  it('preserves provenance for repo-local and external roots independently', () => {
    const workspace = makeTempRoot('didactic-apcp-provenance-workspace-');
    const repoLocalRoot = path.join(workspace, 'repo-local-root');
    const externalRoot = makeTempRoot('didactic-apcp-provenance-external-');

    writeBinary(path.join(repoLocalRoot, 'src', 'teaching', 'local-case-page1.jpg'), Buffer.from('local-root-bytes'));
    writeBinary(path.join(externalRoot, 'outbound', 'external-case-page2.jpg'), Buffer.from('external-root-bytes'));

    const run = runImport({ workspace, roots: [repoLocalRoot, externalRoot] });

    expect(run.status).toBe(0);
    expect(run.summary.imageCount).toBe(2);
    expect(new Set(run.index!.images.map((image) => image.sourceRoot))).toEqual(new Set([repoLocalRoot, externalRoot]));

    for (const image of run.index!.images) {
      expect(image.sourcePath).toBeTruthy();
      expect(image.sourceRelativePath).toBeTruthy();
      expect(image.sourceDocument).toBeTruthy();
      expect(image.sourceCollection).toBe(path.basename(image.sourceRoot));
      expect(image.sourceType).toBe('local-image');
      expect(image.sha1).toMatch(/^[a-f0-9]{40}$/);
      expect(image.caption).toContain('Review morphology');
    }

    expect(run.index!.images.some((image) => image.sourceRoot === repoLocalRoot && image.sourceRelativePath === 'src/teaching/local-case-page1.jpg')).toBe(true);
    expect(run.index!.images.some((image) => image.sourceRoot === externalRoot && image.sourceRelativePath === 'outbound/external-case-page2.jpg')).toBe(true);
  });

  it('fails closed when a source changes between hashing and copy time', () => {
    const workspace = makeTempRoot('didactic-apcp-drift-workspace-');
    const root = makeTempRoot('didactic-apcp-drift-root-');
    const sourcePath = path.join(root, 'pathology', 'drift-source.jpg');
    writeBinary(sourcePath, Buffer.from('original-bytes'));

    const hookPath = path.join(workspace, 'drift-guard-hook.cjs');
    writeBinary(
      hookPath,
      `
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const originalReadFileSync = fs.readFileSync.bind(fs);
const originalCopyFileSync = fs.copyFileSync.bind(fs);
const digests = new Map();
const sha1 = (buffer) => crypto.createHash('sha1').update(buffer).digest('hex');

fs.readFileSync = function patchedReadFileSync(filePath, options) {
  const result = originalReadFileSync(filePath, options);
  if (typeof filePath === 'string' && filePath.endsWith('.jpg') && Buffer.isBuffer(result)) {
    digests.set(path.resolve(filePath), sha1(result));
  }
  return result;
};

fs.copyFileSync = function patchedCopyFileSync(sourcePath, outputPath) {
  const absoluteSource = path.resolve(sourcePath);
  if (process.env.TEST_INDUCE_DRIFT === '1' && absoluteSource.endsWith('drift-source.jpg')) {
    fs.writeFileSync(absoluteSource, Buffer.from('mutated-during-copy'));
  }

  const before = digests.get(absoluteSource);
  const current = sha1(originalReadFileSync(absoluteSource));
  if (before && before !== current) {
    throw new Error(\`source drift detected for \${absoluteSource}\`);
  }

  return originalCopyFileSync(sourcePath, outputPath);
};
`
    );

    const result = spawnSync(
      process.execPath,
      [scriptPath, '--roots', root, '--include-all-images', '--max-depth=4', '--max-files=all'],
      {
        cwd: workspace,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_OPTIONS: `--require ${hookPath}`,
          TEST_INDUCE_DRIFT: '1',
        },
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('source drift detected');
    expect(fsExists(path.join(workspace, 'src', 'content', 'images', 'apcpboards_reference_images.json'))).toBe(false);
  });
});

function fsExists(filePath: string) {
  try {
    readFileSync(filePath);
    return true;
  } catch {
    return false;
  }
}
