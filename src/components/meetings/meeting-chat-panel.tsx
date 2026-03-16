"use client"
// src/components/meetings/meeting-chat-panel.tsx
import { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Message { role: "user" | "assistant"; content: string }

export function MeetingChatPanel({ meetingId, transcriptText }: { meetingId: string; transcriptText: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const suggestions = [
    "Who were the main speakers?",
    "What was agreed on?",
    "What are the key risks?",
  ]

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    const res = await fetch(`/api/meetings/${meetingId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: text, history: messages }),
    })

    const data = await res.json()
    setMessages((prev) => [...prev, { role: "assistant", content: data.answer ?? "Sorry, I couldn't answer that." }])
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Suggested questions:</p>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="block w-full text-left text-xs text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg px-3 py-2 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="space-y-3 max-h-52 overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-brand text-white"
                  : "bg-gray-100 text-gray-700"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-3 py-2">
                <Loader2 size={12} className="animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Ask anything about this meeting..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          className="text-xs h-8"
        />
        <Button size="icon" onClick={() => sendMessage(input)} disabled={loading} className="h-8 w-8 shrink-0">
          <Send size={13} />
        </Button>
      </div>
    </div>
  )
}
