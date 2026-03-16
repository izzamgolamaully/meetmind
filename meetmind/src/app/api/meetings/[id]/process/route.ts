// src/app/api/meetings/[id]/process/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { transcribeAudio, generateSummary, extractTasks } from "@/lib/ai"
import { trackEvent, EVENTS } from "@/lib/analytics"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const meeting = await prisma.meeting.findFirst({
    where: { id: params.id, hostId: session.user.id },
    include: { participants: true },
  })

  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 })

  // Update status to processing
  await prisma.meeting.update({
    where: { id: params.id },
    data: { status: "PROCESSING" },
  })

  try {
    // 1. Get audio from request
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File | null

    let transcriptText = ""

    if (audioFile) {
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      transcriptText = await transcribeAudio(buffer, audioFile.name)

      trackEvent(session.user.id, EVENTS.MEETING_RECORDING_UPLOADED, {
        meetingId: params.id,
        fileSizeKb: Math.round(buffer.length / 1024),
      })
    } else {
      // Allow manual transcript submission for testing
      const body = await req.text()
      if (body) {
        try { transcriptText = JSON.parse(body).transcript ?? "" } catch { transcriptText = body }
      }
    }

    if (!transcriptText) {
      await prisma.meeting.update({ where: { id: params.id }, data: { status: "FAILED" } })
      return NextResponse.json({ error: "No transcript content" }, { status: 400 })
    }

    // 2. Store transcript
    await prisma.transcript.upsert({
      where: { meetingId: params.id },
      create: { meetingId: params.id, fullText: transcriptText },
      update: { fullText: transcriptText },
    })

    // 3. Generate AI summary
    const summaryData = await generateSummary(transcriptText, meeting.title)
    await prisma.summary.upsert({
      where: { meetingId: params.id },
      create: {
        meetingId: params.id,
        tldr: summaryData.tldr,
        keyPoints: summaryData.keyPoints,
        decisions: summaryData.decisions,
        nextSteps: summaryData.nextSteps,
        sentiment: summaryData.sentiment,
        topics: summaryData.topics,
      },
      update: {
        tldr: summaryData.tldr,
        keyPoints: summaryData.keyPoints,
        decisions: summaryData.decisions,
        nextSteps: summaryData.nextSteps,
        sentiment: summaryData.sentiment,
        topics: summaryData.topics,
      },
    })

    // 4. Extract and store tasks
    const participantNames = meeting.participants.map((p) => p.name)
    const extractedTasks = await extractTasks(transcriptText, participantNames)

    if (extractedTasks.length > 0) {
      await prisma.task.createMany({
        data: extractedTasks.map((t) => ({
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          meetingId: params.id,
          createdById: session.user.id,
          source: "meeting-ai",
        })),
      })
    }

    // 5. Mark meeting as completed
    const endedAt = new Date()
    const durationSeconds = Math.round((endedAt.getTime() - meeting.startedAt.getTime()) / 1000)

    await prisma.meeting.update({
      where: { id: params.id },
      data: {
        status: "COMPLETED",
        endedAt,
        duration: durationSeconds,
      },
    })

    trackEvent(session.user.id, EVENTS.MEETING_PROCESSED, {
      meetingId: params.id,
      duration: durationSeconds,
      tasksExtracted: extractedTasks.length,
      sentiment: summaryData.sentiment,
    })

    return NextResponse.json({
      success: true,
      summary: summaryData,
      tasksCreated: extractedTasks.length,
    })
  } catch (err) {
    console.error("Meeting processing failed:", err)
    await prisma.meeting.update({ where: { id: params.id }, data: { status: "FAILED" } })
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }
}
