"use client"
// src/components/ui/toaster.tsx
import * as React from "react"
import * as ToastPrimitive from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitive.Provider
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitive.Viewport.displayName

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: "default" | "success" | "error" }
>(({ className, variant = "default", ...props }, ref) => (
  <ToastPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-lg transition-all",
      "data-[state=open]:animate-fade-in data-[state=closed]:opacity-0",
      variant === "default" && "bg-white border-gray-200 text-gray-900",
      variant === "success" && "bg-emerald-50 border-emerald-200 text-emerald-900",
      variant === "error" && "bg-red-50 border-red-200 text-red-900",
      className
    )}
    {...props}
  />
))
Toast.displayName = ToastPrimitive.Root.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title ref={ref} className={cn("text-sm font-medium", className)} {...props} />
))
ToastTitle.displayName = ToastPrimitive.Title.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    className={cn("rounded-lg p-1 text-gray-400 hover:text-gray-600 transition-colors", className)}
    {...props}
  >
    <X size={14} />
  </ToastPrimitive.Close>
))
ToastClose.displayName = ToastPrimitive.Close.displayName

// Simple toast hook
type ToastOptions = { title: string; description?: string; variant?: "default" | "success" | "error" }
type ToastFn = (options: ToastOptions) => void

const ToastContext = React.createContext<ToastFn>(() => {})

export function useToast() {
  return { toast: React.useContext(ToastContext) }
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<(ToastOptions & { id: string; open: boolean })[]>([])

  const toast: ToastFn = React.useCallback((opts) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...opts, id, open: true }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      <ToastProvider>
        {toasts.map((t) => (
          <Toast key={t.id} open={t.open} variant={t.variant}>
            <div>
              <ToastTitle>{t.title}</ToastTitle>
              {t.description && <p className="text-xs opacity-70 mt-0.5">{t.description}</p>}
            </div>
            <ToastClose onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}
