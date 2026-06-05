import { Email, FolderType, EmailBody } from "./mail"

export function getEmailContact(email: Email, folder: FolderType): string {
  return folder === "sent" ? email.to || "" : email.from || ""
}

export function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (days === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  if (days === 1) return "Yesterday"
  if (days < 7) return date.toLocaleDateString("en-US", { weekday: "short" })
  if (days < 365) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function formatFullDate(dateString: string) {
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function extractName(from: string) {
  const match = from.match(/^([^<@]+)/)
  if (match) {
    const name = match[1].trim().replace(/"/g, "")
    return name || from.split("@")[0]
  }
  return from.split("@")[0]
}

export function extractEmail(from: string) {
  const match = from.match(/<([^>]+)>/)
  return match ? match[1] : from
}

export function getInitials(name: string) {
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getEmailSnippet(body: EmailBody): string {
  const text = body.text || ""
  return text.trim().slice(0, 100) + (text.length > 100 ? "…" : "")
}

export const AVATAR_PALETTES = [
  { bg: "#142230", text: "#6fa3d4" },
  { bg: "#1e1a30", text: "#9f70c4" },
  { bg: "#1a2a1a", text: "#5abf8a" },
  { bg: "#251a10", text: "#c4884a" },
  { bg: "#1a1a30", text: "#7070d4" },
  { bg: "#2a1a1a", text: "#d47070" },
  { bg: "#101e20", text: "#50b4c0" },
  { bg: "#201a10", text: "#c0a050" },
]

export function avatarPalette(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length]
}

const TAG_STYLES: Record<string, React.CSSProperties> = {
  work:      { borderColor: "#2a3a5a", color: "#6fa3d4", background: "#141c2a" },
  personal:  { borderColor: "#1e3a2a", color: "#5abf8a", background: "#101c14" },
  important: { borderColor: "#3a2a1a", color: "#c4884a", background: "#1e1408" },
  budget:    { borderColor: "#2a1a3a", color: "#9f70c4", background: "#180e20" },
  meeting:   { borderColor: "#2a2a1a", color: "#b4b458", background: "#1c1c08" },
  social:    { borderColor: "#3a1a2a", color: "#c460a0", background: "#20081a" },
  default:   { borderColor: "#333",    color: "#888",    background: "#1e1e1e" },
}

export function tagStyle(tag: string): React.CSSProperties {
  return TAG_STYLES[tag.toLowerCase()] ?? TAG_STYLES.default
}