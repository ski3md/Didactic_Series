# Next 10 Migration Steps

This plan defines the next safe tranche of work for the Downloads-derived educational corpus already staged under `src/content/downloads_imports`.

## The 10 steps

1. Validate the staged Downloads imports so downstream work is based on stable normalized data.
2. Profile each source repository by lectures, tutorials, algorithms, images, MCQs, flashcards, categories, and entities.
3. Rank source repositories for promotion priority using pathology-domain fit, data quality, and content yield.
4. Build a lecture promotion queue, prioritizing clean core-principles didactic overviews.
5. Build a tutorial promotion queue, balancing ABPath breadth with CP and granulomatous specificity.
6. Build an algorithm promotion queue and explicitly hold low-alignment content until a matching UI exists.
7. Build an image promotion queue, prioritizing granulomatous entities that fit the current app.
8. Generate facet manifests for source, category, and entity filters to support safe UI promotion.
9. Write integration recommendations in the order most compatible with the current product.
10. Publish the roadmap and outputs as a repeatable batch artifact.

## Batch implementation

The batch job is:

```bash
npm run batch:next-10
```

It writes its outputs to:

- `src/content/downloads_imports/planning/validation.json`
- `src/content/downloads_imports/planning/source_profiles.json`
- `src/content/downloads_imports/planning/promotion_priority.json`
- `src/content/downloads_imports/planning/promotion_queues.json`
- `src/content/downloads_imports/planning/facet_manifest.json`
- `src/content/downloads_imports/planning/integration_recommendations.json`
- `src/content/downloads_imports/planning/next_ten_steps.json`
- `src/content/downloads_imports/planning/NEXT_TEN_STEPS_BATCH_REPORT.md`

## Why this order

- It preserves the current app behavior and imported raw data.
- It ranks promotion work by pathology fit instead of file availability alone.
- It gives the next implementation pass concrete queues instead of another broad inventory run.
