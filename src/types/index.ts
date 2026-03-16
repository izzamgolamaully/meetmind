// src/types/index.ts
import type { User, Meeting, Task, Transcript, Summary, Plan, MeetingStatus, TaskStatus, Priority } from "@prisma/client"

export type { Plan, MeetingStatus, TaskStatus, Priority }

export interface MeetingWithDetails extends Meeting {
  transcript?: Transcript | null
  summary?: Summary | null
  tasks: Task[]
  participants: { id: string; name: string; email?: string | null }[]
  host: { id: string; name: string | null; email: string | null; image: string | null }
}

export interface TaskWithMeeting extends Task {
  meeting?: { id: string; title: string } | null
  assignee?: { id: string; name: string | null; image: string | null } | null
}

export interface DashboardStats {
  totalMeetings: number
  meetingsThisWeek: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  totalMinutesSaved: number
  meetingsByDay: { date: string; count: number }[]
  tasksByStatus: { status: string; count: number }[]
}

export interface TranscriptSegmentData {
  speaker: string
  text: string
  startTime: number
  endTime: number
  confidence?: number
}

export interface SummaryData {
  tldr: string
  keyPoints: string[]
  decisions: string[]
  nextSteps: string[]
  sentiment: "positive" | "neutral" | "negative"
  topics: string[]
}

export interface ExtractedTask {
  title: string
  description?: string
  assignee?: string
  dueDate?: string
  priority: Priority
}

export interface StripeProduct {
  id: string
  name: string
  description: string
  price: number
  priceId: string
  interval: "month" | "year"
  features: string[]
  popular?: boolean
}

export interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
