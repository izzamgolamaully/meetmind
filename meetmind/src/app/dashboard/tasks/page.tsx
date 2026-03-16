"use client"
// src/app/dashboard/tasks/page.tsx
import { useState, useEffect } from "react"
import { Plus, CheckSquare, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, StatusBadge, PriorityBadge } from "@/components/ui/badge"
import { formatRelative } from "@/lib/utils"

const COLUMNS = [
  { key: "TODO", label: "To do", icon: Clock, colour: "text-gray-500" },
  { key: "IN_PROGRESS", label: "In progress", icon: AlertCircle, colour: "text-violet-600" },
  { key: "DONE", label: "Done", icon: CheckSquare, colour: "text-emerald-600" },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    setLoading(true)
    const res = await fetch("/api/tasks")
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t))
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
  }

  const byStatus = (status: string) => tasks.filter((t) => t.status === status)

  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sorted = (arr: any[]) => [...arr].sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne text-2xl font-bold">Tasks</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tasks.filter(t => t.status !== "DONE").length} open · {tasks.filter(t => t.status === "DONE").length} done
          </p>
        </div>
        <Button className="gap-2"><Plus size={15} /> Add task</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              {[...Array(3)].map((_, j) => <div key={j} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {COLUMNS.map(({ key, label, icon: Icon, colour }) => {
            const colTasks = sorted(byStatus(key))
            return (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={colour} />
                    <span className="font-syne font-semibold text-sm text-gray-700">{label}</span>
                  </div>
                  <Badge variant="default">{colTasks.length}</Badge>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {colTasks.map((task) => (
                    <Card key={task.id} className="card-hover cursor-default">
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-gray-900 mb-1">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <PriorityBadge priority={task.priority} />
                          {task.meeting && (
                            <Badge variant="info" className="text-[10px]">{task.meeting.title}</Badge>
                          )}
                        </div>

                        {task.dueDate && (
                          <p className="text-xs text-gray-400 mb-3">Due {formatRelative(task.dueDate)}</p>
                        )}

                        {/* Status action buttons */}
                        <div className="flex gap-1.5 flex-wrap">
                          {key !== "TODO" && (
                            <button
                              onClick={() => updateStatus(task.id, "TODO")}
                              className="text-[10px] text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-2 py-0.5 hover:border-gray-300 transition-colors"
                            >
                              ← To do
                            </button>
                          )}
                          {key !== "IN_PROGRESS" && (
                            <button
                              onClick={() => updateStatus(task.id, "IN_PROGRESS")}
                              className="text-[10px] text-violet-600 hover:text-violet-700 border border-violet-200 rounded-lg px-2 py-0.5 hover:border-violet-300 transition-colors"
                            >
                              In progress
                            </button>
                          )}
                          {key !== "DONE" && (
                            <button
                              onClick={() => updateStatus(task.id, "DONE")}
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 border border-emerald-200 rounded-lg px-2 py-0.5 hover:border-emerald-300 transition-colors"
                            >
                              ✓ Done
                            </button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl p-6 text-center">
                      <p className="text-xs text-gray-300">No tasks here</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
