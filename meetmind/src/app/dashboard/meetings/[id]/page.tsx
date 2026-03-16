// src/app/dashboard/meetings/[id]/page.tsx
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/badge"
import { formatDate, formatDuration, sentimentColour } from "@/lib/utils"
import { Clock, Users, CheckSquare, Lightbulb, Target, ArrowRight, MessageSquare } from "lucide-react"
import { MeetingChatPanel } from "@/components/meetings/meeting-chat-panel"

async function getMeeting(id: string, userId: string) {
  return prisma.meeting.findFirst({
    where: { id, hostId: userId },
    include: {
      transcript: { include: { segments: { orderBy: { startTime: "asc" }, take: 50 } } },
      summary: true,
      tasks: { include: { assignee: { select: { name: true, image: true } } }, orderBy: { priority: "desc" } },
      participants: true,
      host: { select: { name: true, image: true } },
    },
  })
}

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  const meeting = await getMeeting(params.id, session!.user.id)
  if (!meeting) notFound()

  const summary = meeting.summary
  const keyPoints: string[] = (summary?.keyPoints as string[]) ?? []
  const decisions: string[] = (summary?.decisions as string[]) ?? []
  const nextSteps: string[] = (summary?.nextSteps as string[]) ?? []

  const tasksByStatus = {
    todo: meeting.tasks.filter((t) => t.status === "TODO"),
    inProgress: meeting.tasks.filter((t) => t.status === "IN_PROGRESS"),
    done: meeting.tasks.filter((t) => t.status === "DONE"),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-syne text-2xl font-bold text-gray-900">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <StatusBadge status={meeting.status} />
            <span className="text-sm text-gray-400">{formatDate(meeting.startedAt)}</span>
            {meeting.duration && (
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Clock size={13} /> {formatDuration(meeting.duration)}
              </span>
            )}
            {meeting.participants.length > 0 && (
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Users size={13} /> {meeting.participants.length} attendees
              </span>
            )}
            {summary?.sentiment && (
              <span className={`text-sm font-medium ${sentimentColour(summary.sentiment)}`}>
                {summary.sentiment} sentiment
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — Summary + Transcript */}
        <div className="col-span-2 space-y-5">
          {/* TL;DR */}
          {summary && (
            <Card className="border-l-4 border-l-violet-400">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-violet-600">AI</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Summary</span>
                </div>
                <p className="text-gray-700 leading-relaxed">{summary.tldr}</p>
              </CardContent>
            </Card>
          )}

          {/* Key points / Decisions / Next steps */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              {[
                { title: "Key points", items: keyPoints, icon: Lightbulb, colour: "text-amber-600", bg: "bg-amber-50" },
                { title: "Decisions", items: decisions, icon: Target, colour: "text-violet-600", bg: "bg-violet-50" },
                { title: "Next steps", items: nextSteps, icon: ArrowRight, colour: "text-emerald-600", bg: "bg-emerald-50" },
              ].map(({ title, items, icon: Icon, colour, bg }) => (
                <Card key={title}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${bg} rounded-lg flex items-center justify-center`}>
                        <Icon size={13} className={colour} />
                      </div>
                      <CardTitle className="text-sm">{title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-400">None identified</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {items.map((item, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                            <span className="text-gray-300 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Transcript */}
          {meeting.transcript && (
            <Card>
              <CardHeader>
                <CardTitle>Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                {meeting.transcript.segments.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {meeting.transcript.segments.map((seg) => (
                      <div key={seg.id} className="flex gap-3">
                        <div className="shrink-0 text-right">
                          <span className="text-[10px] text-gray-400 tabular-nums">
                            {Math.floor(seg.startTime / 60)}:{String(Math.floor(seg.startTime % 60)).padStart(2, "0")}
                          </span>
                        </div>
                        <div>
                          {seg.speaker && (
                            <p className="text-xs font-semibold text-violet-600 mb-0.5">{seg.speaker}</p>
                          )}
                          <p className="text-sm text-gray-700 leading-relaxed">{seg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 max-h-72 overflow-y-auto">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {meeting.transcript.fullText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Tasks + AI Chat */}
        <div className="space-y-5">
          {/* Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare size={15} /> Tasks
                  <Badge variant="info">{meeting.tasks.length}</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {meeting.tasks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No tasks extracted</p>
              ) : (
                meeting.tasks.map((task) => (
                  <div key={task.id} className="border border-gray-100 rounded-xl p-3">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    {task.assignee && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                          {task.assignee.image && <img src={task.assignee.image} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <span className="text-xs text-gray-500">{task.assignee.name}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Chat panel */}
          {meeting.transcript && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare size={15} /> Ask about this meeting
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MeetingChatPanel
                  meetingId={meeting.id}
                  transcriptText={meeting.transcript.fullText}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
