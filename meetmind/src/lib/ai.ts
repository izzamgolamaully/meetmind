// src/lib/ai.ts
import OpenAI from "openai"
import Anthropic from "@anthropic-ai/sdk"
import type { SummaryData, ExtractedTask, TranscriptSegmentData } from "@/types"

const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "placeholder" })
const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? process.env.OPENAI_API_KEY ?? "placeholder" })

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: "audio/webm" })
  const response = await getOpenAI().audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["segment"],
  })
  return response.text
}

export async function generateSummary(transcript: string, meetingTitle: string): Promise<SummaryData> {
  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: `You are an expert meeting analyst.\n\nMeeting title: ${meetingTitle}\n\nTranscript:\n${transcript}\n\nReturn ONLY valid JSON:\n{"tldr":"...","keyPoints":[],"decisions":[],"nextSteps":[],"sentiment":"neutral","topics":[]}` }],
  })
  const text = message.content[0].type === "text" ? message.content[0].text : ""
  return JSON.parse(text.replace(/\`\`\`json\n?|\n?\`\`\`/g, "").trim()) as SummaryData
}

export async function extractTasks(transcript: string, participants: string[]): Promise<ExtractedTask[]> {
  const message = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: `Extract tasks from this transcript.\nParticipants: ${participants.join(", ")}\n\nTranscript:\n${transcript}\n\nReturn ONLY a JSON array: [{"title":"...","description":"...","assignee":null,"dueDate":null,"priority":"MEDIUM"}]` }],
  })
  const text = message.content[0].type === "text" ? message.content[0].text : "[]"
  try { return JSON.parse(text.replace(/\`\`\`json\n?|\n?\`\`\`/g, "").trim()) as ExtractedTask[] } catch { return [] }
}

export async function askAboutMeeting(question: string, transcript: string, summary: SummaryData | null, history: { role: "user" | "assistant"; content: string }[]): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    system: `You are a helpful meeting assistant.\n${summary ? `Summary: ${summary.tldr}` : ""}\n\nTranscript:\n${transcript.slice(0, 8000)}`,
    messages: [...history, { role: "user" as const, content: question }],
  })
  return response.content[0].type === "text" ? response.content[0].text : ""
}

export const PLAN_LIMITS = {
  FREE: { meetingsPerMonth: 5, historyDays: 7, integrations: 1 },
  PRO: { meetingsPerMonth: Infinity, historyDays: 90, integrations: Infinity },
  ENTERPRISE: { meetingsPerMonth: Infinity, historyDays: Infinity, integrations: Infinity },
} as const
