// src/lib/ai.ts
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import type { SummaryData, ExtractedTask, TranscriptSegmentData } from "@/types"
import { Priority } from "@prisma/client"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY })

// ─── Transcription ────────────────────────────────────────────────────────────

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: "audio/webm" })

  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  })

  return response.text
}

export async function transcribeWithAssemblyAI(audioUrl: string): Promise<{
  text: string
  segments: TranscriptSegmentData[]
}> {
  const AssemblyAI = await import("assemblyai")
  const client = new AssemblyAI.AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY! })

  const transcript = await client.transcripts.transcribe({
    audio: audioUrl,
    speaker_labels: true,
    language_detection: true,
  })

  const segments: TranscriptSegmentData[] =
    transcript.utterances?.map((u) => ({
      speaker: `Speaker ${u.speaker}`,
      text: u.text,
      startTime: u.start / 1000,
      endTime: u.end / 1000,
      confidence: u.confidence ?? undefined,
    })) ?? []

  return {
    text: transcript.text ?? "",
    segments,
  }
}

// ─── AI Summarisation ─────────────────────────────────────────────────────────

export async function generateSummary(transcript: string, meetingTitle: string): Promise<SummaryData> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are an expert meeting analyst. Analyse this meeting transcript and extract structured insights.

Meeting title: ${meetingTitle}

Transcript:
${transcript}

Return ONLY valid JSON matching this exact structure:
{
  "tldr": "2-3 sentence summary of the meeting",
  "keyPoints": ["point 1", "point 2", ...],
  "decisions": ["decision 1", "decision 2", ...],
  "nextSteps": ["action item 1", "action item 2", ...],
  "sentiment": "positive" | "neutral" | "negative",
  "topics": ["topic 1", "topic 2", ...]
}`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()
  return JSON.parse(cleaned) as SummaryData
}

// ─── Task Extraction ──────────────────────────────────────────────────────────

export async function extractTasks(transcript: string, participants: string[]): Promise<ExtractedTask[]> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract all action items and tasks from this meeting transcript.

Known participants: ${participants.join(", ")}

Transcript:
${transcript}

Return ONLY a JSON array of tasks:
[
  {
    "title": "short task title",
    "description": "optional detail",
    "assignee": "person's name if mentioned, otherwise null",
    "dueDate": "ISO date string if mentioned, otherwise null",
    "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  }
]

If no tasks are found, return an empty array [].`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "[]"
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim()

  try {
    return JSON.parse(cleaned) as ExtractedTask[]
  } catch {
    return []
  }
}

// ─── Meeting Q&A ──────────────────────────────────────────────────────────────

export async function askAboutMeeting(
  question: string,
  transcript: string,
  summary: SummaryData | null,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const systemPrompt = `You are a helpful meeting assistant. You have access to a meeting transcript and summary. Answer questions about the meeting concisely and accurately.

${summary ? `Summary: ${summary.tldr}` : ""}

Full transcript:
${transcript.slice(0, 8000)}`

  const messages = [
    ...history,
    { role: "user" as const, content: question },
  ]

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: systemPrompt,
    messages,
  })

  return response.content[0].type === "text" ? response.content[0].text : ""
}

// ─── Plan limit checks ────────────────────────────────────────────────────────

export const PLAN_LIMITS = {
  FREE: { meetingsPerMonth: 5, historyDays: 7, integrations: 1 },
  PRO: { meetingsPerMonth: Infinity, historyDays: 90, integrations: Infinity },
  ENTERPRISE: { meetingsPerMonth: Infinity, historyDays: Infinity, integrations: Infinity },
} as const

