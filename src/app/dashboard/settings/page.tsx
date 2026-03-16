"use client"
// src/app/dashboard/settings/page.tsx
import { useState } from "react"
import { useSession } from "next-auth/react"
import { CreditCard, User, Bell, Shield, Zap, ExternalLink, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/toaster"
import { PLANS } from "@/lib/stripe-public"

const INTEGRATIONS = [
  { id: "slack", name: "Slack", desc: "Post summaries to channels", icon: "💬", connected: false },
  { id: "jira", name: "Jira", desc: "Auto-create issues from tasks", icon: "🎯", connected: false },
  { id: "linear", name: "Linear", desc: "Sync tasks to Linear projects", icon: "⚡", connected: false },
  { id: "notion", name: "Notion", desc: "Export summaries to pages", icon: "📝", connected: false },
  { id: "google-calendar", name: "Google Calendar", desc: "Auto-join scheduled meetings", icon: "📅", connected: false },
  { id: "zoom", name: "Zoom", desc: "One-click meeting recording", icon: "🎥", connected: false },
]

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [billingLoading, setBillingLoading] = useState(false)
  const [tab, setTab] = useState<"profile" | "billing" | "integrations" | "notifications">("billing")

  const plan = (session?.user?.plan ?? "FREE") as keyof typeof PLANS
  const planConfig = PLANS[plan]

  async function openBillingPortal() {
    setBillingLoading(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast({ title: "Could not open billing portal", variant: "error" })
    setBillingLoading(false)
  }

  async function startCheckout(priceId: string) {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast({ title: "Could not start checkout", variant: "error" })
  }

  const tabs = [
    { id: "billing", label: "Billing & plan", icon: CreditCard },
    { id: "profile", label: "Profile", icon: User },
    { id: "integrations", label: "Integrations", icon: Zap },
    { id: "notifications", label: "Notifications", icon: Bell },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-syne text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account, billing, and integrations</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === id
                ? "border-violet-500 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Billing tab */}
      {tab === "billing" && (
        <div className="space-y-5">
          {/* Current plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current plan</CardTitle>
                  <CardDescription className="mt-1">
                    You are on the <strong>{planConfig.name}</strong> plan
                    {plan !== "FREE" && " · Renews monthly via Stripe"}
                  </CardDescription>
                </div>
                <Badge className={
                  plan === "PRO" ? "bg-violet-100 text-violet-700" :
                  plan === "ENTERPRISE" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                }>
                  {planConfig.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-5">
                {planConfig.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan === "FREE" ? (
                <Button
                  variant="violet"
                  onClick={() => startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "")}
                  className="gap-2"
                >
                  <Zap size={14} /> Upgrade to Pro — £29/month
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={openBillingPortal}
                  loading={billingLoading}
                  className="gap-2"
                >
                  <ExternalLink size={14} /> Manage billing & invoices
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Plan comparison */}
          {plan === "FREE" && (
            <Card>
              <CardHeader><CardTitle>Upgrade to Pro</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {(["FREE", "PRO"] as const).map((p) => {
                    const config = PLANS[p]
                    const isCurrentPlan = plan === p
                    return (
                      <div
                        key={p}
                        className={`rounded-2xl border p-5 ${
                          p === "PRO"
                            ? "border-violet-300 bg-violet-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-syne font-bold text-sm">{config.name}</span>
                          {isCurrentPlan && <Badge variant="default">Current</Badge>}
                          {(config as any).popular && !isCurrentPlan && <Badge variant="info">Popular</Badge>}
                        </div>
                        <p className="font-syne text-2xl font-bold text-gray-900 mb-4">
                          {config.price === 0 ? "Free" : `£${config.price}/mo`}
                        </p>
                        <ul className="space-y-1.5">
                          {config.features.map((f) => (
                            <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                              <CheckCircle size={12} className="text-emerald-500" /> {f}
                            </li>
                          ))}
                        </ul>
                        {!isCurrentPlan && (
                          <Button
                            variant="violet"
                            size="sm"
                            className="w-full mt-4"
                            onClick={() => startCheckout(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "")}
                          >
                            Upgrade now
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === "profile" && (
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              {session?.user?.image ? (
                <img src={session.user.image} className="w-14 h-14 rounded-2xl" alt="" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-xl font-bold text-violet-600">
                  {session?.user?.name?.[0] ?? "U"}
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-sm text-gray-500">{session?.user?.email}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input defaultValue={session?.user?.name ?? ""} placeholder="Your name" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input defaultValue={session?.user?.email ?? ""} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-400">Email is managed by your OAuth provider</p>
            </div>
            <Button onClick={() => toast({ title: "Profile updated", variant: "success" })}>
              Save changes
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Integrations tab */}
      {tab === "integrations" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Connect MeetMind to your tools to auto-sync tasks and summaries.
            {plan === "FREE" && " Some integrations require a Pro plan."}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {INTEGRATIONS.map((integration) => {
              const requiresPro = ["jira", "linear", "notion"].includes(integration.id)
              const locked = requiresPro && plan === "FREE"
              return (
                <Card key={integration.id} className={locked ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
                          {integration.icon}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{integration.name}</p>
                          <p className="text-xs text-gray-500">{integration.desc}</p>
                        </div>
                      </div>
                      {locked ? (
                        <Badge variant="warning">Pro</Badge>
                      ) : integration.connected ? (
                        <Badge variant="success">Connected</Badge>
                      ) : null}
                    </div>
                    <Button
                      variant={integration.connected ? "outline" : "ghost"}
                      size="sm"
                      className="w-full mt-3"
                      disabled={locked}
                      onClick={() => toast({ title: `${integration.name} integration coming soon!` })}
                    >
                      {integration.connected ? "Disconnect" : locked ? "Requires Pro" : "Connect"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && (
        <Card>
          <CardHeader><CardTitle>Notification preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Meeting summary ready", desc: "Get emailed when your meeting is processed", defaultChecked: true },
              { label: "Task assigned to you", desc: "Notify when someone assigns you a task", defaultChecked: true },
              { label: "Weekly digest", desc: "Summary of your week's meetings and tasks", defaultChecked: false },
              { label: "Product updates", desc: "New features and improvements", defaultChecked: false },
            ].map(({ label, desc, defaultChecked }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-violet-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                </label>
              </div>
            ))}
            <Button onClick={() => toast({ title: "Preferences saved", variant: "success" })}>
              Save preferences
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
