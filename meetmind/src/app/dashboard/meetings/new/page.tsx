"use client"
// src/app/dashboard/meetings/new/page.tsx
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Upload, Square, Loader2, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input, Label } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/toaster"

type Step = "setup" | "recording" | "uploading" | "processing"

const PLATFORMS = [
  { value: "zoom", label: "Zoom", emoji: "🎥" },
  { value: "meet", label: "Google Meet", emoji: "📹" },
  { value: "teams", label: "Microsoft Teams", emoji: "💼" },
  { value: "in-person", label: "In Person", emoji: "🤝" },
  { value: "other", label: "Other", emoji: "📱" },
]

export default function NewMeetingPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [step, setStep] = useState<Step>("setup")
  const [title, setTitle] = useState("")
  const [platform, setPlatform] = useState("other")
  const [meetingId, setMeetingId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<NodeJS.Timeout | null>(null)

  async function startMeeting() {
    if (!title.trim()) {
      toast({ title: "Please enter a meeting title", variant: "error" })
      return
    }

    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, platform }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast({ title: err.error ?? "Failed to create meeting", variant: "error" })
      return
    }

    const meeting = await res.json()
    setMeetingId(meeting.id)
    setStep("recording")
    startRecording()
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorder.current = mr
      chunks.current = []

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mr.start(1000)
      setIsRecording(true)
      setElapsed(0)
      timer.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      toast({ title: "Microphone access denied", variant: "error" })
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop()
      setIsRecording(false)
      if (timer.current) clearInterval(timer.current)
    }
  }

  async function processRecording(blob: Blob) {
    if (!meetingId) return
    setStep("uploading")

    const form = new FormData()
    form.append("audio", blob, "recording.webm")

    setStep("processing")
    const res = await fetch(`/api/meetings/${meetingId}/process`, {
      method: "POST",
      body: form,
    })

    if (res.ok) {
      const data = await res.json()
      toast({
        title: "Meeting processed!",
        description: `${data.tasksCreated} tasks extracted`,
        variant: "success",
      })
      router.push(`/dashboard/meetings/${meetingId}`)
    } else {
      toast({ title: "Processing failed", variant: "error" })
      setStep("recording")
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("audio/")) {
      setAudioBlob(file)
    }
  }

  function formatElapsed(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="w-20 h-20 bg-violet-50 rounded-3xl flex items-center justify-center">
          <Loader2 size={36} className="text-violet-500 animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="font-syne font-bold text-2xl mb-2">Analysing your meeting...</h2>
          <p className="text-gray-500">AI is generating your summary and extracting action items</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          {["Transcribing audio", "Generating summary", "Extracting action items", "Creating tasks"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-violet-400" style={{ animationDelay: `${i * 0.3}s` }} />
              </div>
              {s}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-syne text-2xl font-bold">New meeting</h1>
        <p className="text-gray-500 text-sm mt-1">Record or upload an audio file to get started</p>
      </div>

      {step === "setup" && (
        <Card>
          <CardHeader><CardTitle>Meeting details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Meeting title *</Label>
              <Input
                id="title"
                placeholder="e.g. Q4 Product Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Platform</Label>
              <div className="grid grid-cols-3 gap-2">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPlatform(p.value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm transition-all ${
                      platform === p.value
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <span className="text-xs">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={startMeeting}>
              <Mic size={15} className="mr-2" /> Start recording
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or upload audio file</span></div>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                dragOver ? "border-violet-400 bg-violet-50" : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => document.getElementById("audio-upload")?.click()}
            >
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Drop audio file here or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">MP3, WAV, M4A, WebM up to 500MB</p>
              <input
                id="audio-upload"
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setAudioBlob(e.target.files[0])}
              />
            </div>

            {audioBlob && (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <span className="text-sm text-emerald-700">Audio file ready ({Math.round((audioBlob as File).size / 1024 / 1024 * 10) / 10} MB)</span>
                <Button variant="accent" size="sm" onClick={() => {
                  if (!title.trim()) { toast({ title: "Please enter a meeting title", variant: "error" }); return }
                  fetch("/api/meetings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, platform }) })
                    .then(r => r.json()).then(m => { setMeetingId(m.id); processRecording(audioBlob) })
                }}>
                  Process →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "recording" && (
        <Card>
          <CardContent className="flex flex-col items-center py-12 gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                <Mic size={36} className="text-red-500" />
              </div>
              {isRecording && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full pulse-dot" />
              )}
            </div>

            <div className="text-center">
              <p className="font-syne text-4xl font-bold tabular-nums text-gray-900">{formatElapsed(elapsed)}</p>
              <p className="text-sm text-gray-400 mt-1">{isRecording ? "Recording in progress..." : "Recording paused"}</p>
            </div>

            {/* Waveform visual */}
            {isRecording && (
              <div className="flex gap-1 items-center h-10">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-violet-400 rounded-full wave-bar"
                    style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.06}s` }}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {isRecording ? (
                <Button variant="destructive" onClick={stopRecording} className="gap-2">
                  <Square size={14} /> Stop recording
                </Button>
              ) : (
                <Button variant="accent" onClick={startRecording} className="gap-2">
                  <Mic size={14} /> Resume
                </Button>
              )}
            </div>

            {!isRecording && audioBlob && (
              <Button className="w-full" onClick={() => processRecording(audioBlob)}>
                <Loader2 size={14} className="mr-2" /> Process meeting →
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
