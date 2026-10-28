# Gerbi Travel

Hebrew, RTL travel-planning prototype with live flight search and price revalidation.

## Run locally

Requires Node.js 22 or newer. No application dependencies need installation.

```sh
cd gerbi
cp .env.example .env
# Configure supplier credentials in .env for live flight search.
npm run dev
```

Open http://localhost:4173. Booking and payment are not implemented.

## Repository layout

- `gerbi/`: runnable application, backend, tests, documentation, and verification screenshots.
- `generated-assets/`: original generated brand and background assets.
- [Application documentation](gerbi/README.md)
- [UX review, 2026-10-28 (Hebrew)](gerbi/docs/ux-review-2026-10-28-he.md)
- [UX specification (Hebrew)](gerbi/docs/ux-specification-he.md)

Credentials, local learning data, and system files are excluded from version control.

## Verification

```sh
cd gerbi
npm run check
npm test
```
