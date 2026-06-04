"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Archive,
  ArchiveX,
  ArrowLeft,
  File,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  PenSquare,
  Reply,
  ReplyAll,
  Forward,
  Search,
  Send,
  Star,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { signOut } from "next-auth/react"

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmailBody {
  text: string
  html: string | false
}

interface Email {
  uid: number
  subject: string
  from?: string
  to?: string
  date: string
  flags: Record<string, boolean>
  body: EmailBody
}

interface MailboxResponse {
  mailbox: string
  folder?: string
  count: number
  emails: Email[]
}

type FolderType = "inbox" | "sent" | "drafts" | "starred" | "archive" | "trash"

const navItems: { title: string; icon: typeof Inbox; folder: FolderType }[] = [
  { title: "Inbox",   icon: Inbox,   folder: "inbox"   },
  { title: "Drafts",  icon: File,    folder: "drafts"  },
  { title: "Sent",    icon: Send,    folder: "sent"    },
  { title: "Starred", icon: Star,    folder: "starred" },
  { title: "Archive", icon: Archive, folder: "archive" },
  { title: "Trash",   icon: Trash2,  folder: "trash"   },
]

const labels = [
  { title: "Work",     color: "bg-blue-400"   },
  { title: "Personal", color: "bg-emerald-400"},
  { title: "Shopping", color: "bg-amber-400"  },
  { title: "Social",   color: "bg-violet-400" },
]

interface UserSession {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEmailContact(email: Email, folder: FolderType): string {
  return folder === "sent" ? email.to || "" : email.from || ""
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now  = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (days === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (days === 1) return "Yesterday"
  if (days < 7)  return date.toLocaleDateString("en-US", { weekday: "short" })
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "numeric", minute: "2-digit",
  })
}

function extractName(from: string) {
  const match = from.match(/^([^<@]+)/)
  if (match) {
    const name = match[1].trim().replace(/"/g, "")
    return name || from.split("@")[0]
  }
  return from.split("@")[0]
}

function extractEmail(from: string) {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}

function getInitials(name: string) {
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getEmailSnippet(body: EmailBody): string {
  const text = body.text || ""
  return text.trim().slice(0, 90) + (text.length > 90 ? "…" : "")
}

// ─── Avatar colour palette (deterministic by initials) ───────────────────────
const AVATAR_PALETTES = [
  "bg-rose-500/20 text-rose-300",
  "bg-sky-500/20 text-sky-300",
  "bg-violet-500/20 text-violet-300",
  "bg-amber-500/20 text-amber-300",
  "bg-emerald-500/20 text-emerald-300",
  "bg-pink-500/20 text-pink-300",
  "bg-indigo-500/20 text-indigo-300",
  "bg-teal-500/20 text-teal-300",
]
function avatarPalette(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MailClient() {
  const [session,       setSession]       = useState<UserSession | null>(null)
  const [mailbox,       setMailbox]       = useState<MailboxResponse | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFolder,  setActiveFolder]  = useState<FolderType>("inbox")
  const [loading,       setLoading]       = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [searchQuery,   setSearchQuery]   = useState("")

  const [composeOpen,    setComposeOpen]    = useState(false)
  const [composeTo,      setComposeTo]      = useState("")
  const [composeSubject, setComposeSubject] = useState("")
  const [composeBody,    setComposeBody]    = useState("")
  const [sending,        setSending]        = useState(false)
  const [sendError,      setSendError]      = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res  = await fetch("/api/auth/session", { credentials: "include" })
        const data = await res.json()
        setSession(data)
        if (data?.user) fetchEmails("inbox")
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [])

  async function fetchEmails(folder: FolderType) {
    setEmailsLoading(true)
    setSelectedEmail(null)
    try {
      const endpointMap: Record<FolderType, string> = {
        inbox:   "/api/mailbox/inbox",
        sent:    "/api/mailbox/send/get",
        drafts:  "/api/mailbox/drafts",
        starred: "/api/mailbox/starred",
        archive: "/api/mailbox/archive",
        trash:   "/api/mailbox/trash",
      }
      const res = await fetch(endpointMap[folder], { credentials: "include" })
      if (res.ok) setMailbox(await res.json())
      else setMailbox({ mailbox: "", count: 0, emails: [] })
    } catch (e) {
      console.error(e)
      setMailbox({ mailbox: "", count: 0, emails: [] })
    } finally {
      setEmailsLoading(false)
    }
  }

  function handleFolderChange(folder: FolderType) {
    if (folder !== activeFolder) {
      setActiveFolder(folder)
      fetchEmails(folder)
    }
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!composeTo.trim()) { setSendError("Please enter a recipient email address"); return }
    setSending(true); setSendError(null)
    try {
      const res = await fetch("/api/mailbox/send", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: composeTo.trim(), subject: composeSubject.trim(), text: composeBody }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send email")
      }
      setComposeOpen(false); setComposeTo(""); setComposeSubject(""); setComposeBody("")
      if (activeFolder === "sent") fetchEmails("sent")
    } catch (error) {
      setSendError(error instanceof Error ? error.message : "Failed to send email")
    } finally {
      setSending(false)
    }
  }

  function handleComposeClose() { if (!sending) { setComposeOpen(false); setSendError(null) } }

  function openReplyCompose(email: Email) {
    const contact = getEmailContact(email, activeFolder)
    setComposeTo(extractEmail(contact))
    setComposeSubject(`Re: ${email.subject}`)
    setComposeBody(`\n\n—\nOn ${formatFullDate(email.date)}, ${extractName(contact)} wrote:\n${email.body.text}`)
    setComposeOpen(true)
  }

  function openForwardCompose(email: Email) {
    const contact = getEmailContact(email, activeFolder)
    setComposeTo("")
    setComposeSubject(`Fwd: ${email.subject}`)
    setComposeBody(`\n\n—\nForwarded from ${extractName(contact)} on ${formatFullDate(email.date)}:\n${email.body.text}`)
    setComposeOpen(true)
  }

  const emails = mailbox?.emails || []
  const filteredEmails = emails.filter((email) => {
    const contact = getEmailContact(email, activeFolder)
    return (
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })
  const unreadCount = emails.filter((e) => !e.flags?.seen).length

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-muted opacity-40" />
            <Mail className="relative size-5 text-foreground/80" />
          </div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Loading</p>
        </motion.div>
      </div>
    )
  }

  // ── Sign-in screen ──────────────────────────────────────────────────────────
  if (!session?.user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-8 bg-background">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card">
            <Mail className="h-6 w-6 text-foreground/80" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Mail</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to access your mailbox</p>
          </div>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
            onClick={() => (window.location.href = "/api/auth/signin")}>
            Sign in
          </Button>
        </motion.div>
      </div>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        {/* ── Sidebar ── */}
        <Sidebar
          collapsible="icon"
          className="border-r border-border/60"
        >
          {/* Logo / mailbox */}
          <SidebarHeader className="px-3 pt-4 pb-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="hover:bg-card">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-border bg-card">
                    <Mail className="size-4 text-foreground/80" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-foreground">Mail</span>
                    <span className="truncate text-xs text-muted-foreground">{mailbox?.mailbox || session.user.email}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent className="px-3">
            {/* Compose */}
            <div className="mb-2 mt-1">
              <Button
                onClick={() => setComposeOpen(true)}
                className="w-full justify-start gap-2 bg-muted text-foreground hover:bg-muted border border-border/50"
                size="sm"
              >
                <PenSquare className="size-3.5" />
                <span className="text-sm">Compose</span>
              </Button>
            </div>

            {/* Folders */}
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                Folders
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={activeFolder === item.folder}
                        tooltip={item.title}
                        onClick={() => handleFolderChange(item.folder)}
                        className={`rounded-md text-sm transition-all ${
                          activeFolder === item.folder
                            ? "bg-muted text-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                      {item.folder === "inbox" && unreadCount > 0 && (
                        <SidebarMenuBadge className="bg-muted text-foreground/80 text-[10px]">
                          {unreadCount}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Labels */}
            <SidebarGroup className="p-0 mt-4">
              <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">
                Labels
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {labels.map((label) => (
                    <SidebarMenuItem key={label.title}>
                      <SidebarMenuButton
                        tooltip={label.title}
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground text-sm"
                      >
                        <span className={`size-1.5 rounded-full ${label.color}`} />
                        <span>{label.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {/* Footer / user */}
          <SidebarFooter className="px-3 pb-3 border-t border-border/60 pt-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="hover:bg-card data-[state=open]:bg-card"
                    >
                      <Avatar className="size-7">
                        <AvatarImage src={session.user.image || ""} />
                        <AvatarFallback className="bg-muted text-foreground/80 text-xs">
                          {getInitials(session.user.name || session.user.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate text-xs font-medium text-foreground/90">
                          {session.user.name || extractName(session.user.email || "")}
                        </span>
                        <span className="truncate text-[10px] text-muted-foreground">{session.user.email}</span>
                      </div>
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52 bg-card border-border text-foreground/90" side="top" align="start">
                    <DropdownMenuLabel className="text-muted-foreground text-xs">
                      <button onClick={() => (window.location.href = "/dashboard/account")}>My Account</button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-muted" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-foreground/80 hover:text-foreground focus:bg-muted">
                      <LogOut className="mr-2 size-3.5" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        {/* ── Main area ── */}
        <SidebarInset className="flex flex-col bg-background">
          {/* Topbar */}
          <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground/80" />
            <Separator orientation="vertical" className="h-4 bg-muted" />

            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
              <Input
                type="search"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 text-xs bg-card border-border text-foreground/90 placeholder:text-muted-foreground/60 focus-visible:ring-border"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {mailbox && (
                <span className="text-[11px] text-muted-foreground/60 tabular-nums">
                  {filteredEmails.length} / {mailbox.count}
                </span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground/80"
                    onClick={() => fetchEmails(activeFolder)}
                    disabled={emailsLoading}
                  >
                    <RefreshCw className={`size-3.5 ${emailsLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-muted text-foreground/90 border-border text-xs">
                  Refresh
                </TooltipContent>
              </Tooltip>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* ── Email list panel ── */}
            <div className="w-[380px] flex-shrink-0 border-r border-border/60 bg-background">
              <ScrollArea className="h-[calc(100vh-3rem)]">
                {emailsLoading && emails.length === 0 ? (
                  <div className="space-y-px p-3">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="rounded-lg p-3">
                        <div className="flex gap-3">
                          <Skeleton className="size-8 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-3/4 bg-muted" />
                            <Skeleton className="h-2.5 w-full bg-border" />
                            <Skeleton className="h-2.5 w-1/2 bg-muted/30" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-10 text-center"
                  >
                    <Inbox className="mb-3 size-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground/60">
                      {searchQuery ? "No results found" : "No emails here"}
                    </p>
                  </motion.div>
                ) : (
                  <div className="p-1.5 space-y-0.5">
                    <AnimatePresence>
                      {filteredEmails.map((email, index) => {
                        const isRead     = email.flags?.seen || activeFolder === "sent"
                        const isSelected = selectedEmail?.uid === email.uid
                        const contact    = getEmailContact(email, activeFolder)
                        const name       = extractName(contact)
                        const palette    = avatarPalette(name)

                        return (
                          <motion.button
                            key={email.uid}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02, duration: 0.18 }}
                            onClick={() => setSelectedEmail(email)}
                            className={`w-full rounded-lg px-3 py-2.5 text-left transition-all duration-150 group overflow-hidden ${
                              isSelected
                                ? "bg-muted ring-1 ring-border"
                                : "hover:bg-card"
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              {/* Unread dot */}
                              <div className="mt-1 flex items-center justify-center">
                                {!isRead ? (
                                  <span className="size-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                ) : (
                                  <span className="size-1.5 flex-shrink-0" />
                                )}
                              </div>

                              {/* Avatar */}
                              <Avatar className="size-7 flex-shrink-0">
                                <AvatarFallback className={`text-[10px] font-medium ${palette}`}>
                                  {getInitials(name)}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-1 mb-0.5">
                                  <span className={`truncate min-w-0 text-xs ${!isRead ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                                    {activeFolder === "sent" ? `To: ${name}` : name}
                                  </span>
                                  <span className="flex-shrink-0 text-[10px] text-muted-foreground/60 pl-1">
                                    {formatDate(email.date)}
                                  </span>
                                </div>
                                <p className={`truncate text-xs mb-1 ${!isRead ? "text-foreground/90" : "text-muted-foreground"}`}>
                                  {email.subject || "(no subject)"}
                                </p>
                                <p className="line-clamp-1 text-[11px] text-muted-foreground/60">
                                  {getEmailSnippet(email.body)}
                                </p>
                              </div>
                            </div>
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* ── Reading pane ── */}
            <div className="flex-1 overflow-hidden bg-background">
              <AnimatePresence mode="wait">
                {selectedEmail ? (
                  <motion.div
                    key={selectedEmail.uid}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="h-full"
                  >
                    <ScrollArea className="h-[calc(100vh-3rem)]">
                      <div className="mx-auto max-w-3xl p-8">

                        {/* Subject + action bar */}
                        <div className="mb-6 flex items-start gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="mt-0.5 h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground/90"
                                onClick={() => setSelectedEmail(null)}
                              >
                                <ArrowLeft className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-muted text-foreground/90 border-border text-xs">
                              Back
                            </TooltipContent>
                          </Tooltip>

                          <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold leading-snug text-foreground tracking-tight">
                              {selectedEmail.subject || "(no subject)"}
                            </h1>
                          </div>

                          {/* Toolbar */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground/90">
                                  <Star className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-muted text-foreground/90 border-border text-xs">Star</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground/90">
                                  <ArchiveX className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-muted text-foreground/90 border-border text-xs">Archive</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400">
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-muted text-foreground/90 border-border text-xs">Delete</TooltipContent>
                            </Tooltip>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground/90">
                                  <MoreHorizontal className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border text-foreground/90">
                                <DropdownMenuItem className="text-xs focus:bg-muted">Mark as unread</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs focus:bg-muted">Mark as spam</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-muted" />
                                <DropdownMenuItem className="text-xs focus:bg-muted">Print</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Sender card */}
                        <div className="mb-6 flex items-center gap-3 rounded-xl border border-border/60 bg-muted/50 px-4 py-3">
                          {(() => {
                            const contact = getEmailContact(selectedEmail, activeFolder)
                            const name    = extractName(contact)
                            const palette = avatarPalette(name)
                            return (
                              <>
                                <Avatar className="size-9 flex-shrink-0">
                                  <AvatarFallback className={`text-xs font-medium ${palette}`}>
                                    {getInitials(name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground">
                                      {activeFolder === "sent" ? "To:" : "From:"}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">{name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      &lt;{extractEmail(contact)}&gt;
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                                    {formatFullDate(selectedEmail.date)}
                                  </p>
                                </div>
                                {/* Reply actions */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 gap-1.5 text-xs border-border bg-muted text-foreground/90 hover:bg-muted hover:text-foreground"
                                    onClick={() => openReplyCompose(selectedEmail)}
                                  >
                                    <Reply className="size-3" />
                                    Reply
                                  </Button>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground/90"
                                        onClick={() => openReplyCompose(selectedEmail)}
                                      >
                                        <ReplyAll className="size-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-muted text-foreground/90 border-border text-xs">Reply all</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-foreground/90"
                                        onClick={() => openForwardCompose(selectedEmail)}
                                      >
                                        <Forward className="size-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-muted text-foreground/90 border-border text-xs">Forward</TooltipContent>
                                  </Tooltip>
                                </div>
                              </>
                            )
                          })()}
                        </div>

                        <Separator className="mb-6 bg-border" />

                        {/* Email body */}
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.08, duration: 0.2 }}
                          className="prose prose-sm max-w-none prose-invert prose-zinc"
                        >
                          {selectedEmail.body.html && typeof selectedEmail.body.html === "string" ? (
                            <div
                              dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }}
                              className="[&_a]:text-blue-400 [&_a]:underline text-foreground/80"
                            />
                          ) : (
                            <p className="whitespace-pre-wrap leading-relaxed text-foreground/80 text-sm">
                              {selectedEmail.body.text || "No content"}
                            </p>
                          )}
                        </motion.div>
                      </div>
                    </ScrollArea>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col items-center justify-center text-center select-none"
                  >
                    <motion.div
                      initial={{ scale: 0.92 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                        <Mail className="size-7 text-muted-foreground/60" />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-foreground/80">No email selected</h2>
                        <p className="mt-1 text-xs text-muted-foreground/60">Pick one from the list to read it</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1 border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground text-xs"
                        onClick={() => setComposeOpen(true)}
                      >
                        <PenSquare className="mr-1.5 size-3" />
                        Compose
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </SidebarInset>

        {/* ── Compose dialog ── */}
        <Dialog open={composeOpen} onOpenChange={handleComposeClose}>
          <DialogContent className="sm:max-w-[580px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <PenSquare className="size-4 text-muted-foreground" />
                New Message
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Compose and send a new email
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSendEmail} className="space-y-3 mt-1">
              {/* To */}
              <div className="space-y-1">
                <Label htmlFor="to" className="text-xs text-muted-foreground">To</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  disabled={sending}
                  required
                  className="h-8 text-xs bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-xs text-muted-foreground">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="Email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  disabled={sending}
                  className="h-8 text-xs bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring"
                />
              </div>

              {/* Body */}
              <div className="space-y-1">
                <Label htmlFor="body" className="text-xs text-muted-foreground">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Write your message…"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  disabled={sending}
                  rows={10}
                  className="resize-none text-xs bg-muted border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring"
                />
              </div>

              {/* Error */}
              {sendError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-red-900/40 bg-red-900/20 px-3 py-2 text-xs text-red-400"
                >
                  {sendError}
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleComposeClose}
                  disabled={sending}
                  className="text-xs text-muted-foreground hover:text-foreground/90 hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={sending}
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {sending ? (
                    <>
                      <Loader2 className="mr-1.5 size-3 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="mr-1.5 size-3" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  )
}