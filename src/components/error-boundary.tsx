import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence. React unmounts the entire tree on an uncaught render
 * error, so without this one bad component leaves a blank white page with the
 * failure only visible in the console — which is exactly how a malformed
 * /billing/products response took the whole site down.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="bg-background text-foreground flex min-h-screen items-center justify-center px-6">
        <div className="bg-card flex w-full max-w-md flex-col items-center gap-4 rounded-xl border p-8 text-center">
          <TriangleAlert className="text-prio-important size-8" />
          <div className="flex flex-col gap-1.5">
            <h1 className="text-lg font-bold tracking-tight">
              Something went wrong
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This page hit an error it could not recover from. Reloading
              usually clears it.
            </p>
          </div>

          {/* The message is genuinely useful while developing and meaningless
              noise to a user, so it only shows in dev. */}
          {import.meta.env.DEV && (
            <pre className="bg-muted text-muted-foreground max-h-40 w-full overflow-auto rounded-md p-3 text-left text-xs whitespace-pre-wrap">
              {error.message}
            </pre>
          )}

          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>Reload</Button>
            <Button
              variant="outline"
              onClick={() => window.location.assign('/')}
            >
              Go home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
