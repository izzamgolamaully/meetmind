// src/app/api/stripe/checkout/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createCheckoutSession } from "@/lib/stripe"
import { trackEvent, EVENTS } from "@/lib/analytics"
import { z } from "zod"

const schema = z.object({
  priceId: z.string(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const checkoutSession = await createCheckoutSession({
    userId: session.user.id,
    priceId: parsed.data.priceId,
    successUrl: `${appUrl}/dashboard?upgrade=success`,
    cancelUrl: `${appUrl}/pricing`,
  })

  trackEvent(session.user.id, EVENTS.CHECKOUT_STARTED, {
    priceId: parsed.data.priceId,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
