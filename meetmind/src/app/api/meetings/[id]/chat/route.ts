// src/app/api/meetings/[id]/chat/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { askAboutMeeting } from "@/lib/ai"
import { trackEvent, EVENTS } from "@/lib/analytics"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const meeting = await prisma.meeting.findFirst({
    where: { id: params.id, hostId: session.user.id },
    include: {
      transcript: { select: { fullText: true } },
      summary: { select: { tldr: true, keyPoints: true, decisions: true } },
    },
  })

  if (!meeting?.transcript) {
    return NextResponse.json({ error: "No transcript available" }, { status: 404 })
  }

  const { question, history = [] } = await req.json()

  const answer = await askAboutMeeting(
    question,
    meeting.transcript.fullText,
    meeting.summary as any,
    history
  )

  trackEvent(session.user.id, EVENTS.AI_QUESTION_ASKED, { meetingId: params.id })

  return NextResponse.json({ answer })
}
