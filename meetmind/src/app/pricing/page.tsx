"use client"
// src/app/pricing/page.tsx
import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { CheckCircle, Zap, ArrowLeft, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toaster"
import { PLANS } from "@/lib/stripe-public"

const PLAN_ORDER = ["FREE", "PRO", "ENTERPRISE"] as const

export default function PricingPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")

  async function handleCTA(planKey: string) {
    if (planKey === "FREE") {
      window.location.href = session ? "/dashboard" : "/auth/signin"
      return
    }
    if (planKey === "ENTERPRISE") {
      window.location.href = "mailto:hello@meetmind.ai?subject=Enterprise enquiry"
      return
    }
    if (!session) {
      window.location.href = "/auth/signin"
      return
    }

    setLoading(planKey)
    const priceId = billing === "yearly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID
      : process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast({ title: "Something went wrong", variant: "error" })
    setLoading(null)
  }

  const faqItems = [
    { q: "Can I try Pro before paying?", a: "Yes — every new signup gets a 14-day free trial with full Pro features. No card required." },
    { q: "How does the meeting limit work?", a: "The free plan allows 5 meetings per calendar month. Pro and Enterprise have no limits." },
    { q: "What audio formats are supported?", a: "We support MP3, WAV, M4A, OGG, WebM, and direct browser recording up to 500MB per file." },
    { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing portal and you'll retain access until the end of the billing period." },
    { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. We're SOC 2 Type II certified with optional EU data residency." },
    { q: "Do you offer team pricing?", a: "Pro is per-seat. Enterprise includes volume discounts — contact us for custom pricing." },
  ]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <div className="flex items-center gap-2 font-syne font-bold text-lg">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center">
            <span className="text-accent text-xs font-black">M</span>
          </div>
          MeetMind
        </div>
        {session ? (
          <Link href="/dashboard"><Button variant="outline" size="sm">Dashboard</Button></Link>
        ) : (
          <Link href="/auth/signin"><Button size="sm">Sign in</Button></Link>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="info" className="mb-4">Simple pricing</Badge>
          <h1 className="font-syne text-4xl font-bold text-gray-900 mb-4">
            Pay for what you use,<br />cancel anytime
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            No hidden seat fees, no storage limits, no surprises. Powered by Stripe.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setBilling("monthly")}
              className={`text-sm px-4 py-1.5 rounded-full transition-all ${
                billing === "monthly" ? "bg-brand text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`text-sm px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                billing === "yearly" ? "bg-brand text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Yearly
              <span className="bg-emerald-100 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full">−20%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-3 gap-5 mb-20">
          {PLAN_ORDER.map((planKey) => {
            const plan = PLANS[planKey]
            const isPopular = (plan as any).popular
            const price = plan.price
            const yearlyPrice = typeof price === "number" && price > 0 ? Math.round(price * 0.8) : price
            const displayPrice = billing === "yearly" ? yearlyPrice : price

            return (
              <div
                key={planKey}
                className={`relative rounded-3xl border p-7 flex flex-col ${
                  isPopular
                    ? "border-violet-300 bg-white shadow-xl shadow-violet-100"
                    : "border-gray-200 bg-white"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="font-syne font-bold text-lg text-gray-900 mb-1">{plan.name}</h2>
                  <p className="text-sm text-gray-500">{plan.description}</p>
                </div>

                <div className="mb-6">
                  {displayPrice === null ? (
                    <p className="font-syne text-3xl font-bold text-gray-900">Custom</p>
                  ) : displayPrice === 0 ? (
                    <p className="font-syne text-3xl font-bold text-gray-900">Free</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-400 text-lg">£</span>
                      <span className="font-syne text-4xl font-bold text-gray-900">{displayPrice}</span>
                      <span className="text-gray-400 text-sm">/seat/mo</span>
                    </div>
                  )}
                  {billing === "yearly" && typeof price === "number" && price > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">Billed annually · save £{(price - (yearlyPrice as number)) * 12}/yr</p>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isPopular ? "violet" : "outline"}
                  className="w-full"
                  loading={loading === planKey}
                  onClick={() => handleCTA(planKey)}
                >
                  {planKey === "FREE" ? "Get started free" :
                   planKey === "ENTERPRISE" ? "Contact sales" :
                   session ? "Upgrade now" : "Start free trial"}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-8 mb-20 flex-wrap">
          {[
            { icon: "🔒", text: "SOC 2 Type II certified" },
            { icon: "🇪🇺", text: "GDPR compliant" },
            { icon: "💳", text: "Stripe-powered payments" },
            { icon: "🛡️", text: "End-to-end encryption" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-gray-500">
              <span>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-syne text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="font-medium text-gray-900 mb-2">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
