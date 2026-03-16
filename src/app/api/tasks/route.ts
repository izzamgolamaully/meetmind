// src/app/api/tasks/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { trackEvent, EVENTS } from "@/lib/analytics"
import { z } from "zod"

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  meetingId: z.string().optional(),
})

const updateSchema = z.object({
  id: z.string(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  title: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const meetingId = searchParams.get("meetingId")

  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ createdById: session.user.id }, { assigneeId: session.user.id }],
      ...(status && { status: status as any }),
      ...(meetingId && { meetingId }),
    },
    include: {
      meeting: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      createdById: session.user.id,
      source: "manual",
    },
    include: {
      meeting: { select: { id: true, title: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  })

  trackEvent(session.user.id, EVENTS.TASK_CREATED, {
    taskId: task.id,
    source: "manual",
    priority: task.priority,
  })

  return NextResponse.json(task, { status: 201 })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

  const { id, ...updates } = parsed.data

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...updates,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
      updatedAt: new Date(),
    },
  })

  if (updates.status === "DONE") {
    trackEvent(session.user.id, EVENTS.TASK_COMPLETED, { taskId: id })
  }

  return NextResponse.json(task)
}
