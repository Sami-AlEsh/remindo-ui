import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  Check,
  Clock,
  Globe,
  MessageSquare,
  Repeat,
  ShieldCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/api/types';
import { TASK_PRIORITIES } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { TaskCard } from '@/features/tasks/task-card';
import { PRIORITY_LABELS, PRIORITY_POLICY } from '@/lib/labels';
import { useAuth } from '@/features/auth/auth-context';

/* --------------------------------------------------------------- content */

/**
 * Rendered with the real TaskCard, so the marketing can never show a lie.
 * The due date is relative to now — a fixed one would age into "7 months ago"
 * on a card that is supposedly mid-escalation.
 */
function heroTask(now: number): Task {
  return {
    id: 'hero',
    title: 'Take blood pressure medication',
    content: 'Second dose. Skipping it throws the whole week off.',
    status: 'reminding',
    priority: 'urgent',
    platforms: ['telegram'],
    recurrence: 'daily',
    // Overdue by ten minutes: it is on attempt 2 of the urgent ladder.
    dueDate: new Date(now - 10 * 60_000).toISOString(),
    occurrenceSeq: 1,
    attempt: 2,
    snoozeCount: 0,
  };
}

const STEPS = [
  {
    icon: MessageSquare,
    title: 'Link Telegram',
    body: 'Scan a QR code once. Reminders arrive where you already are — no new app to check.',
  },
  {
    icon: BellRing,
    title: 'Add what matters',
    body: 'A title, a time, and how hard you want to be chased. That is the whole form.',
  },
  {
    icon: Check,
    title: 'Confirm or snooze',
    body: 'Answer from Telegram or the web. Until you do, Remindo keeps coming back.',
  },
];

const FEATURES = [
  {
    icon: Repeat,
    title: 'Recurring without drift',
    body: 'Daily, weekly, monthly or yearly. Recurring tasks fire on a UTC anchor, so they hold their time across daylight saving.',
  },
  {
    icon: Clock,
    title: 'Snooze that expires',
    body: 'Snoozing buys minutes, not amnesty. The task returns on a schedule set by its priority.',
  },
  {
    icon: Globe,
    title: 'Answer from anywhere',
    body: 'Confirm in the chat, from an email link, or in the browser. State stays in sync everywhere.',
  },
  {
    icon: ShieldCheck,
    title: 'Nothing sensitive in chat',
    body: 'Linking never asks for your password in a message. Sessions rotate and revoke on reuse.',
  },
];

/* ------------------------------------------------------------ primitives */

function Section({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mx-auto w-full max-w-5xl px-6', className)}>
      {children}
    </section>
  );
}

function EscalationTier({ priority }: { priority: TaskPriority }) {
  const { reminders, everyMin, snoozeMin } = PRIORITY_POLICY[priority];
  const accent = {
    normal: 'bg-prio-normal',
    important: 'bg-prio-important',
    urgent: 'bg-prio-urgent',
  }[priority];

  return (
    <div className="bg-card relative overflow-hidden rounded-lg border p-5">
      <span className={cn('absolute inset-y-0 left-0 w-1.5', accent)} aria-hidden />
      <div className="flex flex-col gap-3 pl-3">
        <span
          className={cn(
            'w-fit rounded-4xl px-2.5 py-0.5 text-xs font-semibold tracking-tight',
            accent,
            {
              normal: 'text-prio-normal-foreground',
              important: 'text-prio-important-foreground',
              urgent: 'text-prio-urgent-foreground',
            }[priority],
          )}
        >
          {PRIORITY_LABELS[priority]}
        </span>

        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {reminders}
          <span className="text-muted-foreground ml-1.5 text-sm font-normal">
            follow-up{reminders === 1 ? '' : 's'}
          </span>
        </p>

        <dl className="text-muted-foreground flex flex-col gap-1 text-xs tabular-nums">
          <div className="flex justify-between gap-4">
            <dt>Repeats every</dt>
            <dd className="text-foreground font-medium">{everyMin} min</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Snooze buys</dt>
            <dd className="text-foreground font-medium">{snoozeMin} min</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- the page */

export function LandingPage() {
  const { user, isRestoring } = useAuth();
  const task = useMemo(() => heroTask(Date.now()), []);
  const noop = () => undefined;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border/60 bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <BellRing className="size-5" />
            Remindo
          </span>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {/* Avoid flashing "Sign in" at someone who already has a session. */}
            {!isRestoring &&
              (user ? (
                <Button asChild size="sm">
                  <Link to="/tasks">
                    Your tasks
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup">Get started</Link>
                  </Button>
                </>
              ))}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------ hero */}
      <Section className="py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <span className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-4xl px-3 py-1 text-xs font-medium">
              <BellRing className="size-3.5" />
              Reminders that don&apos;t give up
            </span>

            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              It keeps asking until you actually do it.
            </h1>

            <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
              One notification is easy to swipe away. Remindo escalates —
              following up on a schedule you choose, through Telegram, until you
              confirm the task is done. Persistent on purpose, never alarming.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="font-semibold">
                <Link to="/signup">
                  Get started free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>

            <p className="text-muted-foreground text-xs">
              Free for your first 5 reminders ·{' '}
              <Link to="/pricing" className="hover:text-foreground underline">
                Pro goes unlimited
              </Link>
            </p>
          </div>

          {/* The genuine component, not a picture of one. */}
          <div className="relative">
            <div
              className="bg-primary/5 absolute -inset-6 rounded-3xl"
              aria-hidden
            />
            <div className="relative">
              <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                Attempt 2 of 3 · still waiting on you
              </p>
              <TaskCard
                task={task}
                attention
                onEdit={noop}
                onDelete={noop}
                onConfirm={noop}
                onSnooze={noop}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------- escalation */}
      <Section className="py-16">
        <div className="mb-8 flex flex-col gap-2">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            You decide how hard to be chased.
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Every task carries a priority, and priority is not decoration — it
            sets the actual follow-up schedule. Pick the pressure that fits the
            promise you made.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {TASK_PRIORITIES.map((priority) => (
            <EscalationTier key={priority} priority={priority} />
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------- how it works */}
      <Section className="py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
          Three steps, then forget about it.
        </h2>

        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="flex flex-col gap-3">
              <span className="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </span>
              <h3 className="font-bold tracking-tight">
                <span className="text-muted-foreground tabular-nums">
                  {i + 1}.{' '}
                </span>
                {title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* -------------------------------------------------------- features */}
      <Section className="py-16">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <Icon className="text-primary mt-0.5 size-5 shrink-0" />
              <div className="flex flex-col gap-1.5">
                <h3 className="font-bold tracking-tight">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- pricing */}
      <Section className="py-16">
        <div className="border-primary/40 bg-primary/5 flex flex-col items-center gap-4 rounded-xl border px-6 py-10 text-center sm:flex-row sm:text-left">
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight">
              Free for 5 reminders. Pro for everything else.
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              The free plan covers 5 active reminders on Telegram. Pro unlocks
              unlimited reminders on every platform — prepaid, never
              auto-charged.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/pricing">
              See pricing
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      {/* ------------------------------------------------------- final CTA */}
      <Section className="py-16">
        <div className="bg-card flex flex-col items-center gap-5 rounded-xl border px-6 py-14 text-center">
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            What did you forget last week?
          </h2>
          <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
            Set it up once and stop relying on remembering. Remindo will handle
            the remembering, and the reminding, and the reminding after that.
          </p>
          <Button asChild size="lg" className="font-semibold">
            <Link to={user ? '/tasks' : '/signup'}>
              {user ? 'Go to your tasks' : 'Create your first reminder'}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </Section>

      <footer className="border-border/60 mt-8 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-xs">
          <span className="text-foreground flex items-center gap-2 font-semibold">
            <BellRing className="size-4" />
            Remindo
          </span>
          <span className="ml-auto">Reminders that make sure you act.</span>
        </div>
      </footer>
    </div>
  );
}
