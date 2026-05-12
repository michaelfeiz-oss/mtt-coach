# Source Panel Labels

## Why grouped labels exist

Some source-backed preflop charts in MTT Coach come from PDF panels that group
two seats together or use a different seat name than the app.

Examples from the source PDFs include:

- `UTG+1/+2 vs UTG RFI`
- `LJ/HJ vs UTG RFI`
- `CO vs LJ/HJ RFI`
- `BTN vs LJ/HJ RFI`
- `UTG+2 RFI`
- `Lojack RFI`

The app still needs a single navigable chart selector, so these panels are
displayed using the app's existing seat labels such as `UTG+1`, `MP`, `HJ`, or
`CO vs MP`.

## What the new labels mean

Grouped-source-backed charts now expose extra metadata so the UI can be more
honest about the source panel that backs the chart:

- `sourcePanelLabel`
- `sourcePanelGroup`
- `appDisplayLabel`
- `sourceCoverageNote`

This lets the app say things like:

- `Source panel: LJ/HJ vs UTG RFI`
- `Grouped source panel: LJ/HJ`

without changing the underlying chart actions or trainer gate.

## Example mappings

| App label | Source panel label | Why the note exists |
| --- | --- | --- |
| `UTG+1 vs UTG` | `UTG+1/+2 vs UTG RFI` | The source panel groups `UTG+1` and `UTG+2`. |
| `HJ vs UTG` | `LJ/HJ vs UTG RFI` | The source panel groups `LJ` and `HJ`. |
| `CO vs MP` | `CO vs LJ/HJ RFI` | The app uses `MP`, but the source panel groups `LJ/HJ`. |
| `HJ RFI` | `Lojack RFI` | The app uses `HJ`, but the source panel is named `Lojack`. |
| `MP RFI` | `UTG+2 RFI` | The app uses `MP`, but the source panel is named `UTG+2`. |

## UI behavior

- **Chart Viewer:** shows the grouped-source note near the source badge.
- **Trainer:** keeps the grouped-source note in expanded source detail only.
- **Notes:** uses a subtle `Source-backed grouped panel` note where relevant.

## Important warning

Grouped source panels should not be overinterpreted as seat-specific solver
outputs. A grouped source-backed chart is still backed by the reviewed PDF
source, but the source panel may cover more than one seat label or use broader
seat naming than the app UI.

That means the chart can remain trainer-safe when it matches its imported
source, while still carrying a small note that the original panel was grouped
or differently labeled.
