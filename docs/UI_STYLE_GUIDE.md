# UI Style Guide

Date: 2026-05-12  
Branch: `fix/master-range-ui-hardening`

## Design intent

MTT Coach should feel like a serious poker training tool:

- compact
- readable
- low-friction
- honest about data confidence
- fast on desktop and mobile

The redesign intentionally avoids oversized hero cards, decorative copy blocks, and loose vertical spacing.

## Core tokens

Defined from `client/src/index.css`.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#f7f5f1` | app background |
| `--surface` | `#fffdfa` | primary cards |
| `--surface-muted` | `#f4f1eb` | muted panels and chips |
| `--border` | `#e4ddd2` | dividers and outlines |
| `--text-primary` | `#1f2933` | main content |
| `--text-secondary` | `#5f6c7c` | supporting text |
| `--brand-accent` | `#d46f2a` | burnt orange accent |
| `--action-call` | `#16a34a` | call / positive |
| `--action-jam` | `#ea580c` | jam / aggressive all-in |
| `--action-raise` | `#dc2626` | raise |
| `--action-threebet` | `#2563eb` | 3-bet |
| `--action-fold` | `#94a3b8` | fold |
| `--warning` | `#d97706` | study-only / caution |
| `--danger` | `#dc2626` | blocked / destructive |

## Spacing scale

The app now prefers tighter spacing than the previous prototype.

Guidelines:

- outer section padding: compact, not hero-sized
- card padding: `16px-20px` for primary workflow cards
- chip/badge gaps: `6px-8px`
- setup control rows: single-line on desktop when possible
- large empty vertical separators: avoid

## Card rules

- White or very light cream surfaces only
- Subtle warm-gray border
- Soft shadow, not dramatic elevation
- Cards should frame tools, not become decoration
- Primary workflow cards can be slightly elevated
- Secondary panels should use muted surfaces or subtle borders instead of height

## Button rules

- Primary CTA: burnt orange
- Trainer-safe action buttons must read clearly at a glance
- Study-only / blocked actions should be disabled with honest copy
- Do not oversize buttons when a compact row works
- On mobile, sticky primary actions are preferred over long trailing layouts

## Chart viewer rules

- Header, setup, title, badges, and actions should live inside one compact chart panel
- Remove marketing/helper filler copy
- Matrix should be smaller and centered
- No oversized setup blocks
- Spot notes collapsed by default
- Train button only appears enabled when `trainerAllowed=true`

Desktop target:

- matrix max width roughly `680px-760px`
- compact legend
- less vertical gap between controls and matrix

Mobile target:

- no horizontal scroll
- reduced padding
- wrapped compact controls
- bottom nav must not cover important actions

## Trainer rules

- Trainer is a focused tool, not a document
- Header compact, with trust badge and setup summary
- Question card centered and visible without excess scroll
- After answer: result + chart + concise cue
- Advanced notes collapsed
- Blocked charts show explicit study-only state, not silent fallback

## Notes rules

Default visible chart note content:

1. one-line default
2. one-line common mistake
3. one-line drill cue

Advanced detail must be collapsed.

Avoid generic filler like:

- "Classify the hand quickly"
- "Respect opener strength"
- "Do not punt"
- vague blocker language without spot context

For non-source-backed charts:

- clearly label as simplified/proxy study-only
- never sound more certain than the source supports

For unsupported charts:

- no strategic coaching copy
- only warning / review-needed language

## Hand logging rules

- Required fields first
- Optional streets collapsed
- Optional review/tagging collapsed
- Save action always reachable
- Modal header and footer must not overlap content
- Exact card picker remains intact

Required quick-log order:

1. Hero hand exact cards
2. Stack input + quick chips
3. Spot type
4. Hero position
5. Villain/open position
6. Preflop line
7. Save action

## Responsive rules

Required verification targets:

- desktop 100%
- desktop 110%
- laptop-width desktop
- narrow mobile width
- iPhone-style mobile width

Mobile acceptance:

- no horizontal page scroll
- primary actions remain reachable
- notes collapsed by default
- dropdowns and modals stay usable

## Trust-language rules

The UI must distinguish:

- `Source-backed`
- `Simplified Population - study only`
- `Proxy - study only`
- `Unsupported`

Never imply trainer precision when the source status does not support it.
