"use client"

import * as React from "react"
import { FolderType } from "./mail"
import { getInitials } from "./formatters"
import { signOut } from "next-auth/react"
import { S } from "./styles"
import {
  Archive,
  ChevronDown,
  Clock,
  File,
  Inbox,
  LogOut,
  MessageCircle,
  Send,
  ShoppingCart,
  Megaphone,
  Star,
  Trash2,
  Users,
} from "lucide-react"

interface SidebarProps {
  userName: string
  activeFolder: FolderType
  unreadCount: number
  onFolderChange: (folder: FolderType) => void
}

export function Sidebar({ userName, activeFolder, unreadCount, onFolderChange }: SidebarProps) {
  const userInitials = getInitials(userName)

  const FOLDER_NAV: { label: string; folder: FolderType; icon: React.ReactNode }[] = [
    { label: "Inbox",   folder: "inbox",   icon: <Inbox   size={14} /> },
    { label: "Drafts",  folder: "drafts",  icon: <File    size={14} /> },
    { label: "Sent",    folder: "sent",    icon: <Send    size={14} /> },
    { label: "Starred", folder: "starred", icon: <Star    size={14} /> },
    { label: "Archive", folder: "archive", icon: <Archive size={14} /> },
    { label: "Trash",   folder: "trash",   icon: <Trash2  size={14} /> },
  ]

  const CATEGORY_NAV = [
    { label: "Social",     icon: <Users       size={14} />, count: 972  },
    { label: "Updates",    icon: <Clock       size={14} />, count: 342  },
    { label: "Forums",     icon: <MessageCircle size={14} />, count: 128 },
    { label: "Shopping",   icon: <ShoppingCart size={14} />, count: 8   },
    { label: "Promotions", icon: <Megaphone size={14} />, count: 21  },
  ]

  return (
    <aside style={S.sidebar}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 14px 10px", borderBottom: "0.5px solid #2a2a2a" }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, color: "#aaa", flexShrink: 0 }}>
          {userInitials}
        </div>
        <span style={{ flex: 1, fontSize: "12px", fontWeight: 500, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {userName}
        </span>
        <ChevronDown size={13} color="#555" />
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {FOLDER_NAV.map(({ label, folder, icon }) => {
          const isActive = activeFolder === folder
          return (
            <button
              key={folder}
              onClick={() => onFolderChange(folder)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                width: "100%", padding: "6px 14px",
                background: isActive ? "#222" : "transparent",
                border: "none", cursor: "pointer",
                color: isActive ? "#e8e8e8" : "#999",
                fontSize: "12.5px", textAlign: "left",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#1e1e1e" }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              {icon}
              <span style={{ flex: 1 }}>{label}</span>
              {folder === "inbox" && unreadCount > 0 && (
                <span style={{ fontSize: "11px", color: "#666" }}>{unreadCount}</span>
              )}
            </button>
          )
        })}

        <div style={{ padding: "10px 14px 4px", fontSize: "10px", color: "#444", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Categories
        </div>

        {CATEGORY_NAV.map(({ label, icon, count }) => (
          <button
            key={label}
            style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "6px 14px", background: "transparent", border: "none", cursor: "pointer", color: "#999", fontSize: "12.5px", textAlign: "left" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1e1e1e" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}
          >
            {icon}
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ fontSize: "11px", color: "#666" }}>{count}</span>
          </button>
        ))}
      </nav>

      <div style={{ borderTop: "0.5px solid #2a2a2a", padding: "10px 14px" }}>
        <button
          onClick={() => signOut()}
          style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", cursor: "pointer", color: "#666", fontSize: "12px", width: "100%" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#ccc" }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#666" }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}