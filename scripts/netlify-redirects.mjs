import { writeFileSync } from 'node:fs';

/**
 * Generates dist/_redirects at deploy time.
 *
 * The API origin comes from the API_ORIGIN env var (set in the Netlify UI)
 * so pointing the site at a new backend is a redeploy, not a commit. The
 * proxy rule must come first: Netlify applies the earliest matching rule,
 * and the SPA fallback would otherwise swallow /api/* into index.html.
 */
const apiOrigin = (process.env.API_ORIGIN ?? '').replace(/\/+$/, '');

const rules = [];

if (apiOrigin) {
  rules.push(`/api/* ${apiOrigin}/api/:splat 200`);
} else {
  console.warn(
    '[netlify-redirects] API_ORIGIN is not set — deploying without the /api proxy. ' +
      'Every API call will 404. Set it in Site settings → Environment variables.',
  );
}

// Backstop, and it must sit above the SPA fallback. Without it an /api/* call
// that the proxy did not handle falls through to `/* /index.html 200` and comes
// back as index.html with a 200 — the client then has a "successful" response
// whose body is HTML. A clean 404 is something the app can report; a 200 full
// of HTML is what blanked the pricing page.
rules.push('/api/* /index.html 404');

rules.push('/* /index.html 200');

writeFileSync('dist/_redirects', rules.join('\n') + '\n');
console.log(`[netlify-redirects] wrote dist/_redirects:\n${rules.join('\n')}`);
