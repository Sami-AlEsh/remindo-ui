import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
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

import './landing.css';

import { cn } from '@/lib/utils';
import type { Task, TaskPriority } from '@/api/types';
import { TASK_PRIORITIES } from '@/api/types';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { TaskCard } from '@/features/tasks/task-card';
import {
  PLATFORM_LABELS,
  PRIORITY_LABELS,
  PRIORITY_POLICY,
} from '@/lib/labels';
import { useAuth } from '@/features/auth/auth-context';
import { usePrefersReducedMotion, useReveal } from '@/hooks/use-motion';

/* --------------------------------------------------------------- content */

/**
 * The hero plays the escalation ladder out in real time, cycling through a
 * handful of the things people actually set reminders for. Each frame produces
 * a genuine Task handed to the real TaskCard, so the animation is driven by
 * data rather than by a picture of the product — it cannot advertise a card the
 * app does not actually render.
 */
interface Example {
  title: string;
  content: string;
  priority: TaskPriority;
  recurrence: Task['recurrence'];
  platforms: Task['platforms'];
}

const EXAMPLES: Example[] = [
  {
    title: 'Take blood pressure medication',
    content: 'Second dose. Skipping it throws the whole week off.',
    priority: 'urgent',
    recurrence: 'daily',
    platforms: ['telegram'],
  },
  {
    title: 'Pay the credit card bill',
    content: 'Statement is due today — after midnight it starts accruing interest.',
    priority: 'urgent',
    recurrence: 'monthly',
    platforms: ['telegram', 'email'],
  },
  {
    title: 'Pay the rent',
    content: 'Transfer to the landlord before the 5th to avoid the late fee.',
    priority: 'urgent',
    recurrence: 'monthly',
    platforms: ['telegram'],
  },
  {
    title: 'Take vitamin D3',
    content: 'With breakfast — it needs fat to absorb properly.',
    priority: 'normal',
    recurrence: 'daily',
    platforms: ['telegram'],
  },
  {
    title: 'Pay the school fees',
    content: 'Term invoice is due. The portal closes at the end of the week.',
    priority: 'important',
    recurrence: 'quarterly',
    platforms: ['telegram', 'email'],
  },
  {
    title: 'Renew the car insurance',
    content: 'Policy lapses at midnight. Renewal link is in the email from AXA.',
    priority: 'important',
    recurrence: 'yearly',
    platforms: ['telegram', 'email'],
  },
];

interface Frame {
  status: Task['status'];
  attempt: number;
  offsetMs: number;
  caption: string;
  ms: number;
}

/**
 * Builds the ladder for one example from the policy the API actually enforces.
 * The count of follow-ups is not a constant here on purpose: the card prints
 * "Attempt 2 · 2 follow-ups, every 10 min" from the same table, so a hardcoded
 * three-step climb would contradict the card's own caption on anything that is
 * not urgent.
 */
function framesFor(example: Example): Frame[] {
  const { reminders, everyMin } = PRIORITY_POLICY[example.priority];
  const platform = PLATFORM_LABELS[example.platforms[0]];

  const frames: Frame[] = [
    {
      status: 'scheduled',
      attempt: 0,
      offsetMs: 2 * 60_000,
      caption: 'Due in two minutes',
      ms: 2200,
    },
  ];

  for (let attempt = 1; attempt <= reminders; attempt++) {
    frames.push({
      status: 'reminding',
      attempt,
      // Overdue by however long the ladder has actually been climbing, so the
      // relative time on the card agrees with the attempt number beside it.
      offsetMs: -attempt * everyMin * 60_000,
      caption:
        attempt === 1
          ? `${platform} pings you`
          : attempt === reminders
            ? 'Last call'
            : 'No answer — following up',
      ms: 2200,
    });
  }

  frames.push({
    status: 'acknowledged',
    attempt: reminders,
    offsetMs: -(reminders * everyMin + 1) * 60_000,
    caption: 'Confirmed — it stops',
    ms: 2600,
  });

  return frames;
}

/** Frozen at this frame when reduced-motion is on: mid-escalation, the
    telling state. The example is still whatever the shuffle dealt first, so a
    reload varies for those visitors too. */
const STILL_FRAME = 2;

/** Fisher-Yates, on a copy — EXAMPLES is module state shared across mounts. */
function shuffle(items: readonly Example[]): Example[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Reshuffles for the next pass, nudging away from opening on whatever just
 * played. Without this the seam between passes can repeat a task immediately,
 * which reads as the animation having stalled rather than moved on.
 */
function reshuffle(justPlayed: Example): Example[] {
  const next = shuffle(EXAMPLES);
  if (next.length > 1 && next[0].title === justPlayed.title) {
    [next[0], next[next.length - 1]] = [next[next.length - 1], next[0]];
  }
  return next;
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

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn('reveal', className)}
      style={{ '--reveal-delay': delay } as CSSProperties}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------- escalation demo */

const PRIO_DOT: Record<TaskPriority, string> = {
  normal: 'bg-prio-normal',
  important: 'bg-prio-important',
  urgent: 'bg-prio-urgent',
};

function EscalationDemo() {
  const reduced = usePrefersReducedMotion();
  // Lazy initialiser, so the deal happens once per mount rather than on every
  // render — otherwise the demo would reshuffle under its own feet.
  const [order, setOrder] = useState<Example[]>(() => shuffle(EXAMPLES));
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState(0);
  const [filled, setFilled] = useState(false);

  const activeExample = order[reduced ? 0 : index];
  const frames = useMemo(() => framesFor(activeExample), [activeExample]);
  const current =
    frames[reduced ? STILL_FRAME : Math.min(frame, frames.length - 1)];

  useEffect(() => {
    if (reduced) return;

    // Snap the bar back, then let it run — two renders per frame rather than
    // re-rendering the whole card on every animation tick.
    setFilled(false);
    const raf = requestAnimationFrame(() => setFilled(true));
    const timer = setTimeout(() => {
      // A finished ladder hands over to the next example, so the hero shows
      // the range of things people track rather than one medication forever.
      if (frame < frames.length - 1) {
        setFrame((f) => f + 1);
        return;
      }

      setFrame(0);
      if (index < order.length - 1) {
        setIndex((i) => i + 1);
      } else {
        // Pass complete — deal again so a long visit does not settle into a
        // fixed rotation.
        setOrder(reshuffle(order[index]));
        setIndex(0);
      }
    }, current.ms);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [frame, index, order, reduced, current.ms, frames.length]);

  const task: Task = useMemo(
    () => ({
      id: 'hero',
      title: activeExample.title,
      content: activeExample.content,
      status: current.status,
      priority: activeExample.priority,
      platforms: activeExample.platforms,
      recurrence: activeExample.recurrence,
      recurrenceDays: [],
      dueDate: new Date(Date.now() + current.offsetMs).toISOString(),
      occurrenceSeq: 1,
      attempt: current.attempt,
      snoozeCount: 0,
    }),
    [activeExample, current],
  );

  const noop = () => undefined;
  const total = PRIORITY_POLICY[activeExample.priority].reminders;
  const accent = PRIO_DOT[activeExample.priority];

  return (
    <div className="aurora">
      <div className="bg-card/60 rounded-xl border p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p
            key={`${activeExample.title}-${current.caption}`}
            className={cn(
              'text-muted-foreground text-xs font-medium tracking-wide uppercase',
              !reduced && 'ping',
            )}
          >
            {current.caption}
          </p>

          {/* Attempt beads — how far up this task's own ladder we are. */}
          <div className="flex items-center gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'size-1.5 rounded-full transition-colors duration-300',
                  i < current.attempt ? accent : 'bg-border',
                )}
              />
            ))}
          </div>
        </div>

        <TaskCard
          task={task}
          demo
          attention={
            current.status === 'reminding' && activeExample.priority === 'urgent'
          }
          onEdit={noop}
          onDelete={noop}
          onConfirm={noop}
          onSnooze={noop}
        />

        <div className="bg-muted mt-3 h-1 overflow-hidden rounded-full">
          <div
            className={cn(
              'countdown-fill h-full rounded-full',
              current.status === 'acknowledged'
                ? 'bg-status-ack-foreground'
                : accent,
            )}
            data-reset={!filled}
            style={{
              width: reduced || filled ? '100%' : '0%',
              transitionDuration: filled ? `${current.ms}ms` : '0ms',
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- escalation tier */

function EscalationTier({
  priority,
  index,
}: {
  priority: TaskPriority;
  index: number;
}) {
  const { reminders, everyMin, snoozeMin } = PRIORITY_POLICY[priority];
  const accent = {
    normal: 'bg-prio-normal',
    important: 'bg-prio-important',
    urgent: 'bg-prio-urgent',
  }[priority];

  return (
    <Reveal delay={index} className="h-full">
      <div className="bg-card lift relative h-full overflow-hidden rounded-lg border p-5">
        <span
          className={cn('absolute inset-y-0 left-0 w-1.5', accent)}
          aria-hidden
        />
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

          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold tracking-tight tabular-nums">
              {reminders}
            </p>
            <span className="text-muted-foreground text-sm">
              follow-up{reminders === 1 ? '' : 's'}
            </span>
            <span className="ml-auto flex items-center gap-1" aria-hidden>
              {Array.from({ length: reminders }, (_, i) => (
                <span
                  key={i}
                  className={cn('beat size-2 rounded-full', accent)}
                  style={{ '--beat': i } as CSSProperties}
                />
              ))}
            </span>
          </div>

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
    </Reveal>
  );
}

/* ------------------------------------------------------------- the page */

export function LandingPage() {
  const { user, isRestoring } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <header
        className={cn(
          'bg-background/80 sticky top-0 z-10 border-b backdrop-blur transition-colors duration-300',
          scrolled ? 'border-border/60' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <BellRing className="size-5" />
            Remindo
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden sm:flex"
            >
              <Link to="/pricing">Pricing</Link>
            </Button>
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
            <span
              className="bg-secondary text-secondary-foreground rise flex items-center gap-2 rounded-4xl px-3 py-1 text-xs font-medium"
              style={{ '--rise-delay': 0 } as CSSProperties}
            >
              <BellRing className="size-3.5" />
              Reminders that don&apos;t give up
            </span>

            <h1
              className="rise text-4xl font-bold tracking-tight text-balance sm:text-5xl"
              style={{ '--rise-delay': 1 } as CSSProperties}
            >
              It keeps asking until you actually do it.
            </h1>

            <p
              className="text-muted-foreground rise max-w-lg text-base leading-relaxed"
              style={{ '--rise-delay': 2 } as CSSProperties}
            >
              One notification is easy to swipe away. Remindo escalates —
              following up on a schedule you choose, through Telegram, until you
              confirm the task is done. Persistent on purpose, never alarming.
            </p>

            <div
              className="rise flex flex-wrap items-center gap-3"
              style={{ '--rise-delay': 3 } as CSSProperties}
            >
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

            <p
              className="text-muted-foreground rise text-xs"
              style={{ '--rise-delay': 4 } as CSSProperties}
            >
              Free for your first 5 reminders ·{' '}
              <Link to="/pricing" className="hover:text-foreground underline">
                Pro goes unlimited
              </Link>
            </p>
          </div>

          <div className="rise" style={{ '--rise-delay': 3 } as CSSProperties}>
            <EscalationDemo />
          </div>
        </div>
      </Section>

      {/* ----------------------------------------------------- escalation */}
      <Section className="py-16">
        <Reveal>
          <div className="mb-8 flex flex-col gap-2">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              You decide how hard to be chased.
            </h2>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Every task carries a priority, and priority is not decoration — it
              sets the actual follow-up schedule. Pick the pressure that fits
              the promise you made.
            </p>
          </div>
        </Reveal>

        <div className="grid items-stretch gap-4 sm:grid-cols-3">
          {TASK_PRIORITIES.map((priority, i) => (
            <EscalationTier key={priority} priority={priority} index={i} />
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------- how it works */}
      <Section className="py-16">
        <Reveal>
          <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps, then forget about it.
          </h2>
        </Reveal>

        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i}>
              <li className="flex flex-col gap-3">
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
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* -------------------------------------------------------- features */}
      <Section className="py-16">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i % 2}>
              <div className="flex gap-4">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-bold tracking-tight">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* --------------------------------------------------------- pricing */}
      <Section className="py-16">
        <Reveal>
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
        </Reveal>
      </Section>

      {/* ------------------------------------------------------- final CTA */}
      <Section className="py-16">
        <Reveal>
          {/* Clipped: inset -35% on a full-width card throws the glow across
              the whole viewport instead of lighting the panel. */}
          <div className="bg-card aurora flex flex-col items-center gap-5 overflow-hidden rounded-xl border px-6 py-14 text-center">
            <h2 className="max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-3xl">
              What did you forget last week?
            </h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              Set it up once and stop relying on remembering. Remindo will
              handle the remembering, and the reminding, and the reminding after
              that.
            </p>
            <Button asChild size="lg" className="font-semibold">
              <Link to={user ? '/tasks' : '/signup'}>
                {user ? 'Go to your tasks' : 'Create your first reminder'}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </Section>

      <footer className="border-border/60 mt-8 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-xs">
          <span className="text-foreground flex items-center gap-2 font-semibold">
            <BellRing className="size-4" />
            Remindo
          </span>
          <Link to="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <span className="ml-auto">Reminders that make sure you act.</span>
        </div>
      </footer>
    </div>
  );
}
