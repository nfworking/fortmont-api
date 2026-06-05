"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { Email, FolderType, MailboxResponse, UserSession } from "@/components/mail/mail"
import { getEmailContact, extractEmail, extractName, formatFullDate } from "@/components/mail/formatters"
import { S } from "@/components/mail/styles"
import { Sidebar } from "@/components/mail/Sidebar"
import { EmailList } from "@/components/mail/EmailList"
import { ReadingPane } from "@/components/mail/ReadingPane"
import { Mail } from "lucide-react"

export default function MailClient() {
  const [session,       setSession]       = useState<UserSession | null>(null)
  const [mailbox,       setMailbox]       = useState<MailboxResponse | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [activeFolder,  setActiveFolder]  = useState<FolderType>("inbox")
  const [loading,       setLoading]       = useState(true)
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [searchQuery,   setSearchQuery]   = useState("")
  const [activeTab,     setActiveTab]     = useState<"all" | "unread">("all")
  const [muteThread,    setMuteThread]    = useState(false)

  const [replyTo,      setReplyTo]      = useState("")
  const [replySubject, setReplySubject] = useState("")
  const [replyBody,    setReplyBody]    = useState("")
  const [sending,      setSending]      = useState(false)
  const [sendError,    setSendError]    = useState<string | null>(null)
  const [sendSuccess,  setSendSuccess]  = useState(false)

  const replyRef = useRef<HTMLTextAreaElement>(null)

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

  useEffect(() => {
    if (!selectedEmail) return
    const contact = getEmailContact(selectedEmail, activeFolder)
    setReplyTo(extractEmail(contact))
    setReplySubject(`Re: ${selectedEmail.subject}`)
    setReplyBody("")
    setSendError(null)
    setSendSuccess(false)
    setMuteThread(false)
  }, [selectedEmail, activeFolder])

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

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyTo.trim()) { setSendError("No recipient address"); return }
    if (!replyBody.trim()) { setSendError("Message body is empty"); return }
    setSending(true)
    setSendError(null)
    setSendSuccess(false)
    try {
      const res = await fetch("/api/mailbox/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:      replyTo.trim(),
          subject: replySubject.trim(),
          text:    replyBody,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to send")
      }
      setSendSuccess(true)
      setReplyBody("")
      if (activeFolder === "sent") fetchEmails("sent")
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send")
    } finally {
      setSending(false)
    }
  }

  function openForwardCompose(email: Email) {
    const contact = getEmailContact(email, activeFolder)
    setReplyTo("")
    setReplySubject(`Fwd: ${email.subject}`)
    setReplyBody(`\n\n— Forwarded from ${extractName(contact)} on ${formatFullDate(email.date)} —\n${email.body.text}`)
    replyRef.current?.focus()
  }

  const emails = mailbox?.emails ?? []

  const filteredEmails = emails.filter((email) => {
    const contact = getEmailContact(email, activeFolder)
    const matchesSearch =
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || !email.flags?.seen
    return matchesSearch && matchesTab
  })

  const unreadCount = emails.filter((e) => !e.flags?.seen).length

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#111", flexDirection: "column", gap: "12px" }}>
        <Mail size={24} color="#555" />
        <p style={{ color: "#555", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>Loading</p>
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#111", flexDirection: "column", gap: "24px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, border: "0.5px solid #2a2a2a", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mail size={22} color="#888" />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 500, color: "#e8e8e8" }}>Mail</h1>
          <p style={{ fontSize: "13px", color: "#555", marginTop: "6px" }}>Sign in to access your mailbox</p>
        </div>
        <button
          onClick={() => (window.location.href = "/api/auth/signin")}
          style={{ padding: "8px 24px", borderRadius: "8px", border: "0.5px solid #3a5a8a", background: "#1a2a40", color: "#6fa3d4", fontSize: "13px", cursor: "pointer" }}
        >
          Sign in
        </button>
      </div>
    )
  }

  const userName = session.user.name || extractName(session.user.email || "")
  const selectedContact = selectedEmail ? getEmailContact(selectedEmail, activeFolder) : ""
  const selectedName = selectedEmail ? extractName(selectedContact) : ""

  return (
    <div style={S.root}>
      <Sidebar
        userName={userName}
        activeFolder={activeFolder}
        unreadCount={unreadCount}
        onFolderChange={handleFolderChange}
      />

      <EmailList
        activeFolder={activeFolder}
        emailsLoading={emailsLoading}
        filteredEmails={filteredEmails}
        selectedEmail={selectedEmail}
        searchQuery={searchQuery}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchQuery={setSearchQuery}
        setSelectedEmail={setSelectedEmail}
      />

      <ReadingPane
        selectedEmail={selectedEmail}
        selectedName={selectedName}
        selectedContact={selectedContact}
        replyBody={replyBody}
        sending={sending}
        sendError={sendError}
        sendSuccess={sendSuccess}
        muteThread={muteThread}
        replyRef={replyRef}
        setReplyBody={setReplyBody}
        setMuteThread={setMuteThread}
        handleSendReply={handleSendReply}
        openForwardCompose={openForwardCompose}
      />

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}