"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          // richColors otherwise ships sonner's own emerald/red, which are the
          // only colours left in the app that aren't ours. Point them at the
          // lifecycle tokens so a toast matches the card it came from.
          "--success-bg": "var(--status-ack-bg)",
          "--success-text": "var(--status-ack-fg)",
          "--success-border": "var(--status-ack-fg)",
          "--error-bg": "var(--destructive-subtle-bg)",
          "--error-text": "var(--destructive-subtle-fg)",
          "--error-border": "var(--destructive-subtle-fg)",
          "--warning-bg": "var(--status-reminding-bg)",
          "--warning-text": "var(--status-reminding-fg)",
          "--warning-border": "var(--status-reminding-fg)",
          "--info-bg": "var(--status-snoozed-bg)",
          "--info-text": "var(--status-snoozed-fg)",
          "--info-border": "var(--status-snoozed-fg)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
