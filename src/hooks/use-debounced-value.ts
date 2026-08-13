import { useEffect, useState } from 'react';

/**
 * Trails `value` by `delayMs`, resetting the timer on every change. Keeps a
 * search box responsive locally while the network request only fires once the
 * user stops typing — without it, every keystroke is a request and a new
 * react-query cache entry.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
