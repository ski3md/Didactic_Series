# PubMed / PMC Open Access Sign-Out Image Acquisition

This workflow searches PubMed Central Open Access articles for representative diagnostic figures, extracts the image from the PMC OA package, and writes it to the expected dashboard path.

It intentionally does **not** scrape arbitrary PubMed publisher pages. PubMed records may link to articles that are free to read but not licensed for reuse. The script only imports article packages exposed through the PMC Open Access Web Service.

## Plan Queries

Review the generated case-specific PubMed/PMC queries before downloading:

```bash
npm run signout:acquire-pubmed-oa-images -- --plan-only
```

Report:

```text
src/content/signout_sims/pubmed_oa_image_acquisition_report.json
```

## Dry Run

Dry run requires a cached PMC OA tarball to score figures without importing them. It will not write dashboard images.

```bash
npm run signout:acquire-pubmed-oa-images -- --dry-run --case-id gi-colon-adenocarcinoma-resection
```

## Import

```bash
NCBI_EMAIL="you@example.com" npm run signout:acquire-pubmed-oa-images -- --limit-cases 5
```

Useful options:

```text
--case-id <caseId>          Import one missing case.
--limit-cases <n>           Limit the batch.
--retmax <n>                Number of PMC search results per case. Default: 8.
--max-articles <n>          Max OA articles examined per case. Default: 4.
--replace                   Replace existing local images.
--commercial-only           Exclude non-commercial Creative Commons licenses.
--email <email>             Adds NCBI email parameter.
--api-key <key>             Adds NCBI API key parameter.
--delay-ms <ms>             Delay between NCBI/PMC calls. Default: 450.
```

## Selection Logic

For each missing case, the script:

1. Builds a PMC query from the case title, site, specimen type, stain, expected diagnosis, and diagnostic language.
2. Searches the `pmc` database with `open access[filter]`.
3. Calls the PMC OA Web Service for each candidate PMCID.
4. Accepts only records with reusable OA package links and a machine-readable license.
5. Downloads the OA `tgz` package, extracts the NXML and media files, and scores each figure caption.
6. Copies the highest-scoring figure image into `public/reference-library/...`.
7. Writes article, license, figure, caption, and source provenance to the report.

## Manual Review Still Required

The script can find and extract candidate images, but diagnostic correctness still requires pathologist review. Review every imported image before using it for teaching, especially when the target entity has common overlapping terms such as carcinoma, adenocarcinoma, lymphoma, or high-grade.

Sources used for this implementation:

- [PMC Open Access Subset](https://pmc.ncbi.nlm.nih.gov/tools/openftlist/)
- [PMC OA Web Service API](https://pmc.ncbi.nlm.nih.gov/tools/oa-service/)
- [NCBI E-utilities documentation](https://www.ncbi.nlm.nih.gov/books/NBK25501/)
