# Remindo UI

Web client for the [Remindo](../../remindo) reminder API: create tasks, link
messaging platforms, and confirm or snooze reminders from the browser instead
of Telegram.

**Stack:** Vite · React 19 · TypeScript · TanStack Query · React Router ·
react-hook-form + zod · shadcn/ui + Tailwind v4

## Running it

The API must be running first (`npm run start:dev` in the API repo, with Mongo
and Redis up).

```bash
npm install
npm run dev        # http://localhost:5173
```

Point the dev server at a different API with `VITE_API_TARGET` (see
`.env.example`).

```bash
npm run typecheck  # tsc -b --noEmit
npm run build      # typecheck + production build
npm run api:types  # regenerate src/api/schema.d.ts from the live OpenAPI doc
```

## Two things to know before changing this

**The UI must stay same-origin with the API.** The refresh token is an
httpOnly cookie with `sameSite=strict` scoped to `/auth`, so a browser will
not send it cross-site — CORS does not change that. In development the Vite
proxy provides the shared origin; in production you need a reverse proxy or
the API serving this build.

The API mounts everything under `/api` (only `/health` sits at the root), so
SPA routes like `/tasks` and `/platforms` never collide with it. That prefix
is why the dev proxy is a single `/api` rule and why page refreshes on any
route work.

**Refresh must stay single-flight.** Refresh tokens rotate and the API revokes
the session when a rotated token is replayed. Two concurrent refreshes would
therefore log the user out, so `src/api/client.ts` funnels every caller
through one in-flight refresh promise. Preserve that if you touch it.

## Layout

```
src/
├── api/          generated schema, typed endpoints, fetch client, error types
├── features/
│   ├── auth/     session context + route guard
│   ├── tasks/    query hooks, task card, create/edit dialog
│   └── platforms/ link dialog (QR deep link), platform hooks
├── pages/        one component per route
├── components/   ui/ (shadcn) + layout
└── lib/          date/UTC helpers, display labels
```

`src/api/schema.d.ts` is generated — edit the API's DTOs and rerun
`npm run api:types` rather than hand-editing it.

## Notes on behaviour

- **Times are UTC on the server.** The UI shows local time everywhere and
  spells out the UTC anchor on recurring tasks, because a recurring task fires
  at the due date's UTC wall-clock and will drift against local time across
  DST.
- **Task creation requires a linked platform** (the API rejects otherwise), so
  the UI gates creation until Telegram is linked.
- **Task state changes without the user acting** — the queue worker escalates
  reminders, and confirmations may arrive from Telegram. Lists poll every 15s
  and refetch on window focus.
