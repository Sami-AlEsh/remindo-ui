# Remindo Design System Specification — Direction A: Warm Botanical

> **AI Context Instructions**: Use this specification when building or editing UI components for **Remindo**. Remindo is a multi-user reminder service that refuses to let you forget. It nags users on purpose, but must always feel **supportive and persistent, never alarming or stressful**.

---

## 1. Brand Identity & Product Tone

* **Core Premise**: Replaces alarmist reds and flashing yellow warnings with warm forest sage, bone white, olive, and terracotta clay.
* **Key Emotional Feeling**: A reliable, persistent safety net—like a thoughtful friend who gently nudges you until a task is acknowledged.
* **Target Audience**: Ordinary individuals managing real life (medications, renewals, appointments, bills).

---

## 2. Typography & Hierarchy

* **Primary Typeface**: `Plus Jakarta Sans` or system sans-serif (clean, rounded, warm readability).
* **Code/Monospace Typeface**: `JetBrains Mono` (for attempt counts, relative timing, codes).
* **Weights**:
  * `Font-Bold` (700) for task titles, primary buttons, and priority tags.
  * `Font-Semibold` (600) for section headers and badges.
  * `Font-Normal` (400) for task notes and timestamps.

---

## 3. Dual-Axis Semantic Language Rules

Priority and Task Status are two separate axes that co-exist on cards. They **must never use the same visual styling**.

### Axis 1: Importance Tiers (Nag Frequency)
Rendered as **Solid Priority Pillars / Badges** (`text-white` on solid background):

1. **`normal`**: `var(--prio-normal)` (Subtle Moss Sage) — *1 follow-up every 15 mins*
2. **`important`**: `var(--prio-important)` (Warm Ochre) — *2 follow-ups every 10 mins*
3. **`urgent`**: `var(--prio-urgent)` (Terracotta Clay) — *3 follow-ups every 5 mins*

### Axis 2: Task Statuses (Lifecycle State)
Rendered as **Soft Curved Pills** with low-contrast background tints:

1. **`scheduled`**: Soft gray-green background (`var(--status-scheduled-bg)`), dark slate text (`var(--status-scheduled-fg)`).
2. **`reminding`**: Warm tint background (`var(--status-reminding-bg)`), deep terracotta/brown text (`var(--status-reminding-fg)`). Marks mid-escalation.
3. **`snoozed`**: Soft lavender-blue tint background (`var(--status-snoozed-bg)`), navy text (`var(--status-snoozed-fg)`). Indicates paused state.
4. **`acknowledged`**: Soft green tint background (`var(--status-ack-bg)`), dark forest text (`var(--status-ack-fg)`). Confirmed done.
5. **`missed`**: Soft muted earth tint background (`var(--status-missed-bg)`), slate text (`var(--status-missed-fg)`). Represents a gentle missed opportunity, never a harsh error.

---

## 4. Key Component Specs

### Component A: "Needs Your Attention" Band (Pinned Escalation Area)
* **Location**: Pinned at the top of the main task view.
* **Border**: 2px border in `var(--destructive)` (Terracotta) or `var(--prio-urgent)`.
* **Left Accent Stripe**: 6px solid colored stripe matching the priority tier.
* **Animation**: `.animate-attention-pulse` (subtle 4-second scale rhythm).
* **Buttons**:
  * **Confirm**: Primary Sage button (`var(--primary)`), prominent checkmark icon. Satisfying tactile click.
  * **Snooze**: Secondary muted button (`var(--secondary)`), snooze icon + duration option.

### Component B: Standard Task Card
* **Container**: `themed-card` with `var(--card)` background and 1px `var(--border)`.
* **Radius**: Rounded corners `0.85rem` (`rounded-xl`).
* **Header Line**: Priority badge, status pill, recurrence icon/text, relative time indicator (`"Due in 2 hours"`).
* **Body**: Title (Bold 14px/16px), Description (Muted 12px), Linked platform icons (Telegram/WhatsApp).

### Component C: Platforms & Linking
* **Card States**:
  * **Linked**: Active border, subtle green check badge, handle name.
  * **Not Linked**: Actionable button to scan QR code or trigger bot.
  * **Planned / Coming Soon**: 60% opacity, disabled tag.
* **QR Linking Dialog**: Clean centered modal containing SVG QR code, numeric verification pin, and step-by-step instructions.

---

## 5. Micro-Interactions & Animation Guidelines

* **On Confirm Click**: Button instantly shifts to "Confirmed!", card background transitions softly to `var(--status-ack-bg)` over 300ms, then card opacity reduces to 0.4.
* **On Snooze Click**: Secondary button updates state, toast message confirms duration.
* **Escalation Notification Arriving**: Soft pulsing glow without jarring flashes.
