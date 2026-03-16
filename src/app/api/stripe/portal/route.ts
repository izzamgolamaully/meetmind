// src/app/api/stripe/portal/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createBillingPortalSession } from "@/lib/stripe"

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const portalSession = await createBillingPortalSession({
    userId: session.user.id,
    returnUrl: `${appUrl}/dashboard/settings`,
  })

  return NextResponse.json({ url: portalSession.url })
}
