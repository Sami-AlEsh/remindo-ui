import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { resolvedTheme, systemTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // next-themes cannot resolve the theme until it has read the DOM, so the
  // first render would otherwise show the wrong icon and then swap.
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const next = isDark ? 'light' : 'dark';

  function toggle() {
    // Store 'system' whenever the chosen side already matches the OS. The
    // button reads as a plain two-state switch either way, but this keeps the
    // preference following the OS instead of pinning it the first time it is
    // pressed — so the default survives.
    setTheme(next === systemTheme ? 'system' : next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
    >
      {/* Both icons are always mounted and cross-faded, so the swap cannot
          reflow the header or flash an empty button mid-transition. */}
      <span className="relative grid size-4 place-items-center">
        <Sun
          className="absolute size-4 rotate-0 scale-100 opacity-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 dark:opacity-0"
          aria-hidden
        />
        <Moon
          className="absolute size-4 rotate-90 scale-0 opacity-0 transition-all duration-300 dark:rotate-0 dark:scale-100 dark:opacity-100"
          aria-hidden
        />
      </span>
    </Button>
  );
}
