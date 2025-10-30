"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
DialogTrigger.displayName = DialogPrimitive.Trigger.displayName

const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    title?: string
    description?: string
  }
>(({ className, title, description, children, ...props }, ref) => (
  <DialogPortal>
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    >
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background hover:bg-accent hover:text-accent-foreground">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
      <div className="relative transform overflow-hidden rounded-lg bg-background text-left shadow-xl transition-all sm:my-8 sm:max-w-lg sm:w-full">
        <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-6">
          {title && (
            <DialogPrimitive.Title className="font-semibold text-foreground mb-2">
              {title}
            </DialogPrimitive.Title>
          )}
          {description && (
            <DialogPrimitive.Description className="text-sm text-muted-foreground mb-4">
              {description}
            </DialogPrimitive.Description>
          )}
          {children}
        </div>
      </div>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className="flex flex-col space-y-1.5 text-center sm:text-left">
    {props.children}
  </div>
))
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div ref={ref} className="flex flex-col-reverse sm:flex-row sm:space-x-2 sm:space-y-0 mt-3 sm:mt-0">
    {props.children}
  </div>
))
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {props.children}
  </DialogPrimitive.Title>
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", className)}>
    {props.children}
  </DialogPrimitive.Description>
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
