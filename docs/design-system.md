# Remindo Design System — Warm Botanical

The working reference for building UI in this app. It supersedes the generated
`remindo-design-system/` package that seeded it: every token in that package's
`globals.css` is now in `src/index.css`, and this file carries the reasoning
that CSS cannot express, including the places we deliberately diverged.

**Source of truth for values is `src/index.css`.** Never hardcode a colour.

---

## 1. Product tone

Remindo nags on purpose. The system exists to make escalation legible without
making the app feel like an alarm — a persistent friend, not a red warning
light. Users open this when they are already behind on something.

Practically: the baseline is calm and recessive, and loudness is *earned* by
state. Warm forest sage, bone white, olive, terracotta clay. No stark error
reds, no flashing.

---

## 2. The dual-axis rule

This is the load-bearing law of the system. Priority and status coexist on
every card and **must never share a visual treatment**, or a card collapses
into a single ambiguous signal.

| Axis | What it means | Treatment |
|---|---|---|
| **Priority** | How often we'll nag (`normal` / `important` / `urgent`) | **Solid pill**, plus the card's left stripe |
| **Status** | Where the task is in its lifecycle | **Soft tinted pill**, low contrast |

Corollary: an urgent task that is already `Done` must not shout. Status wins
the eye once a task is resolved.

Escalation policy the UI surfaces verbatim (mirrors the API's `REMINDER_POLICY`
in `src/lib/labels.ts` — keep them in sync):

| Priority | Follow-ups | Interval | Snooze |
|---|---|---|---|
| Normal | 1 | 15 min | 30 min |
| Important | 2 | 10 min | 20 min |
| Urgent | 3 | 5 min | 10 min |

---

## 3. Tokens

Defined in `src/index.css` under `:root` / `.dark`, exposed to Tailwind via
`@theme inline`. Use the utility, not the variable: `bg-status-ack`,
`text-prio-urgent-foreground`.

### Priority (solid — needs a foreground per tier)

| Token | Utility | Note |
|---|---|---|
| `--prio-normal` | `bg-prio-normal` | Subtle moss |
| `--prio-important` | `bg-prio-important` | Warm ochre — **takes ink text, not white** |
| `--prio-urgent` | `bg-prio-urgent` | Terracotta clay |

Each has a `-foreground` pair. They differ per tier: ochre is too light for
white text, the other two are not. Always use the pair, never assume white.

### Status (soft tint — `-bg` / `-fg` pairs)

`--status-scheduled` · `--status-reminding` · `--status-snoozed` ·
`--status-ack` · `--status-missed`

**Missed is deliberately not destructive red.** A missed commitment is the
user's, not a system failure. Destructive red is reserved for "permanently
delete this".

### Other additions

- `--destructive-subtle-bg/fg` — a real failure (request didn't go through), as
  opposed to Missed. Used by error toasts.
- `--radius: 0.85rem`. The scale derives from it: `--radius-lg` *is* 0.85rem;
  `--radius-xl` is 1.4×. The original spec said "0.85rem = `rounded-xl`" — in
  this scale that's `rounded-lg`. Using `rounded-xl` makes things 40% rounder
  than designed.

### Surfaces — do not "improve" these

| | Page | Card |
|---|---|---|
| Light | `oklch(0.985 0.008 115)` | `oklch(0.998 0.003 115)` |
| Dark | `oklch(0.18 0.018 150)` → `#0c140d` | `oklch(0.22 0.02 150)` → `#141d15` |

Verified pixel-exact against the design prototype. Cards sit close to the page
(ΔL 0.039 dark, 0.013 light) and rely on their border to separate — that is
intended. This was once "fixed" by lowering `--background`, which made dark
mode read near-black. **If separation ever needs solving, raise `--card`; never
lower `--background`.**

Note: the source `globals.css` carried hex comments ~0.025 L lighter than its
own oklch values. The oklch is authoritative; the comments were wrong.

---

## 4. Accessibility rules

- **AA or it doesn't ship**: 4.5:1 text, 3:1 for UI and state indicators, in
  both themes. Measure, don't assume — several values in the original spec
  failed (white-on-ochre was 2.94:1).
- **Never colour alone.** Every state also carries a word, an icon, or a shape.
  The amber/red pairing here is exactly the risky case for colour vision
  deficiency.
- Anything new that encodes meaning in colour needs a contrast check against
  *both* themes before it lands.

---

## 5. Component patterns

**Task card** (`src/features/tasks/task-card.tsx`) — signal row first
(priority pill, status pill, recurrence, relative time), then title, then
metadata, then actions. Metadata before prose is deliberate: urgency has to be
scannable without reading. 6px priority stripe on the left edge.

**Attention band** (`src/pages/tasks-page.tsx`) — the pinned escalation panel,
tinted with `prio-urgent/5`. The heavy 2px card border inside it is reserved
for *genuinely urgent* tasks; putting it on every card double-borders the panel
and destroys the distinction.

**Platform cards** (`src/pages/platforms-page.tsx`) — linked reads as a live
connection (ack tint + border + check badge); an unbuilt adapter drops to 60%
opacity so it doesn't invite a click that goes nowhere.

**Confirmed tasks** get the ack tint, never `opacity: 0.4`. They stay in the
list and refetch every 15s; dimming parks live content below readable contrast.

---

## 6. Motion

Effectively none, on purpose. The list repolls every 15s and cards change state
under the user's cursor, so anything looping compounds badly.

The original spec called for a 4s infinite pulse on the attention band. It was
built, measured in-browser, and removed: a 12% opacity dip over 4s is below the
threshold of perception, so it cost a compositor layer and bought no signal. If
a real attention cue is wanted, the effective form is a **one-shot on entry**
into `reminding` — perceptible because it's a change, not a loop — and it must
respect `prefers-reduced-motion`.

---

## 7. Deviations from the original spec

| Spec said | We do | Why |
|---|---|---|
| Plus Jakarta Sans + JetBrains Mono | **Geist Variable** | Already shipped; tabular figures handle the counts. Avoided two font deps |
| `--prio-important` L 0.68, white text | L 0.66, **ink** text | White-on-ochre was 2.94:1. Now 5.19:1, hue/chroma untouched |
| `--destructive` L 0.58 | L 0.57 | Was 4.44:1, just under AA |
| Confirmed card → `opacity: 0.4` | Ack tint | 0.4 parks live content below readable contrast |
| 4s infinite pulse | Nothing | Imperceptible when measured — see §6 |
| Radius "0.85rem = `rounded-xl`" | `rounded-lg` | 0.85rem is `--radius-lg` in this scale |

**Not implemented:** the QR link dialog's "numeric verification pin" — the API
doesn't expose one.

---

## 8. Working with it

Run the dev server and open **`/design`** — a live gallery of every token, card
state, badge, platform state and toast, rendered in both themes with the real
components so it cannot drift. Dev-only; excluded from production builds.

Before adding a component:

1. Reach for an existing token. If you're typing a hex or a Tailwind palette
   class (`bg-amber-500`), stop — that's the thing this system replaced.
2. If it encodes a *task state*, it belongs on one of the two axes. Decide
   which, and use that axis's treatment.
3. If it genuinely needs a new token, add it to both `:root` and `.dark`,
   expose it in `@theme inline`, check contrast in both themes, and add it to
   `/design`.
