// src/components/ui/badge.tsx
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-amber-50 text-amber-700",
        danger: "bg-red-50 text-red-600",
        info: "bg-violet-50 text-violet-700",
        accent: "bg-emerald-100 text-emerald-800",
        brand: "bg-brand text-white",
        recording: "bg-red-50 text-red-600 animate-pulse",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    SCHEDULED: { label: "Scheduled", variant: "default" },
    RECORDING: { label: "● Recording", variant: "recording" },
    PROCESSING: { label: "Processing...", variant: "info" },
    COMPLETED: { label: "Completed", variant: "success" },
    FAILED: { label: "Failed", variant: "danger" },
    TODO: { label: "To do", variant: "default" },
    IN_PROGRESS: { label: "In progress", variant: "info" },
    DONE: { label: "Done", variant: "success" },
    CANCELLED: { label: "Cancelled", variant: "danger" },
  }
  const config = map[status] ?? { label: status, variant: "default" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    LOW: { label: "Low", variant: "default" },
    MEDIUM: { label: "Medium", variant: "warning" },
    HIGH: { label: "High", variant: "danger" },
    URGENT: { label: "Urgent", variant: "danger" },
  }
  const config = map[priority] ?? { label: priority, variant: "default" as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
