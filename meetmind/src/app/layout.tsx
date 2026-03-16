// src/app/layout.tsx
import type { Metadata } from "next"
import { Syne, DM_Sans } from "next/font/google"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SessionProvider } from "@/components/providers/session-provider"
import { PostHogProvider } from "@/components/providers/posthog-provider"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "700", "800"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500"],
})

export const metadata: Metadata = {
  title: { default: "MeetMind — AI Meeting Intelligence", template: "%s | MeetMind" },
  description: "Record, transcribe, summarise, and track tasks from every meeting. Stop losing decisions in meeting noise.",
  keywords: ["meeting AI", "meeting summary", "meeting transcription", "task tracking", "AI notes"],
  openGraph: {
    title: "MeetMind — AI Meeting Intelligence",
    description: "Stop losing decisions in meeting noise.",
    url: "https://meetmind.ai",
    siteName: "MeetMind",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MeetMind — AI Meeting Intelligence",
    description: "Stop losing decisions in meeting noise.",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="font-dm antialiased">
        <SessionProvider session={session}>
          <PostHogProvider>
            {children}
            <Toaster />
          </PostHogProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
