// src/app/api/meetings/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS } from "@/lib/ai"
import { trackEvent, EVENTS } from "@/lib/analytics"
import { z } from "zod"
import { startOfMonth } from "date-fns"

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  platform: z.enum(["zoom", "meet", "teams", "in-person", "other"]).optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "10")
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status")

  const where = {
    hostId: session.user.id,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { description: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status: status as any }),
  }

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      include: {
        summary: { select: { tldr: true, sentiment: true } },
        tasks: { select: { id: true, status: true } },
        participants: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.meeting.count({ where }),
  ])

  return NextResponse.json({
    meetings,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  // Check plan limits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  })
  const plan = user?.plan ?? "FREE"
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

  if (limits.meetingsPerMonth !== Infinity) {
    const monthStart = startOfMonth(new Date())
    const meetingsThisMonth = await prisma.meeting.count({
      where: { hostId: session.user.id, startedAt: { gte: monthStart } },
    })
    if (meetingsThisMonth >= limits.meetingsPerMonth) {
      return NextResponse.json(
        { error: `You've reached your ${limits.meetingsPerMonth} meetings/month limit. Upgrade to Pro for unlimited.` },
        { status: 403 }
      )
    }
  }

  const meeting = await prisma.meeting.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      platform: parsed.data.platform,
      startedAt: new Date(),
      status: "RECORDING",
      hostId: session.user.id,
    },
  })

  trackEvent(session.user.id, EVENTS.MEETING_STARTED, {
    meetingId: meeting.id,
    platform: parsed.data.platform,
  })

  return NextResponse.json(meeting, { status: 201 })
}
