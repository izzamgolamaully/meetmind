// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { stripe, handleSubscriptionChange } from "@/lib/stripe"
import { trackEvent, EVENTS } from "@/lib/analytics"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message)
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ── Subscription created or updated ──────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)

        const userId = subscription.metadata.userId
        if (userId && event.type === "customer.subscription.created") {
          trackEvent(userId, EVENTS.SUBSCRIPTION_CREATED, {
            plan: subscription.items.data[0]?.price.id,
          })
        }
        break
      }

      // ── Subscription cancelled / deleted ─────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription)

        const userId = subscription.metadata.userId
        if (userId) {
          trackEvent(userId, EVENTS.SUBSCRIPTION_CANCELLED)
        }
        break
      }

      // ── Payment succeeded ─────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          await handleSubscriptionChange(subscription)
        }
        break
      }

      // ── Payment failed ────────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
          select: { id: true, email: true },
        })

        if (user) {
          console.warn(`Payment failed for user ${user.id} (${user.email})`)
          // TODO: send email notification via Resend/SendGrid
        }
        break
      }

      // ── Checkout completed ────────────────────────────────────────────────
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session
        if (checkoutSession.mode === "subscription" && checkoutSession.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            checkoutSession.subscription as string
          )
          await handleSubscriptionChange(subscription)
        }
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }
  } catch (err) {
    console.error("Error processing Stripe webhook:", err)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// Stripe requires raw body — disable body parser
export const runtime = "nodejs"
