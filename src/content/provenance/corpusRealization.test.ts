import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type CorpusRecord = {
  file_path: string;
  file_type?: string;
  provenance?: {
    source?: string;
  };
};

type CorpusReport = {
  generated_at?: string;
  summary: {
    total_files: number;
    counts_by_status: Record<string, number>;
    counts_by_file_type: Record<string, number>;
    promoted_surface_count: number;
  };
  records: CorpusRecord[];
};

type AssetRegistry = {
  assets: CorpusRecord[];
};

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8')) as T;

const report = readJson<CorpusReport>('../../../reports/corpus_realization_report.json');
const workstationIndex = readJson<CorpusReport>('./workstation_corpus_index.json');
const assetRegistry = readJson<AssetRegistry>('./didactics_asset_registry.json');
const driftContract = readJson<{
  provenanceContract: {
    requiredProvenanceSource: string;
    forbiddenPathFragments: string[];
    allowedSelfReferenceFiles: string[];
  };
}>('../contracts/repoDriftContract.json');

const toPaths = (records: CorpusRecord[]) => records.map((record) => record.file_path);
const countBy = <T>(values: T[], toKey: (value: T) => string | undefined) =>
  values.reduce<Record<string, number>>((acc, value) => {
    const key = toKey(value);
    if (!key) {
      return acc;
    }
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

describe('corpus realization', () => {
  it('keeps the report, workstation index, and asset registry aligned on local-first provenance', () => {
    const reportPaths = toPaths(report.records);
    const workstationPaths = toPaths(workstationIndex.records);
    const registryPaths = toPaths(assetRegistry.assets);

    expect(report.summary.total_files).toBe(report.records.length);
    expect(workstationIndex.summary.total_files).toBe(workstationIndex.records.length);
    expect(assetRegistry.assets).toHaveLength(report.records.length);

    expect(reportPaths).toEqual(workstationPaths);
    expect(reportPaths).toEqual(registryPaths);
    expect(
      report.records.every(
        (record) => record.provenance?.source === driftContract.provenanceContract.requiredProvenanceSource
      )
    ).toBe(true);
  });

  it('recognizes the realized roots and image-bearing locations from the local corpus', () => {
    const reportPaths = toPaths(report.records);
    const expectedRoots = [
      'assets/images',
      'src/content/downloads_imports',
      'src/content/provenance',
      'src/content/staging',
    ];

    for (const root of expectedRoots) {
      expect(reportPaths.some((path) => path === root || path.startsWith(`${root}/`))).toBe(true);
    }

    const countsByFileType = countBy(report.records, (record) => record.file_type);
    const imageRecords = report.records.filter((record) => record.file_type === 'image');
    expect(report.summary.counts_by_file_type).toMatchObject(countsByFileType);
    expect(imageRecords.length).toBe(countsByFileType.image);
    expect(imageRecords.length).toBeGreaterThan(0);
    expect(
      imageRecords.every((record) =>
        /\.(png|jpe?g|gif|tiff?|svg|webp)$/i.test(record.file_path)
      )
    ).toBe(true);
  });

  it('skips backup-like roots safely without polluting the realized corpus', () => {
    const reportPaths = toPaths(report.records);
    const backupLikePaths = reportPaths.filter((path) =>
      driftContract.provenanceContract.forbiddenPathFragments.some((fragment) =>
        new RegExp(`(?:^|/)${fragment}(?:/|$)`, 'i').test(path)
      )
    );
    const selfReferences = reportPaths.filter((path) =>
      driftContract.provenanceContract.allowedSelfReferenceFiles.includes(path)
    );

    expect(backupLikePaths).toEqual([]);
    expect(selfReferences).toEqual(
      expect.arrayContaining(driftContract.provenanceContract.allowedSelfReferenceFiles)
    );
    expect(report.summary.total_files).toBeGreaterThan(0);
    expect(report.summary.promoted_surface_count).toBe(report.summary.counts_by_status.promoted);
    expect(report.summary.counts_by_status.promoted).toBeLessThanOrEqual(report.summary.total_files);
  });
});
