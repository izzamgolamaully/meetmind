// src/app/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Mic, ArrowRight, CheckCircle, Zap, Shield, Video } from "lucide-react"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // Logged-in users go straight to dashboard
  if (session) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2 font-syne font-bold text-xl">
          <div className="w-8 h-8 bg-[#00E5A0] rounded-lg flex items-center justify-center">
            <Mic size={15} className="text-[#0D0D0D]" />
          </div>
          MeetMind
        </div>
        <div className="flex items-center gap-6 text-sm text-white/60">
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="/auth/signin" className="hover:text-white transition-colors">Sign in</Link>
          <Link
            href="/auth/signin"
            className="bg-white text-[#0D0D0D] px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/60 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5A0]" />
          AI-powered meeting intelligence
        </div>

        <h1 className="font-syne text-5xl md:text-6xl font-bold leading-[1.07] tracking-tight mb-6">
          Stop losing{" "}
          <span className="text-[#7B5CF0]">decisions</span>
          <br />in meeting noise.
        </h1>

        <p className="text-white/50 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          MeetMind records, transcribes, summarises, and auto-assigns tasks from every meeting —
          so your team ships faster and wastes less time.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/auth/signin"
            className="flex items-center gap-2 bg-white text-[#0D0D0D] px-6 py-3 rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Start for free <ArrowRight size={15} />
          </Link>
          <Link
            href="/pricing"
            className="flex items-center gap-2 border border-white/20 px-6 py-3 rounded-full text-white/70 hover:border-white/40 hover:text-white transition-all"
          >
            View pricing
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 mt-8 text-xs text-white/30">
          <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00E5A0]" /> No card required</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00E5A0]" /> 14-day free trial</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00E5A0]" /> Setup in 2 minutes</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-8 pb-24">
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Mic, title: "Smart recording", desc: "One-click recording across Zoom, Meet, and Teams. Auto-detects and labels speakers.", colour: "text-[#00E5A0]", bg: "bg-[#00E5A0]/10" },
            { icon: Zap, title: "Instant AI summaries", desc: "TLDR, key decisions, and next steps delivered to Slack within 60 seconds of hang-up.", colour: "text-[#7B5CF0]", bg: "bg-[#7B5CF0]/10" },
            { icon: CheckCircle, title: "Auto task tracking", desc: "Action items extracted and synced to Jira, Linear, or Asana — no manual entry.", colour: "text-[#00E5A0]", bg: "bg-[#00E5A0]/10" },
            { icon: Video, title: "Searchable transcripts", desc: "Full-text search across every meeting ever recorded. Find any quote in seconds.", colour: "text-[#7B5CF0]", bg: "bg-[#7B5CF0]/10" },
            { icon: Shield, title: "Enterprise security", desc: "SOC 2 Type II, end-to-end encryption, SSO/SAML, and EU data residency options.", colour: "text-[#00E5A0]", bg: "bg-[#00E5A0]/10" },
            { icon: ArrowRight, title: "Meeting analytics", desc: "Track talk ratios, meeting load, and topic trends. Powered by PostHog.", colour: "text-[#7B5CF0]", bg: "bg-[#7B5CF0]/10" },
          ].map(({ icon: Icon, title, desc, colour, bg }) => (
            <div key={title} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 hover:bg-white/[0.06] transition-colors">
              <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon size={16} className={colour} />
              </div>
              <h3 className="font-syne font-bold text-sm mb-1.5">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t border-white/10 py-16 text-center">
        <h2 className="font-syne text-3xl font-bold mb-4">Ready to reclaim your meeting time?</h2>
        <p className="text-white/40 mb-8">Join teams already saving 3+ hours per week.</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 bg-[#00E5A0] text-[#0D0D0D] px-8 py-3.5 rounded-full font-semibold hover:opacity-90 transition-opacity"
        >
          Get started — it&apos;s free <ArrowRight size={15} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-8 py-6 flex items-center justify-between text-xs text-white/30">
        <span>© 2026 MeetMind Ltd.</span>
        <div className="flex gap-5">
          <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  )
}
