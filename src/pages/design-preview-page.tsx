import type { ReactNode } from 'react';
import { BellRing, Check, Link2, Unlink } from 'lucide-react';
import { toast } from 'sonner';

import './design-preview.css';

import { cn } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus } from '@/api/types';
import { TASK_PRIORITIES, TASK_STATUSES } from '@/api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TaskCard } from '@/features/tasks/task-card';
import { PriorityPill, StatusBadge } from '@/features/tasks/task-badges';

/**
 * Living reference for the Warm Botanical system. Dev-only route at /design.
 * Every surface below is rendered with the real tokens and the real TaskCard,
 * so it cannot drift from what the app actually ships.
 */

const HOUR = 3_600_000;

function demoTask(over: Partial<Task> = {}): Task {
  return {
    id: 'demo',
    title: 'Renew car insurance',
    content:
      'Policy lapses at midnight. The renewal link is in the email from AXA — takes about five minutes.',
    status: 'scheduled',
    priority: 'normal',
    platforms: ['telegram'],
    recurrence: 'once',
    dueDate: new Date(Date.parse('2026-08-07T09:00:00Z') + HOUR * 2).toISOString(),
    occurrenceSeq: 1,
    attempt: 0,
    snoozeCount: 0,
    ...over,
  };
}

const SCENARIOS: { label: string; task: Task; attention?: boolean }[] = [
  {
    label: 'Urgent · mid-escalation — the state the product exists for',
    task: demoTask({
      title: 'Take blood pressure medication',
      content: 'Second dose. Skipping it throws the whole week off.',
      status: 'reminding',
      priority: 'urgent',
      attempt: 2,
      recurrence: 'daily',
      platforms: ['telegram', 'whatsapp'],
    }),
    attention: true,
  },
  {
    label: 'Important · snoozed three times',
    task: demoTask({
      title: 'Submit Q3 expense report',
      status: 'snoozed',
      priority: 'important',
      snoozeCount: 3,
      platforms: ['telegram', 'email'],
    }),
  },
  { label: 'Normal · scheduled — the common case, recedes', task: demoTask() },
  {
    label: 'Acknowledged — ack tint, not a fade',
    task: demoTask({
      title: 'Pay the electricity bill',
      status: 'acknowledged',
      recurrence: 'monthly',
    }),
  },
  {
    label: 'Missed — earth tone, deliberately not destructive red',
    task: demoTask({
      title: "Call the dentist about Tuesday's appointment",
      status: 'missed',
      priority: 'important',
      attempt: 3,
    }),
  },
];

const noop = () => undefined;

function Section({
  n,
  title,
  note,
  children,
}: {
  n: string;
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 border-t border-neutral-300 pt-8 dark:border-neutral-700">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          <span className="text-neutral-400 dark:text-neutral-600">{n}. </span>
          {title}
        </h2>
        {note && (
          <p className="mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
            {note}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}

/** Renders children twice on real token surfaces, once per theme. */
function ThemePair({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[false, true].map((isDark, i) => (
        <div key={i} className={isDark ? 'dark' : undefined}>
          <p className="mb-1.5 text-xs font-medium tracking-wide text-neutral-500 uppercase">
            {isDark ? 'Dark' : 'Light'}
          </p>
          <div className="bg-background text-foreground rounded-xl border p-5">
            {children}
          </div>
        </div>
      ))}
    </div>
  );
}

function Swatch({
  name,
  cssVar,
  fg,
  ratio,
}: {
  name: string;
  cssVar: string;
  fg?: string;
  ratio?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="flex h-14 items-center justify-center rounded-md border text-xs font-semibold"
        style={{
          background: `var(${cssVar})`,
          color: fg ? `var(${fg})` : undefined,
        }}
      >
        {fg ? 'Aa' : ''}
      </div>
      <span className="text-[11px] leading-tight font-medium">{name}</span>
      {ratio && (
        <span className="text-muted-foreground text-[10px] tabular-nums">
          {ratio}
        </span>
      )}
    </div>
  );
}

export function DesignPreviewPage() {
  return (
    <div className={cn('ds-chrome min-h-screen px-6 py-10')}>
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <header>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            <BellRing className="size-6" />
            Remindo — Warm Botanical
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600 dark:text-neutral-400">
            The shipped design system, rendered with the real tokens and the
            real <code>TaskCard</code>. Both themes side by side. Dev-only
            route; excluded from production builds.
          </p>
        </header>

        <Section
          n="1"
          title="Palette"
          note="Contrast ratios are measured, not asserted. Two values were moved from the source spec to clear AA; both are marked."
        >
          <ThemePair>
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
                  Core
                </p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  <Swatch name="background" cssVar="--background" />
                  <Swatch name="card" cssVar="--card" />
                  <Swatch name="primary" cssVar="--primary" fg="--primary-foreground" ratio="7.8:1" />
                  <Swatch name="secondary" cssVar="--secondary" fg="--secondary-foreground" />
                  <Swatch name="muted" cssVar="--muted" fg="--muted-foreground" ratio="5.4:1" />
                  <Swatch name="destructive*" cssVar="--destructive" fg="--destructive-foreground" ratio="4.63:1" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
                  Axis 1 — priority ladder (solid pills)
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Swatch name="normal" cssVar="--prio-normal" fg="--prio-normal-foreground" ratio="4.76:1" />
                  <Swatch name="important*" cssVar="--prio-important" fg="--prio-important-foreground" ratio="5.19:1" />
                  <Swatch name="urgent" cssVar="--prio-urgent" fg="--prio-urgent-foreground" ratio="4.63:1" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
                  Axis 2 — lifecycle status (soft tints)
                </p>
                <div className="grid grid-cols-5 gap-3">
                  <Swatch name="scheduled" cssVar="--status-scheduled-bg" fg="--status-scheduled-fg" ratio="6.6:1" />
                  <Swatch name="reminding" cssVar="--status-reminding-bg" fg="--status-reminding-fg" ratio="7.7:1" />
                  <Swatch name="snoozed" cssVar="--status-snoozed-bg" fg="--status-snoozed-fg" ratio="8.3:1" />
                  <Swatch name="done" cssVar="--status-ack-bg" fg="--status-ack-fg" ratio="10.4:1" />
                  <Swatch name="missed" cssVar="--status-missed-bg" fg="--status-missed-fg" ratio="5.6:1" />
                </div>
              </div>

              <p className="text-muted-foreground text-[11px]">
                * destructive L .58→.57 (spec was 4.44:1). important L .68→.66
                with ink text (spec was 2.94:1 on white). Surfaces lifted so
                card-vs-page reads as a step: ΔL .013→.043 light, .04→.09 dark.
              </p>
            </div>
          </ThemePair>
        </Section>

        <Section
          n="2"
          title="Task card, every state"
          note="Priority is a solid pill, status a soft tint — the two axes never share a treatment, so a card is never mistaken for one signal."
        >
          {SCENARIOS.map(({ label, task, attention }) => (
            <div key={label} className="flex flex-col gap-2">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {label}
              </p>
              <ThemePair>
                <TaskCard
                  task={task}
                  attention={attention}
                  onEdit={noop}
                  onDelete={noop}
                  onConfirm={noop}
                  onSnooze={noop}
                />
              </ThemePair>
            </div>
          ))}
        </Section>

        <Section
          n="3"
          title="Attention band"
          note="Spec Component A. The panel marks the pinned escalation area; the heavy 2px card border is reserved for genuinely urgent tasks so the two treatments don't cancel out."
        >
          <ThemePair>
            <section className="border-prio-urgent/30 bg-prio-urgent/5 flex flex-col gap-3 rounded-xl border p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <BellRing className="text-prio-urgent size-4" />
                Needs your attention
                <span className="text-muted-foreground font-normal">(2)</span>
              </h2>
              <TaskCard
                task={SCENARIOS[0].task}
                attention
                onEdit={noop}
                onDelete={noop}
                onConfirm={noop}
                onSnooze={noop}
              />
              <TaskCard
                task={SCENARIOS[1].task}
                onEdit={noop}
                onDelete={noop}
                onConfirm={noop}
                onSnooze={noop}
              />
            </section>
          </ThemePair>
        </Section>

        <Section
          n="4"
          title="Platform cards"
          note="Spec Component C. Linked reads as a live connection; an adapter that doesn't exist yet recedes rather than inviting a click that goes nowhere."
        >
          <ThemePair>
            <div className="flex flex-col gap-3">
              <Card className="border-status-ack-foreground/40 bg-status-ack/20">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        Telegram
                        <Badge className="bg-status-ack text-status-ack-foreground border-0">
                          <Check className="size-3" />
                          Linked
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Reminders are delivered here.
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline">
                      <Unlink className="size-4" />
                      Unlink
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-base">WhatsApp</CardTitle>
                      <CardDescription>Not linked yet.</CardDescription>
                    </div>
                    <Button size="sm">
                      <Link2 className="size-4" />
                      Link
                    </Button>
                  </div>
                </CardHeader>
              </Card>

              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    SMS
                    <Badge variant="outline">Coming later</Badge>
                  </CardTitle>
                  <CardDescription>
                    No adapter for this platform yet.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </ThemePair>
        </Section>

        <Section
          n="5"
          title="Toasts"
          note="sonner's richColors are remapped onto the lifecycle tokens, so a success toast matches the acknowledged card that triggered it instead of shipping sonner's own emerald."
        >
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => toast.success('Task confirmed')}>
              Success
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => toast.error('Could not reach the server')}
            >
              Error
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => toast.warning('Reminder escalating — attempt 2')}
            >
              Warning
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.info('Snoozed for 20 minutes')}
            >
              Info
            </Button>
          </div>
        </Section>

        <Section
          n="6"
          title="Badges and controls"
          note="Sanity check that no two statuses collapse into each other and that every state carries a word, not just a colour."
        >
          <ThemePair>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {TASK_STATUSES.map((s) => (
                  <StatusBadge key={s} status={s as TaskStatus} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {TASK_PRIORITIES.map((p) => (
                  <PriorityPill key={p} priority={p as TaskPriority} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">Confirm</Button>
                <Button size="sm" variant="secondary">
                  Snooze
                </Button>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                <Button size="sm" variant="ghost">
                  Ghost
                </Button>
                <Button size="sm" variant="destructive">
                  Delete
                </Button>
              </div>
            </div>
          </ThemePair>
        </Section>
      </div>
    </div>
  );
}
