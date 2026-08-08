#!/bin/bash

# Remindo Design System - Package Generator Script
# Run this script in your terminal: bash build_remindo_design_system.sh

TARGET_DIR="remindo-design-system"
ZIP_FILE="remindo-design-system.zip"

echo "📦 Creating Remindo Design System directory..."
mkdir -p "$TARGET_DIR"

# 1. Generate globals.css
cat << 'EOF' > "$TARGET_DIR/globals.css"
@import "tailwindcss";

@layer base {
  :root {
    /* Remindo Direction A: Warm Botanical (Light Mode) */
    --background: oklch(0.985 0.008 115); /* #f9fbf8 - Bone Canvas */
    --foreground: oklch(0.24 0.025 150);  /* #1f2a24 - Deep Forest Slate */

    --card: oklch(0.998 0.003 115);        /* #ffffff - Pure Surface */
    --card-foreground: oklch(0.24 0.025 150);

    --popover: oklch(0.998 0.003 115);
    --popover-foreground: oklch(0.24 0.025 150);

    --primary: oklch(0.42 0.09 155);       /* #225c43 - Forest Sage */
    --primary-foreground: oklch(0.985 0.008 115);

    --secondary: oklch(0.94 0.02 145);     /* #e4ede7 - Soft Sage Tint */
    --secondary-foreground: oklch(0.32 0.06 155);

    --muted: oklch(0.95 0.01 130);         /* #eaedea - Neutral Surface Tint */
    --muted-foreground: oklch(0.52 0.02 140); /* #636d66 - Muted Slate */

    --accent: oklch(0.92 0.03 145);        /* #d6e6dc - Active Surface */
    --accent-foreground: oklch(0.28 0.07 155);

    --destructive: oklch(0.58 0.16 28);    /* #c0493b - Terracotta Clay */
    --destructive-foreground: oklch(0.985 0.008 115);

    --border: oklch(0.90 0.015 140);       /* #dbe2dd - Subtle Botanical Border */
    --input: oklch(0.90 0.015 140);
    --ring: oklch(0.42 0.09 155);

    --radius: 0.85rem;

    /* Extra Semantic Tokens - Priority Ladder (Nag Frequency Axis) */
    --prio-normal: oklch(0.55 0.04 150);    /* Subtle Moss */
    --prio-important: oklch(0.68 0.13 75);  /* Warm Ochre */
    --prio-urgent: oklch(0.58 0.16 28);     /* Terracotta Clay */

    /* Extra Semantic Tokens - Task Statuses (Lifecycle Axis) */
    --status-scheduled-bg: oklch(0.96 0.01 140);
    --status-scheduled-fg: oklch(0.45 0.03 140);

    --status-reminding-bg: oklch(0.93 0.05 85);
    --status-reminding-fg: oklch(0.40 0.10 65);

    --status-snoozed-bg: oklch(0.94 0.03 230);
    --status-snoozed-fg: oklch(0.38 0.08 230);

    --status-ack-bg: oklch(0.94 0.04 155);
    --status-ack-fg: oklch(0.32 0.08 155);

    --status-missed-bg: oklch(0.94 0.02 30);
    --status-missed-fg: oklch(0.48 0.05 30);
  }

  .dark {
    /* Remindo Direction A: Warm Botanical (Dark Mode) */
    --background: oklch(0.18 0.018 150);  /* #131916 - Deep Moss Slate */
    --foreground: oklch(0.93 0.01 130);   /* #e9edea - Light Sage Ivory */

    --card: oklch(0.22 0.02 150);         /* #1a221e - Elevated Dark Card */
    --card-foreground: oklch(0.93 0.01 130);

    --popover: oklch(0.22 0.02 150);
    --popover-foreground: oklch(0.93 0.01 130);

    --primary: oklch(0.68 0.11 150);      /* #4fa37d - Soft Emerald Sage */
    --primary-foreground: oklch(0.18 0.018 150);

    --secondary: oklch(0.28 0.025 150);    /* #24322a */
    --secondary-foreground: oklch(0.85 0.03 145);

    --muted: oklch(0.26 0.02 140);
    --muted-foreground: oklch(0.65 0.02 140);

    --accent: oklch(0.32 0.035 150);
    --accent-foreground: oklch(0.93 0.01 130);

    --destructive: oklch(0.65 0.16 28);   /* Terracotta Clay */
    --destructive-foreground: oklch(0.18 0.018 150);

    --border: oklch(0.28 0.02 140);
    --input: oklch(0.28 0.02 140);
    --ring: oklch(0.68 0.11 150);

    /* Extra Semantic Tokens - Priority Ladder (Dark Mode) */
    --prio-normal: oklch(0.65 0.04 150);
    --prio-important: oklch(0.75 0.13 75);
    --prio-urgent: oklch(0.68 0.16 28);

    /* Extra Semantic Tokens - Task Statuses (Dark Mode) */
    --status-scheduled-bg: oklch(0.26 0.02 140);
    --status-scheduled-fg: oklch(0.75 0.03 140);

    --status-reminding-bg: oklch(0.28 0.06 75);
    --status-reminding-fg: oklch(0.88 0.11 75);

    --status-snoozed-bg: oklch(0.26 0.05 230);
    --status-snoozed-fg: oklch(0.82 0.08 230);

    --status-ack-bg: oklch(0.26 0.05 155);
    --status-ack-fg: oklch(0.82 0.09 155);

    --status-missed-bg: oklch(0.26 0.03 30);
    --status-missed-fg: oklch(0.78 0.05 30);
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-xl: var(--radius);

  /* Semantic priority mapping */
  --color-prio-normal: var(--prio-normal);
  --color-prio-important: var(--prio-important);
  --color-prio-urgent: var(--prio-urgent);
}

/* Micro-animations */
@keyframes subtle-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.008); opacity: 0.96; }
}

.animate-attention-pulse {
  animation: subtle-pulse 4s ease-in-out infinite;
}
EOF

# 2. Generate remindo-design-system-spec.md
cat << 'EOF' > "$TARGET_DIR/remindo-design-system-spec.md"
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
EOF

# 3. Generate index.html (Prototype)
cat << 'EOF' > "$TARGET_DIR/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remindo — Visual Design System & Interactive Specification</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="stylesheet" href="./globals.css">
</head>
<body data-theme="dir-a" data-mode="light" class="min-h-screen antialiased">
  <div class="p-8 text-center">
    <h1 class="text-2xl font-bold">Remindo Design System Package</h1>
    <p class="text-sm text-gray-600 mt-2">See globals.css and remindo-design-system-spec.md for full token and component configurations.</p>
  </div>
</body>
</html>
EOF

# Zip packaging step
echo "🗜️ Zipping files into $ZIP_FILE..."
if command -v zip &> /dev/null; then
  zip -r "$ZIP_FILE" "$TARGET_DIR"
elif command -v python3 &> /dev/null; then
  python3 -c "import shutil; shutil.make_archive('${TARGET_DIR}', 'zip', '${TARGET_DIR}')"
  mv "${TARGET_DIR}.zip" "$ZIP_FILE"
else
  echo "⚠️ Neither 'zip' nor 'python3' was found. The files were created in the '$TARGET_DIR/' directory."
  exit 0
fi

echo "✅ Success! Archive '$ZIP_FILE' created containing:"
echo "   - $TARGET_DIR/globals.css"
echo "   - $TARGET_DIR/remindo-design-system-spec.md"
echo "   - $TARGET_DIR/index.html"
