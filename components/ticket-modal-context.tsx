"use client"

import * as React from "react"
import { CreateTicketDialog, CreateTicketFormState } from "@/components/ticketing/admin/create-ticket"
import { User } from "@/components/ticketing/admin/ticket"

interface TicketModalContextType {
  openTicketModal: () => void // No longer need to pass users down manually
  closeTicketModal: () => void
}

const TicketModalContext = React.createContext<TicketModalContextType | undefined>(undefined)

export function TicketModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [users, setUsers] = React.useState<User[]>([])

  // Fetch users from Prisma via the API route when the provider mounts
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/ticketing/get/users")
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (error) {
        console.error("Error loading Prisma appUsers into context:", error)
      }
    }

    fetchUsers()
  }, [])

  const openTicketModal = () => setOpen(true)
  const closeTicketModal = () => setOpen(false)

  const handleGlobalSubmit = async (form: CreateTicketFormState) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/ticketing/post/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          department: form.department,
          subject: form.subject,
          description: form.description,
          priority: form.priority,
          status: form.status,
          createdById: form.createdById === "unassigned" ? null : form.createdById,
          assignedToId: form.assignedToId === "unassigned" ? null : form.assignedToId,
        }),
      })

      if (!res.ok) throw new Error(`Create failed with ${res.status}`)
      
      setOpen(false)
    } catch (error) {
      console.error("Global ticket creation failed:", error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TicketModalContext.Provider value={{ openTicketModal, closeTicketModal }}>
      {children}
      <CreateTicketDialog
        open={open}
        users={users} // Fed directly from our Prisma API hook
        isSubmitting={isSubmitting}
        onOpenChange={setOpen}
        onSubmit={handleGlobalSubmit}
      />
    </TicketModalContext.Provider>
  )
}

export function useTicketModal() {
  const context = React.useContext(TicketModalContext)
  if (!context) throw new Error("useTicketModal must be used within a TicketModalProvider")
  return context
}