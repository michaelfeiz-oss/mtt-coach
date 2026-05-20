# Mobile / PWA Plan

The MTT Study app is currently a local-only Docker app at `http://localhost:3100`.
It is not ready for public exposure because the local admin/editing surfaces are not password-protected.

## Current Status

- Local-only SQLite app.
- Docker binds to localhost on port `3100`.
- Review scenarios are metadata-only and do not approve charts.
- Public deployment should wait until auth is implemented.

## Mobile Readiness Checklist

Check these routes at phone width before exposing beyond localhost:

- `/strategy/review-scenarios`
- `/strategy/trainer`
- `/strategy/library`
- `/admin/audit`

For each route:

- Filters remain reachable.
- Tables or long rows do not force a horizontal-only workflow.
- Owner decision controls work with touch.
- Notes fields are usable on phone.
- Buttons are large enough to tap.
- Bottom/side navigation does not hide important controls.

## PWA Direction

If this app becomes a PWA later:

- Add a web app manifest.
- Add service worker/installability support.
- Test install on iPhone Safari.
- Keep offline behavior conservative because strategy review data must not silently conflict.
- Keep backup/export visible before any destructive local reset.

## Deployment Notes

- GitHub pushes can trigger hosted deployments if connected to Vercel or a similar platform.
- Do not expose the app publicly without auth.
- If moving from SQLite to a hosted database, Supabase or any browser-accessible database must use row-level security policies before exposing user data.
- If using a hosted backend, keep strategy truth on the server and do not let browser clients mutate approved snapshots directly.

