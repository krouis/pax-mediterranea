# Deployment

Node 24 and `npm ci` produce the static `dist` directory. `vite.config.ts` fixes the base to
`/pax-mediterranea/`; assets and service-worker navigation therefore work on GitHub Pages. Validate
with `npm run check`, then `npm run build` and preview the exact subpath.

The Pages workflow runs validation on `main`, configures Pages, uploads `dist`, and deploys only if
checks succeed. Repository Pages settings must select GitHub Actions as the source. The service
worker precaches hashed assets, removes old caches, and prompts “Reload updated version” rather than
silently replacing a live session.
