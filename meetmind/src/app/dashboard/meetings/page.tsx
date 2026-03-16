"use client"
// src/app/dashboard/meetings/page.tsx
import { useState, useEffect } from "react"
import Link from "next/link"
import { Video, Plus, Search, Filter, Mic, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { formatRelative, formatDuration, truncate } from "@/lib/utils"

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(fetchMeetings, 300)
    return () => clearTimeout(t)
  }, [search, page])

  async function fetchMeetings() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: "10", search })
    const res = await fetch(`/api/meetings?${params}`)
    const data = await res.json()
    setMeetings(data.meetings ?? [])
    setTotal(data.pagination?.total ?? 0)
    setLoading(false)
  }

  const platformIcon: Record<string, string> = {
    zoom: "🎥", meet: "📹", teams: "💼", "in-person": "🤝", other: "📱",
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold">Meetings</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} total meetings recorded</p>
        </div>
        <Link href="/dashboard/meetings/new">
          <Button className="gap-2"><Plus size={15} /> New meeting</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search meetings..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter size={14} /> Filter
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mb-4">
              <Video size={24} className="text-violet-400" />
            </div>
            <h3 className="font-syne font-bold text-lg mb-1">No meetings yet</h3>
            <p className="text-gray-400 text-sm mb-4">Record your first meeting to get started</p>
            <Link href="/dashboard/meetings/new">
              <Button className="gap-2"><Mic size={14} /> Start recording</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Link key={m.id} href={`/dashboard/meetings/${m.id}`}>
              <Card className="card-hover cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl shrink-0">
                        {platformIcon[m.platform ?? "other"] ?? "📱"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 group-hover:text-violet-700 transition-colors truncate">
                          {m.title}
                        </h3>
                        {m.summary?.tldr && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{m.summary.tldr}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <StatusBadge status={m.status} />
                          {m.duration && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={11} /> {formatDuration(m.duration)}
                            </span>
                          )}
                          {m._count?.tasks > 0 && (
                            <Badge variant="info">{m._count.tasks} tasks</Badge>
                          )}
                          {m.summary?.sentiment && (
                            <Badge variant={m.summary.sentiment === "positive" ? "success" : m.summary.sentiment === "negative" ? "danger" : "default"}>
                              {m.summary.sentiment}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatRelative(m.startedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 10 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {Math.min(page * 10, total)} of {total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 10 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
