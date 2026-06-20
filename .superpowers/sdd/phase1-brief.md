# Phase 1: Project Scaffolding & Auth — Task Brief

## What this task builds

Bootstrap the entire Next.js 15 project from a bare git repo (only a .gitignore exists).
Set up the Chameleon Collective brand system, copy the auth layer from a sibling project,
and get a working Next.js app that builds cleanly.

This is Phase 1 of 11. It produces: a working Next.js app skeleton with CC branding,
NextAuth.js v5 auth configured (Google + Microsoft Entra ID), Prisma schema with auth
tables, middleware protection, and a clean `pnpm build`.

## Working directory

`/Users/johnhschneider/dev/engagement-estimator`

The directory already exists with only a `.gitignore`. Initialize the Next.js app **inside
this directory** using `pnpm create next-app@latest .` (note the `.`).

## Source project to copy from

`/Users/johnhschneider/dev/roadmap` — a production Next.js app with identical auth setup.
Read files from there to understand patterns, then recreate them adapted for this project.

## Step-by-step requirements

### Step 1: Bootstrap Next.js app

Run inside `/Users/johnhschneider/dev/engagement-estimator`:
```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack
```
Choose defaults if prompted. This creates the Next.js app in the current directory.

### Step 2: Install dependencies

```bash
pnpm add prisma @prisma/client next-auth@beta @auth/prisma-adapter @neondatabase/serverless zod jose mcp-handler @modelcontextprotocol/sdk
pnpm add -D @types/node tsx vitest @vitejs/plugin-react jsdom @testing-library/react
```

Also install shadcn/ui:
```bash
pnpm dlx shadcn@latest init
```
When prompted for style: Default. Base color: Neutral. Use CSS variables: Yes.

### Step 3: Chameleon Collective Brand System

In `src/app/globals.css`, replace the default Tailwind directives with CC brand tokens:

```css
@import "tailwindcss";

@layer base {
  :root {
    --cc-black: #121212;
    --cc-white: #ffffff;
    --cc-parchment: #EAE4C8;
    --cc-burnt-sienna: #EA633F;
    --cc-straw: #E8EB74;
    --cc-electric-blue: #88E8F0;
    --cc-near-black: #262626;
    --cc-charcoal: #212121;
    --cc-gray-mid: #5B5B5B;
    --cc-gray-light: #D9D9D9;
    --cc-off-white: #F3F3F3;
    --cc-teal: #0097A7;

    --background: var(--cc-parchment);
    --foreground: var(--cc-black);
    --primary: var(--cc-burnt-sienna);
    --primary-foreground: var(--cc-white);
    --secondary: var(--cc-near-black);
    --secondary-foreground: var(--cc-white);
    --muted: var(--cc-off-white);
    --muted-foreground: var(--cc-gray-mid);
    --border: var(--cc-gray-light);
    --radius: 0px;

    --font-display: 'IBM Plex Sans', sans-serif;
    --font-body: 'Inter', sans-serif;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    background-color: var(--cc-parchment);
    color: var(--cc-black);
    font-family: var(--font-body);
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
  }
}
```

In `src/app/layout.tsx`, add Google Fonts (IBM Plex Sans + Inter) via next/font:

```tsx
import { IBM_Plex_Sans, Inter } from 'next/font/google'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
})
```

Apply both font variables to the `<html>` element's className.

In `tailwind.config.ts` (or `tailwind.config.js`), extend colors with CC brand colors:
```ts
colors: {
  'cc-black': '#121212',
  'cc-white': '#ffffff',
  'cc-parchment': '#EAE4C8',
  'cc-burnt-sienna': '#EA633F',
  'cc-straw': '#E8EB74',
  'cc-electric-blue': '#88E8F0',
  'cc-near-black': '#262626',
  'cc-gray-mid': '#5B5B5B',
  'cc-gray-light': '#D9D9D9',
  'cc-off-white': '#F3F3F3',
},
borderRadius: { DEFAULT: '0px', none: '0px', sm: '0px', md: '0px', lg: '0px', full: '9999px' },
fontFamily: {
  display: ['var(--font-display)', 'sans-serif'],
  body: ['var(--font-body)', 'sans-serif'],
},
```

### Step 4: Configure shadcn for flat/no-radius CC style

In `components.json` (created by shadcn init), set:
```json
{
  "style": "default",
  "rsx": false,
  "tailwind": { "baseColor": "neutral", "cssVariables": true },
  "aliases": { "components": "@/components/ui", "utils": "@/lib/utils" }
}
```

### Step 5: Copy and adapt auth files from roadmap

Read the following roadmap files and recreate them adapted for this project:

**Read:** `/Users/johnhschneider/dev/roadmap/src/lib/auth.config.ts`
**Create:** `src/lib/auth.config.ts`
Copy as-is. This configures Google + Microsoft Entra ID OAuth providers.

**Read:** `/Users/johnhschneider/dev/roadmap/src/lib/auth.ts`
**Create:** `src/lib/auth.ts`
Copy, adapting any imports for the new project's paths. This sets up NextAuth with
Prisma adapter, JWT session strategy, and signIn callbacks.

**Read:** `/Users/johnhschneider/dev/roadmap/src/proxy.ts`
**Create:** `src/proxy.ts`
Copy as-is. This is the NextAuth middleware protecting all routes.

**Create:** `src/lib/prisma.ts`
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Step 6: Copy OAuth 2.1 implementation from roadmap

Read each file from `/Users/johnhschneider/dev/roadmap/src/lib/oauth/` and recreate
all files in `src/lib/oauth/`:
- `jwt.ts` — JWT signing/verification
- `keys.ts` — RSA key management
- `pkce.ts` — PKCE challenge/verifier
- `authorize.ts` — Authorization logic
- `config.ts` — OAuth constants
- `urls.ts` — URL resolution
- `tokens.ts` — Token generation

Also copy:
- `/Users/johnhschneider/dev/roadmap/src/lib/tokens.ts` → `src/lib/tokens.ts` (PAT hashing)

### Step 7: Copy OAuth route handlers from roadmap

Read and recreate these route files from roadmap under this project's `src/app/`:

From roadmap `src/app/(main)/oauth/` → recreate at `src/app/(main)/oauth/`:
- `authorize/route.ts`
- `token/route.ts`
- `register/route.ts`
- `consent/page.tsx`

From roadmap `src/app/.well-known/` → recreate at `src/app/.well-known/`:
- `oauth-authorization-server/route.ts`
- `jwks.json/route.ts`

### Step 8: Prisma schema (auth tables only — estimation tables come in Phase 2)

Run `pnpm prisma init --datasource-provider postgresql`

In `prisma/schema.prisma`, set up ONLY the auth/user tables (estimation models come in Phase 2).

Read `/Users/johnhschneider/dev/roadmap/prisma/schema.prisma` and copy:
- `User` model (with custom fields: firstName, lastName, role)
- `Account` model (NextAuth)
- `Session` model (NextAuth)
- `VerificationToken` model (NextAuth)
- `ApiToken` model (PATs)
- `OAuthClient` model
- `OAuthAuthCode` model
- `OAuthRefreshToken` model
- `OAuthConsent` model
- `Role` enum

Do NOT copy Opportunity, Note, Client, Project, etc. — those are roadmap-specific.

### Step 9: Create .env.example

Create `.env.example` (not `.env.local` — that has real secrets):
```
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="generate-with: openssl rand -base64 32"
ADMIN_EMAIL="your-email@chameleon.co"

# Google OAuth (from Google Cloud Console)
AUTH_GOOGLE_CLIENT_ID=""
AUTH_GOOGLE_CLIENT_SECRET=""

# Microsoft Entra ID (from Azure Portal)
AUTH_MICROSOFT_ENTRA_ID_ID=""
AUTH_MICROSOFT_ENTRA_ID_SECRET=""
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=""
```

Create `.env.local` with placeholder values so the build doesn't fail:
```
DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
AUTH_SECRET="placeholder-secret-32-chars-minimum-length"
ADMIN_EMAIL="admin@chameleon.co"
AUTH_GOOGLE_CLIENT_ID="placeholder"
AUTH_GOOGLE_CLIENT_SECRET="placeholder"
AUTH_MICROSOFT_ENTRA_ID_ID="placeholder"
AUTH_MICROSOFT_ENTRA_ID_SECRET="placeholder"
AUTH_MICROSOFT_ENTRA_ID_TENANT_ID="placeholder"
```

### Step 10: Create Next.js app structure

Create the app router structure. All routes go under a `(main)` route group:

`src/app/(main)/layout.tsx` — wraps with SessionProvider, basic nav shell
`src/app/(main)/page.tsx` — placeholder: "Estimates Dashboard (coming soon)"
`src/app/(main)/login/page.tsx` — sign-in page with Google + Entra ID buttons
`src/app/layout.tsx` — root layout with fonts + global CSS

For the login page, read `/Users/johnhschneider/dev/roadmap/src/app/(main)/login/page.tsx`
and recreate adapted with CC branding (parchment background, burnt-sienna CTA buttons,
IBM Plex Sans headings).

Also create a placeholder `src/app/api/auth/[...nextauth]/route.ts`:
```ts
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

### Step 11: Configure next.config

In `next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {},
}

export default nextConfig
```

### Step 12: Verify build

Run:
```bash
pnpm prisma generate
pnpm build
```

Fix any TypeScript or ESLint errors that appear. The build MUST pass before committing.

### Step 13: Commit

```bash
git add -A
git commit -m "feat: bootstrap Next.js app with CC branding and auth layer"
```

## Global Constraints (apply to every file you create)

- Package manager: pnpm only
- No `Math.random()` in a way that risks hydration mismatches
- All interfaces: no `Omit`, `NonNullable`, or complex utility types — define plainly
- Components >100 lines with sub-components → split into `ComponentName/index.tsx` directory
- `border-radius: 0` everywhere — NO rounded corners (CC brand is flat/geometric)
- Primary font for headings/labels: IBM Plex Sans
- Body font: Inter
- Primary page background: #EAE4C8 (parchment), NOT white
- Primary accent: #EA633F (burnt-sienna) for CTAs and highlights
- Do NOT bump package.json version
- After the task: `pnpm build` must pass with zero errors

## Verification

The task is complete when:
1. `pnpm build` passes with no TypeScript or ESLint errors
2. `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/proxy.ts` all exist and compile
3. `prisma/schema.prisma` contains User, Account, Session, VerificationToken, ApiToken, and OAuth models
4. `src/app/(main)/login/page.tsx` exists with CC branding
5. `.env.example` documents all required environment variables
6. Everything committed to git

## Report

Write your full report to: `/Users/johnhschneider/dev/engagement-estimator/.superpowers/sdd/phase1-report.md`

Include:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- What was implemented (list of files created/modified)
- Commits made (short hashes)
- Test/build summary
- Any concerns or deviations from the brief
