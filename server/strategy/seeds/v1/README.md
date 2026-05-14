Typed strategy seed files live here.

Rules for this folder:

- Import only manually reviewed CSV or JSON range rows.
- Do not place OCR, screenshot-derived, color-derived, or PDF-extracted chart dumps here.
- Keep rows grouped by scenario family and stack bucket.
- Every reviewed node should cover all 169 hands explicitly once ranges are expanded.
- If a node is not manually reviewed yet, leave it out of the pack instead of guessing.

Expected manifest-driven file format:

- `manifest.json` lists the CSV/JSON files to import.
- CSV/JSON rows must include:
  - `version`
  - `stackBucket`
  - `playerCount`
  - `scenarioFamily`
  - `heroPosition`
  - `villainPosition` or `villainGroup`
  - `action`
  - `rangeNotation`
  - `priority`
  - `notes`
  - `reviewed`
