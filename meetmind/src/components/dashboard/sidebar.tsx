"use client"
// src/components/dashboard/sidebar.tsx
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard, Video, CheckSquare, BarChart2,
  Settings, LogOut, Zap, ChevronRight, Mic
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const nav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Meetings", href: "/dashboard/meetings", icon: Video },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const plan = session?.user?.plan ?? "FREE"

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-brand text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
          <Mic size={15} className="text-brand" />
        </div>
        <span className="font-syne font-bold text-lg tracking-tight">MeetMind</span>
      </div>

      {/* Plan badge */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
          <span className="text-xs text-white/50">Current plan</span>
          <Badge className={cn(
            "text-[10px] font-bold px-2",
            plan === "PRO" && "bg-accent text-brand",
            plan === "ENTERPRISE" && "bg-violet-500 text-white",
            plan === "FREE" && "bg-white/10 text-white/70"
          )}>{plan}</Badge>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={17} />
              {label}
              {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA for free users */}
      {plan === "FREE" && (
        <div className="px-4 py-3 border-t border-white/10">
          <Link href="/pricing" className="block bg-accent/10 border border-accent/20 rounded-xl p-3 hover:bg-accent/20 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} className="text-accent" />
              <span className="text-xs font-semibold text-accent">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-white/50">Unlimited meetings + AI tasks</p>
          </Link>
        </div>
      )}

      {/* User */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          {session?.user?.image ? (
            <img src={session.user.image} className="w-8 h-8 rounded-full" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
              {session?.user?.name?.[0] ?? "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-white/40 truncate">{session?.user?.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-white/40 hover:text-white/70 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
