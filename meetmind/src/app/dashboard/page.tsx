// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatRelative, formatDuration, sentimentColour } from "@/lib/utils"
import { Video, CheckSquare, Clock, TrendingUp, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { startOfWeek } from "date-fns"

async function getDashboardData(userId: string) {
  const weekStart = startOfWeek(new Date())

  const [
    totalMeetings,
    meetingsThisWeek,
    totalTasks,
    completedTasks,
    recentMeetings,
    pendingTasks,
  ] = await Promise.all([
    prisma.meeting.count({ where: { hostId: userId } }),
    prisma.meeting.count({ where: { hostId: userId, startedAt: { gte: weekStart } } }),
    prisma.task.count({ where: { OR: [{ createdById: userId }, { assigneeId: userId }] } }),
    prisma.task.count({ where: { OR: [{ createdById: userId }, { assigneeId: userId }], status: "DONE" } }),
    prisma.meeting.findMany({
      where: { hostId: userId },
      include: {
        summary: { select: { tldr: true, sentiment: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: {
        OR: [{ createdById: userId }, { assigneeId: userId }],
        status: { in: ["TODO", "IN_PROGRESS"] },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
  ])

  return { totalMeetings, meetingsThisWeek, totalTasks, completedTasks, recentMeetings, pendingTasks }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const data = await getDashboardData(session!.user.id)
  const completionRate = data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0

  const stats = [
    { label: "Total meetings", value: data.totalMeetings, icon: Video, colour: "text-violet-600", bg: "bg-violet-50" },
    { label: "This week", value: data.meetingsThisWeek, icon: TrendingUp, colour: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Open tasks", value: data.totalTasks - data.completedTasks, icon: CheckSquare, colour: "text-amber-600", bg: "bg-amber-50" },
    { label: "Task completion", value: `${completionRate}%`, icon: Clock, colour: "text-sky-600", bg: "bg-sky-50" },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},
            {" "}{session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's what's happening with your meetings.</p>
        </div>
        <Link href="/dashboard/meetings/new">
          <Button variant="default" className="gap-2">
            <Plus size={15} /> New meeting
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, colour, bg }) => (
          <Card key={label} className="card-hover">
            <CardContent className="p-5">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={17} className={colour} />
              </div>
              <p className="text-2xl font-syne font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent meetings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent meetings</CardTitle>
              <Link href="/dashboard/meetings" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.recentMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Video size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No meetings yet</p>
                <Link href="/dashboard/meetings/new">
                  <Button variant="outline" size="sm" className="mt-3">Record your first meeting</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentMeetings.map((m) => (
                  <Link key={m.id} href={`/dashboard/meetings/${m.id}`} className="block">
                    <div className="flex items-start justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-violet-700 transition-colors">
                          {m.title}
                        </p>
                        {m.summary?.tldr && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate">{m.summary.tldr}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <StatusBadge status={m.status} />
                          {m.summary?.sentiment && (
                            <span className={`text-xs ${sentimentColour(m.summary.sentiment)}`}>
                              {m.summary.sentiment}
                            </span>
                          )}
                          {m._count.tasks > 0 && (
                            <span className="text-xs text-gray-400">{m._count.tasks} tasks</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 ml-3 shrink-0">{formatRelative(m.startedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending tasks</CardTitle>
              <Link href="/dashboard/tasks" className="text-xs text-violet-600 hover:underline flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data.pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare size={32} className="text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No pending tasks — great work!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.pendingTasks.map((task) => {
                  const priorityColour: Record<string, string> = {
                    URGENT: "border-l-red-500",
                    HIGH: "border-l-orange-400",
                    MEDIUM: "border-l-amber-400",
                    LOW: "border-l-gray-300",
                  }
                  return (
                    <div
                      key={task.id}
                      className={`border-l-2 ${priorityColour[task.priority]} pl-3 py-2 rounded-r-xl hover:bg-gray-50 transition-colors`}
                    >
                      <p className="text-sm font-medium text-gray-900">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={task.status} />
                        {task.dueDate && (
                          <span className="text-xs text-gray-400">
                            Due {formatRelative(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
