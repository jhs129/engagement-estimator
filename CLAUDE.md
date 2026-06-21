# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note from AGENTS.md**: This is Next.js 16 with breaking changes. Read `node_modules/next/dist/docs/` before writing any Next.js-specific code.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # prisma generate + next build
pnpm lint             # ESLint
pnpm test             # Vitest (all tests)
pnpm vitest run src/lib/calculations/__tests__/epics.test.ts  # Single test file
pnpm prisma migrate dev   # Apply schema changes
pnpm prisma db seed       # Seed labor roles (uses DATABASE_URL_UNPOOLED)
```

## Architecture

### Page ↔ Grid pattern

Every estimate tab follows the same split:

- **Server page** (`src/app/(main)/estimates/[id]/*/page.tsx`): fetches data via Prisma, checks ownership (`createdById === user.id || user.role === 'ADMIN'`), shapes data into typed rows, then renders the client Grid component as a leaf.
- **Client Grid** (`src/components/*Grid/index.tsx`): receives `initialRows` as props, manages optimistic local state, calls REST API routes for mutations, and handles drag-to-reorder.

All estimate tab pages have `export const dynamic = 'force-dynamic'` because they require per-request auth checks.

### Data flow for mutations

Grid components call their own API routes (`/api/estimates/[id]/*/`) — never Prisma directly. API routes call `getAuthedUser()` from `src/lib/api-auth.ts` (which wraps `auth()` and resolves the DB user) for every write.

### Auth layers

1. **Session auth** (`src/lib/auth.ts`) — NextAuth v5 beta, Google + Microsoft Entra ID, Prisma adapter, session stored in DB. Used for the web UI.
2. **API token auth** — hashed tokens in `ApiToken` table, verified in API routes.
3. **OAuth 2.1 server** (`src/lib/oauth/`, routes at `/oauth/*`) — full PKCE authorization server that issues JWTs for MCP access. Consent page, token endpoint, JWKS endpoint.
4. **MCP auth** (`src/lib/mcp/auth.ts`) — verifies OAuth JWTs, enforces `McpAccess` scope on every tool call.

### MCP server

`/api/mcp` is a Model Context Protocol endpoint using `mcp-handler`. Tools are registered in `src/lib/mcp/tools.ts` and delegate to scope-enforcing data functions in `src/lib/mcp/data.ts`. All tools require a valid OAuth token (`withMcpAuth({ required: true })`).

### Calculations

Pure functions in `src/lib/calculations/` (no DB calls, fully unit-tested with Vitest):
- `epics.ts` — rolls up story hours per epic, adds QA foundation hours using configurable ratios stored on the Estimate model
- `investment.ts` — computes rack fees and client investment from `adjustedClientRate ?? rackRate`, applies `riskPremiumPct` multiplier for fixed-price totals
- `staffing.ts` — compares planned (story staffing) vs. scheduled (week-by-week) hours; returns green/yellow/red delta status (±10% = green, ±25% = yellow)
- `qa-ratios.ts` — validates and normalizes the five QA ratio fields

### Database

Neon PostgreSQL via `@prisma/adapter-neon`. The runtime client (`src/lib/prisma.ts`) uses the pooled `DATABASE_URL`. The seed script uses `DATABASE_URL_UNPOOLED` (falling back to `DATABASE_URL`) because Neon's pooler doesn't support certain migrations/DDL operations.

Two separate `prisma/` folders exist (one for each environment config) — always run `prisma migrate dev` against the project root schema.

### Design system

CC brand colors and fonts are defined as CSS custom properties in `src/app/globals.css`:
- Colors: `--cc-black`, `--cc-parchment` (background), `--cc-burnt-sienna` (primary action), `--cc-gray-mid`, `--cc-gray-light`, `--cc-off-white`
- Fonts: `--font-display` (IBM Plex Sans, headers/labels), `--font-body` (Inter, body text)

Grid UIs use raw `<table>` elements with inline styles sourced from `src/components/ui/gridShared.tsx` (constants like `GRID_TD_STYLE`, `GRID_HEADER_CELL_STYLE`). shadcn/ui components are available for non-grid UI elements but the grids intentionally bypass them.

### Component structure

Grid components with more than ~100 lines live in a directory named after them with:
- `index.tsx` — main component + its Props interface
- `types.ts` — row/column TypeScript types
- `csvExport.ts` — CSV download logic
- `*RowItem.tsx` — individual row component

### Roles

Three user roles (`ADMIN`, `CLIENT_ADMIN`, `USER`) are stored on `User.role`. Most data access checks only `ADMIN` vs. the creator; `CLIENT_ADMIN` is reserved for future use. The admin section (`/admin/*`) manages `Client`, `Project`, and `LaborRole` records.
