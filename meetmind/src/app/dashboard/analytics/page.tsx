// src/app/dashboard/analytics/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts"
import { subDays, format, startOfDay, eachDayOfInterval } from "date-fns"

async function getAnalyticsData(userId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const [meetings, tasks] = await Promise.all([
    prisma.meeting.findMany({
      where: { hostId: userId, startedAt: { gte: thirtyDaysAgo }, status: "COMPLETED" },
      select: { startedAt: true, duration: true, summary: { select: { sentiment: true, topics: true } } },
    }),
    prisma.task.findMany({
      where: { createdById: userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true, status: true, priority: true, source: true },
    }),
  ])

  // Build meetings-per-day chart data
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() })
  const meetingsByDay = days.map((day) => ({
    date: format(day, "MMM d"),
    count: meetings.filter((m) => format(startOfDay(m.startedAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd")).length,
    minutes: Math.round(
      meetings
        .filter((m) => format(startOfDay(m.startedAt), "yyyy-MM-dd") === format(day, "yyyy-MM-dd"))
        .reduce((acc, m) => acc + (m.duration ?? 0), 0) / 60
    ),
  }))

  const tasksByStatus = [
    { name: "To do", value: tasks.filter((t) => t.status === "TODO").length, fill: "#e2e8f0" },
    { name: "In progress", value: tasks.filter((t) => t.status === "IN_PROGRESS").length, fill: "#7B5CF0" },
    { name: "Done", value: tasks.filter((t) => t.status === "DONE").length, fill: "#00E5A0" },
  ]

  const sentiments = meetings.reduce<Record<string, number>>((acc, m) => {
    const s = m.summary?.sentiment ?? "neutral"
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  const totalMeetings = meetings.length
  const totalMinutes = Math.round(meetings.reduce((a, m) => a + (m.duration ?? 0), 0) / 60)
  const aiTasksCreated = tasks.filter((t) => t.source === "meeting-ai").length
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100)
    : 0

  return { meetingsByDay, tasksByStatus, sentiments, totalMeetings, totalMinutes, aiTasksCreated, completionRate }
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)
  const data = await getAnalyticsData(session!.user.id)

  const stats = [
    { label: "Meetings (30d)", value: data.totalMeetings },
    { label: "Minutes recorded", value: data.totalMinutes.toLocaleString() },
    { label: "AI tasks created", value: data.aiTasksCreated },
    { label: "Task completion", value: `${data.completionRate}%` },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-syne text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 text-sm mt-0.5">Last 30 days · Updated in real time via PostHog</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-2xl font-syne font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalyticsCharts data={data} />
    </div>
  )
}
