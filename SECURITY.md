# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

Instead, use GitHub's private vulnerability reporting:
open [**Security → Report a vulnerability**](../../security/advisories/new).
We'll respond as soon as we can and coordinate a fix and disclosure.

## Scope & good practices

This project is **self-hosted** — each deployment holds its own secrets. If you
run InstaChat, remember:

- Never commit secrets. `.env*`, `CLAUDE.md` and `AGENTS.md` are gitignored.
- The `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — keep it server-side only
  (it is never exposed to the browser in this codebase).
- Set a strong `PANEL_PASSWORD` in production (the `/painel` route is gated by it).
- Rotate `WEBHOOK_VERIFY_TOKEN` and `CRON_SECRET` if you ever suspect exposure.

Reports about a **specific deployment** (someone's own instance) should go to
that instance's operator, not here. This policy covers vulnerabilities in the
**source code** of this repository.
