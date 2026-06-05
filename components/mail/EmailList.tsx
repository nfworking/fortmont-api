"use client"

import * as React from "react"
import { Email, FolderType } from "./mail"
import { getEmailContact, extractName, avatarPalette, tagStyle, formatDate, getEmailSnippet } from "./formatters"
import { S } from "./styles"
import { Inbox, Loader2 } from "lucide-react"

interface EmailListProps {
  activeFolder: FolderType
  emailsLoading: boolean
  filteredEmails: Email[]
  selectedEmail: Email | null
  searchQuery: string
  activeTab: "all" | "unread"
  setActiveTab: (tab: "all" | "unread") => void
  setSearchQuery: (query: string) => void
  setSelectedEmail: (email: Email) => void
}

export function EmailList({
  activeFolder,
  emailsLoading,
  filteredEmails,
  selectedEmail,
  searchQuery,
  activeTab,
  setActiveTab,
  setSearchQuery,
  setSelectedEmail,
}: EmailListProps) {
  return (
    <section style={S.listPanel}>
      <div style={{ padding: "12px 14px 0", borderBottom: "0.5px solid #2a2a2a", flexShrink: 0 }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#e8e8e8", marginBottom: "10px", textTransform: "capitalize" }}>
          {activeFolder}
        </div>
        <div style={{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          {(["all", "unread"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "3px 11px", borderRadius: "14px",
                border: "0.5px solid #333",
                background: activeTab === tab ? "#2a2a2a" : "transparent",
                color: activeTab === tab ? "#e8e8e8" : "#777",
                fontSize: "11px", cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.1s",
              }}
            >
              {tab === "all" ? "All mail" : "Unread"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "7px", background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "6px", padding: "5px 10px", marginBottom: "10px" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="search"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "none", border: "none", outline: "none", color: "#ccc", fontSize: "12px", width: "100%", fontFamily: "inherit" }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {emailsLoading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: "#444" }}>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px", color: "#444", gap: "8px" }}>
            <Inbox size={24} />
            <span style={{ fontSize: "12px" }}>{searchQuery ? "No results" : "No emails here"}</span>
          </div>
        ) : (
          filteredEmails.map((email) => {
            const isRead     = email.flags?.seen || activeFolder === "sent"
            const isSelected = selectedEmail?.uid === email.uid
            const contact    = getEmailContact(email, activeFolder)
            const name       = extractName(contact)

            const tagWords = [email.subject, email.body.text].join(" ").toLowerCase()
            const tags: string[] = []
            if (tagWords.includes("meeting"))  tags.push("meeting")
            if (tagWords.includes("budget"))   tags.push("budget")
            if (/work|project|update|report|team|announce/i.test(tagWords)) tags.push("work")
            if (/personal|weekend|plan|hike/i.test(tagWords)) tags.push("personal")
            if (/important|urgent|crucial/i.test(tagWords))   tags.push("important")

            return (
              <button
                key={email.uid}
                onClick={() => setSelectedEmail(email)}
                style={{
                  display: "block", width: "100%", padding: "11px 14px",
                  background: isSelected ? "#1e2030" : "transparent",
                  borderLeft: isSelected ? "2px solid #4a6fa5" : "2px solid transparent",
                  borderRight: "none", borderTop: "none",
                  borderBottom: "0.5px solid #1e1e1e",
                  cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "#1a1a1a" }}
                onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "3px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", minWidth: 0 }}>
                    {!isRead && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4a7abf", flexShrink: 0, display: "inline-block" }} />}
                    <span style={{ fontSize: "12.5px", fontWeight: isRead ? 400 : 600, color: "#e0e0e0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>
                      {activeFolder === "sent" ? `To: ${name}` : name}
                    </span>
                  </div>
                  <span style={{ fontSize: "10.5px", color: "#555", flexShrink: 0, paddingLeft: "6px" }}>
                    {formatDate(email.date)}
                  </span>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "3px" }}>
                  {email.subject || "(no subject)"}
                </div>
                <div style={{ fontSize: "11px", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: tags.length ? "6px" : 0 }}>
                  {getEmailSnippet(email.body)}
                </div>
                {tags.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "10px", border: "0.5px solid", ...tagStyle(tag) }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}