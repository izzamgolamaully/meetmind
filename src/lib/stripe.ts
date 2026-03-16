// src/lib/stripe.ts
import Stripe from "stripe"
import { prisma } from "./prisma"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
})

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
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
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
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
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
}

export async function createCheckoutSession({
  userId,
  priceId,
  successUrl,
  cancelUrl,
}: {
  userId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, email: true },
  })

  if (!user) throw new Error("User not found")

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId ?? undefined,
    customer_email: !user.stripeCustomerId ? user.email ?? undefined : undefined,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
    allow_promotion_codes: true,
  })

  return session
}

export async function createBillingPortalSession({
  userId,
  returnUrl,
}: {
  userId: string
  returnUrl: string
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) throw new Error("No Stripe customer")

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: returnUrl,
  })

  return session
}

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId
  if (!userId) return

  const priceId = subscription.items.data[0]?.price.id
  const status = subscription.status

  let plan: "FREE" | "PRO" | "ENTERPRISE" = "FREE"
  if (priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID || priceId === process.env.STRIPE_PRO_YEARLY_PRICE_ID) {
    plan = "PRO"
  } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    plan = "ENTERPRISE"
  }

  if (status === "active" || status === "trialing") {
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        stripePriceId: priceId,
        stripeSubscriptionId: subscription.id,
        stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })
  } else {
    // Subscription cancelled or past due — downgrade to free
    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: "FREE",
        stripePriceId: null,
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: null,
      },
    })
  }
}
