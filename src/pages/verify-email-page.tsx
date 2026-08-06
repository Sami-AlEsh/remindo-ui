import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { ApiError } from '@/api/errors';
import { platformsApi } from '@/api/endpoints';
import { Button } from '@/components/ui/button';

type State =
  | { kind: 'verifying' }
  | { kind: 'done'; email: string }
  | { kind: 'failed'; message: string };

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>({ kind: 'verifying' });
  const attempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setState({ kind: 'failed', message: 'This link is missing its token.' });
      return;
    }
    // StrictMode double-invokes effects; the token is single-use, so a second
    // call would always fail.
    if (attempted.current) return;
    attempted.current = true;

    void platformsApi
      .verifyEmail(token)
      .then((result) => setState({ kind: 'done', email: result.email }))
      .catch((error: unknown) =>
        setState({
          kind: 'failed',
          message:
            error instanceof ApiError
              ? (error.messages[0] ?? 'This link is invalid or has expired.')
              : 'This link is invalid or has expired.',
        }),
      );
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        {state.kind === 'verifying' && (
          <>
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Confirming your address…
            </p>
          </>
        )}

        {state.kind === 'done' && (
          <>
            <CheckCircle2 className="text-status-ack-foreground size-10" />
            <h1 className="text-xl font-semibold tracking-tight">
              Email confirmed
            </h1>
            <p className="text-muted-foreground text-sm">
              Reminders will arrive at {state.email}.
            </p>
            <Button asChild className="mt-2">
              <Link to="/platforms">Back to Remindo</Link>
            </Button>
          </>
        )}

        {state.kind === 'failed' && (
          <>
            <XCircle className="text-destructive size-10" />
            <h1 className="text-xl font-semibold tracking-tight">
              Could not confirm
            </h1>
            <p className="text-muted-foreground text-sm">{state.message}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link to="/platforms">Request a new link</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
