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
| `--bg` | `#F7F8FA` | app background |
| `--surface` | `#FFFFFF` | primary cards and panels |
| `--surface-muted` | `#F1F5F9` | secondary surfaces and neutral containers |
| `--surface-info` | `#EFF6FF` | proxy/info note surfaces |
| `--surface-success` | `#EAF7EF` | trainer-safe/source-backed note surfaces |
| `--surface-warning` | `#FFF7E6` | simplified/study-only note surfaces |
| `--surface-danger` | `#FEF2F2` | blocked/unsupported note surfaces |
| `--border` | `#E2E8F0` | standard borders and dividers |
| `--border-strong` | `#CBD5E1` | emphasized borders and selected controls |
| `--text-primary` | `#0F172A` | main content |
| `--text-secondary` | `#475569` | supporting text |
| `--text-muted` | `#64748B` | helper text and inactive labels |
| `--brand-accent` | `#C96A1B` | refined burnt orange accent |
| `--brand-accent-hover` | `#A95516` | primary hover state |
| `--brand-accent-soft` | `#FFF3E8` | selected pills and soft accent backgrounds |
| `--action-call` | `#16A34A` | call / passive continue |
| `--action-jam` | `#D96B1D` | jam / aggressive all-in |
| `--action-raise` | `#D96B1D` | raise |
| `--action-threebet` | `#2563EB` | 3-bet |
| `--action-fold` | `#E2E8F0` | fold cell background |
| `--warning` | `#D97706` | study-only / caution |
| `--danger` | `#DC2626` | blocked / destructive |
| `--success` | `#0F9D58` | source-backed success state |
| `--info` | `#2563EB` | proxy/info state |

## Spacing scale

The app now prefers tighter spacing than the previous prototype.

Guidelines:

- outer section padding: compact, not hero-sized
- card padding: `16px-20px` for primary workflow cards
- chip/badge gaps: `6px-8px`
- setup control rows: single-line on desktop when possible
- large empty vertical separators: avoid

## Card rules

- White card surfaces with cool neutral separators
- Standard borders use `#E2E8F0`; stronger separation uses `#CBD5E1`
- Soft shadow, not dramatic elevation:
  - `0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)`
- Cards should frame tools, not become decoration
- Primary workflow cards can be slightly elevated
- Secondary panels should use muted surfaces or subtle borders instead of height
- Beige / tan fills are intentionally removed from page shells, panels, and note boxes

## Button rules

- Primary CTA: `#C96A1B`
- Primary hover: `#A95516`
- Trainer-safe action buttons must read clearly at a glance
- Study-only / blocked actions should be disabled with honest copy
- Do not oversize buttons when a compact row works
- On mobile, sticky primary actions are preferred over long trailing layouts
- Secondary buttons should stay white with `#CBD5E1` borders and dark slate text

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
- white chart surface inside a light neutral outer container
- aggressive cells use refined orange, call cells use green, 3-bet uses blue, fold uses cool grey

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

## Navigation and notes surfaces

- Sidebar background: `#FFFFFF`
- Sidebar border: `#E2E8F0`
- Active nav item:
  - background `#FFF3E8`
  - text/icon `#9A4D12`
- Inactive nav item:
  - text/icon `#475569`
  - hover background `#F8FAFC`

Notes and status surfaces use semantic tints instead of beige:

- default note: white
- info/proxy note: `#EFF6FF`
- source-backed/safe note: `#EAF7EF`
- simplified/study-only note: `#FFF7E6`
- blocked/unsupported note: `#FEF2F2`

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
