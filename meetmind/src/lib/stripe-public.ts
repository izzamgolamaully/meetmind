// src/lib/stripe-public.ts
// Safe to import in client components — no secret keys

export const PLANS = {
  FREE: {
    name: "Starter",
    description: "Perfect for individuals",
    price: 0,
    priceId: null,
    features: [
      "5 meetings per month",
      "Basic transcript",
      "Email summaries",
      "1 integration",
      "7-day history",
    ],
  },
  PRO: {
    name: "Pro",
    description: "For growing teams",
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "",
    features: [
      "Unlimited meetings",
      "AI summaries + task extraction",
      "Slack & Jira/Linear sync",
      "Analytics dashboard",
      "90-day history",
      "Priority support",
      "Speaker identification",
    ],
    popular: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    description: "For large organisations",
    price: null,
    priceId: null,
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Data residency (EU/US)",
      "Custom integrations",
      "SLA guarantee",
      "Dedicated CSM",
      "Unlimited history",
      "Audit logs",
    ],
  },
} as const
