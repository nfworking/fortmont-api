export interface EmailBody {
  text: string
  html: string | false
}

export interface Email {
  uid: number
  subject: string
  from?: string
  to?: string
  date: string
  flags: Record<string, boolean>
  body: EmailBody
}

export interface MailboxResponse {
  mailbox: string
  folder?: string
  count: number
  emails: Email[]
}

export type FolderType = "inbox" | "sent" | "drafts" | "starred" | "archive" | "trash"

export interface UserSession {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}