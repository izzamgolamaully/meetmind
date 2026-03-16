// src/lib/analytics.ts
import { PostHog } from "posthog-node"

// Server-side PostHog
export const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
  flushAt: 1,
  flushInterval: 0,
})

export function trackEvent(
  userId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  posthog.capture({ distinctId: userId, event, properties })
}

export const EVENTS = {
  // Auth
  USER_SIGNED_UP: "user_signed_up",
  USER_SIGNED_IN: "user_signed_in",

  // Meetings
  MEETING_STARTED: "meeting_started",
  MEETING_RECORDING_UPLOADED: "meeting_recording_uploaded",
  MEETING_PROCESSED: "meeting_processed",
  MEETING_SUMMARY_VIEWED: "meeting_summary_viewed",

  // Tasks
  TASK_CREATED: "task_created",
  TASK_COMPLETED: "task_completed",
  TASK_EXPORTED_TO_JIRA: "task_exported_to_jira",

  // Billing
  CHECKOUT_STARTED: "checkout_started",
  SUBSCRIPTION_CREATED: "subscription_created",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",

  // Feature usage
  TRANSCRIPT_SEARCHED: "transcript_searched",
  AI_QUESTION_ASKED: "ai_question_asked",
  INTEGRATION_CONNECTED: "integration_connected",
} as const
