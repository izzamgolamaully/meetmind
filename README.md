# MeetMind — AI Meeting Intelligence Platform

> Record, transcribe, summarise, and track tasks from every meeting 

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Radix UI |
| Database | PostgreSQL via Prisma |
| Auth | NextAuth.js (Google + GitHub OAuth) |
| Payments | Stripe (subscriptions + webhooks) |
| AI — Transcription | OpenAI Whisper |
| AI — Summaries | Anthropic Claude Sonnet |
| AI — Speaker ID | AssemblyAI |
| Analytics | PostHog |
| Deployment | Vercel (lhr1 region) |
| Storage | AWS S3 / Cloudflare R2 |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourname/meetmind.git
cd meetmind
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in all required values (see .env.example for guidance)
```

### 3. Set up the database

```bash
# Push schema to your PostgreSQL database
npx prisma db push

# Optional: seed with test data
npx prisma db seed

# View/edit data in Prisma Studio
npx prisma studio
```

**Recommended database providers:**
- [Neon](https://neon.tech) (serverless PostgreSQL, free tier)
- [Supabase](https://supabase.com) (free tier with studio UI)
- [Railway](https://railway.app) (simple setup)

### 4. Set up Stripe

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create products and prices
stripe products create --name="MeetMind Pro"
stripe prices create \
  --product=prod_xxx \
  --unit-amount=2900 \
  --currency=gbp \
  --recurring[interval]=month

# Forward webhooks to local dev
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Update `STRIPE_PRO_MONTHLY_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### 5. Configure OAuth

**Google:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add `http://localhost:3000/api/auth/callback/google` as redirect URI

**GitHub:**
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Add `http://localhost:3000/api/auth/callback/github` as callback URL

### 6. Run development server

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
meetmind/
├── prisma/
│   └── schema.prisma          # Database schema (10 models)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth handler
│   │   │   ├── meetings/      # Meeting CRUD + process + chat
│   │   │   ├── tasks/         # Task CRUD
│   │   │   ├── stripe/        # Checkout + billing portal
│   │   │   └── webhooks/      # Stripe webhook handler
│   │   ├── auth/signin/       # Sign-in page
│   │   ├── dashboard/
│   │   │   ├── page.tsx       # Overview dashboard
│   │   │   ├── meetings/      # Meeting list + detail + new
│   │   │   ├── tasks/         # Kanban task board
│   │   │   ├── analytics/     # Charts & insights
│   │   │   └── settings/      # Billing + profile + integrations
│   │   └── pricing/           # Public pricing page
│   ├── components/
│   │   ├── dashboard/         # Sidebar, analytics charts
│   │   ├── meetings/          # Meeting chat panel
│   │   ├── providers/         # Session + PostHog providers
│   │   └── ui/                # Button, Card, Badge, Input, Toast
│   ├── lib/
│   │   ├── ai.ts              # Whisper + AssemblyAI + Claude pipeline
│   │   ├── analytics.ts       # PostHog server-side events
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Prisma singleton
│   │   ├── stripe.ts          # Stripe client + plan helpers
│   │   └── utils.ts           # Shared utilities
│   ├── types/index.ts         # TypeScript types
│   └── middleware.ts          # Route protection
├── .env.example               # All required env vars
├── vercel.json                # Vercel deployment config
└── tailwind.config.ts
```

---

## Key Features

### AI Meeting Pipeline

```
Audio Upload / Browser Recording
        ↓
OpenAI Whisper (transcription)
        ↓
AssemblyAI (optional — speaker diarisation)
        ↓
Claude Sonnet (summary: TLDR, key points, decisions, next steps, sentiment)
        ↓
Claude Sonnet (task extraction: title, assignee, due date, priority)
        ↓
Tasks stored in DB → sync to Jira / Linear / Slack
```

### Stripe Subscription Flow

```
User clicks "Upgrade" → POST /api/stripe/checkout
        ↓
Stripe Checkout (hosted payment page)
        ↓
checkout.session.completed webhook fires
        ↓
POST /api/webhooks/stripe handles:
  - customer.subscription.created → set plan = PRO
  - customer.subscription.updated → update period end
  - customer.subscription.deleted → downgrade to FREE
  - invoice.payment_failed → notify user
```

### Plan Limits

| Feature | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Meetings/month | 5 | Unlimited | Unlimited |
| History | 7 days | 90 days | Unlimited |
| Integrations | 1 | All | All + custom |
| AI chat | ✗ | ✓ | ✓ |
| Speaker ID | ✗ | ✓ | ✓ |

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
# ... (repeat for all vars in .env.example)

# Deploy to production
vercel --prod
```

**After deploying:**
1. Update `NEXTAUTH_URL` to your production URL
2. Update OAuth redirect URIs in Google/GitHub
3. Update Stripe webhook endpoint to `https://your-app.vercel.app/api/webhooks/stripe`
4. Update PostHog allowed domains

---

## Social Distribution Channels

| Channel | Content Strategy |
|---------|----------------|
| **X / Twitter** | Daily tip tweets, meeting horror stories, feature demos |
| **TikTok** | 30-60s screen recordings of AI summaries, "meetings roasted by AI" |
| **Instagram** | Carousels (before/after meeting notes), workplace productivity |
| **Canva** | Branded infographic templates for resharing |
| **ProductHunt** | Launch on Tuesday with hunter support |
| **LinkedIn** | Long-form posts on async-first culture, ROI of meeting tools |

---

## Environment Variables Reference

See `.env.example` for the complete list with descriptions.

**Required to run locally:**
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — random 32+ char string (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000`
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`

---

## License

MIT © 2026 MeetMind Ltd.
