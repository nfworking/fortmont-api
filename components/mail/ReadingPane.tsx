"use client"

import * as React from "react"
import { Email } from "./mail"
import { extractEmail, formatFullDate, getInitials, avatarPalette } from "./formatters"
import { ToolbarBtn } from "./ToolbarBtn"
import { S } from "./styles"
import {
  AlertTriangle,
  Archive,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  Loader2,
  Mail,
  MoreVertical,
  Trash2,
} from "lucide-react"

interface ReadingPaneProps {
  selectedEmail: Email | null
  selectedName: string
  selectedContact: string
  replyBody: string
  sending: boolean
  sendError: string | null
  sendSuccess: boolean
  muteThread: boolean
  replyRef: React.RefObject<HTMLTextAreaElement | null>
  setReplyBody: (val: string) => void
  setMuteThread: (val: boolean) => void
  handleSendReply: (e: React.FormEvent) => void
  openForwardCompose: (email: Email) => void
}

export function ReadingPane({
  selectedEmail,
  selectedName,
  selectedContact,
  replyBody,
  sending,
  sendError,
  sendSuccess,
  muteThread,
  replyRef,
  setReplyBody,
  setMuteThread,
  handleSendReply,
  openForwardCompose,
}: ReadingPaneProps) {
  const selectedPalette = selectedEmail ? avatarPalette(selectedName) : { bg: "#2a2a2a", text: "#aaa" }

  return (
    <main style={S.readingPane}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 14px", borderBottom: "0.5px solid #2a2a2a", background: "#161616", flexShrink: 0 }}>
        {[
          { icon: <Archive size={14} />, title: "Archive" },
          { icon: <AlertTriangle size={14} />, title: "Junk" },
          { icon: <Trash2 size={14} />, title: "Delete" },
        ].map(({ icon, title }) => (
          <ToolbarBtn key={title} title={title}>{icon}</ToolbarBtn>
        ))}
        <div style={{ flex: 1 }} />
        <ToolbarBtn title="Snooze"><Clock size={14} /></ToolbarBtn>
        <div style={{ flex: 1 }} />
        {selectedEmail && (
          <>
            <ToolbarBtn title="Reply" onClick={() => replyRef.current?.focus()}><CornerUpLeft size={14} /></ToolbarBtn>
            <ToolbarBtn title="Reply all" onClick={() => replyRef.current?.focus()}><CornerUpLeft size={14} /></ToolbarBtn>
            <ToolbarBtn title="Forward" onClick={() => openForwardCompose(selectedEmail)}><CornerUpRight size={14} /></ToolbarBtn>
          </>
        )}
        <ToolbarBtn title="More"><MoreVertical size={14} /></ToolbarBtn>
      </div>

      {selectedEmail ? (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: selectedPalette.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: selectedPalette.text, flexShrink: 0 }}>
                {getInitials(selectedName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#e8e8e8" }}>{selectedName}</div>
                <div style={{ fontSize: "12px", color: "#777", marginTop: "2px" }}>{selectedEmail.subject || "(no subject)"}</div>
                <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                  Reply-To: {extractEmail(selectedContact)}
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "#555", flexShrink: 0 }}>
                {formatFullDate(selectedEmail.date)}
              </div>
            </div>

            <div style={{ borderTop: "0.5px solid #2a2a2a", paddingTop: "18px", fontSize: "13px", color: "#c0c0c0", lineHeight: 1.75 }}>
              {selectedEmail.body.html && typeof selectedEmail.body.html === "string" ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }} style={{ color: "#c0c0c0" }} />
              ) : (
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
                  {selectedEmail.body.text || "No content"}
                </pre>
              )}
            </div>
          </div>

          <div style={{ borderTop: "0.5px solid #2a2a2a", padding: "12px 16px", background: "#161616", flexShrink: 0 }}>
            <form onSubmit={handleSendReply}>
              <div style={{ background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: "8px", padding: "10px 12px" }}>
                <textarea
                  ref={replyRef}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={`Reply ${selectedName}…`}
                  disabled={sending}
                  rows={3}
                  style={{
                    width: "100%", background: "none", border: "none", outline: "none",
                    color: replyBody ? "#e0e0e0" : "#555",
                    fontSize: "12px", resize: "none", fontFamily: "inherit",
                    lineHeight: 1.6,
                  }}
                />

                {sendError && (
                  <div style={{ fontSize: "11px", color: "#c46060", marginTop: "4px", padding: "4px 8px", background: "#2a1414", borderRadius: "4px", border: "0.5px solid #5a2a2a" }}>
                    {sendError}
                  </div>
                )}
                {sendSuccess && (
                  <div style={{ fontSize: "11px", color: "#5abf8a", marginTop: "4px" }}>
                    Message sent.
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", color: "#555", fontSize: "11px", userSelect: "none" }}>
                    <div
                      onClick={() => setMuteThread(!muteThread)}
                      style={{
                        width: "28px", height: "15px", borderRadius: "8px",
                        background: muteThread ? "#3a5a8a" : "#2a2a2a",
                        border: "0.5px solid #333", position: "relative",
                        cursor: "pointer", transition: "background 0.2s",
                      }}
                    >
                      <div style={{
                        width: "11px", height: "11px", borderRadius: "50%",
                        background: muteThread ? "#6fa3d4" : "#555",
                        position: "absolute", top: "1.5px",
                        left: muteThread ? "14px" : "2px",
                        transition: "left 0.2s, background 0.2s",
                      }} />
                    </div>
                    Mute this thread
                  </label>

                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    style={{
                      padding: "5px 16px", borderRadius: "6px",
                      border: "0.5px solid #3a5a8a",
                      background: sending || !replyBody.trim() ? "#111" : "#1a2a40",
                      color: sending || !replyBody.trim() ? "#444" : "#6fa3d4",
                      fontSize: "12px", cursor: sending || !replyBody.trim() ? "not-allowed" : "pointer",
                      fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px",
                      transition: "all 0.1s",
                    }}
                  >
                    {sending ? <><Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> Sending…</> : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#444", gap: "10px" }}>
          <Mail size={28} />
          <div style={{ fontSize: "13px" }}>Select an email to read</div>
        </div>
      )}
    </main>
  )
}