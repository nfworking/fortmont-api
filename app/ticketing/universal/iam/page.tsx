"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  UserX,
  ShieldAlert,
  HelpCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RequestType =
  | "access_request"
  | "access_revocation"
  | "password_reset"
  | "account_lockout"
  | "permission_issue"
  | "other"

type Priority = "low" | "medium" | "high" | "urgent"

interface IamRequestPayload {
  requestType: RequestType
  priority: Priority
  fullName: string
  email: string
  department: string
  managerName: string
  targetSystem: string
  description: string
  affectsOthers: boolean
}

interface IamRequestFormProps {
  /** API endpoint the form will POST to. Defaults to /api/iam/requests */
  endpoint?: string
  /** Called after a successful submission */
  onSuccess?: (payload: IamRequestPayload) => void
}

const REQUEST_TYPES: {
  value: RequestType
  label: string
  description: string
  icon: React.ElementType
}[] = [
  {
    value: "access_request",
    label: "New access request",
    description: "Request access to a system, group, or resource",
    icon: UserPlus,
  },
  {
    value: "access_revocation",
    label: "Revoke access",
    description: "Remove access for yourself or someone else",
    icon: UserX,
  },
  {
    value: "password_reset",
    label: "Password reset",
    description: "Reset or unlock credentials for an account",
    icon: KeyRound,
  },
  {
    value: "account_lockout",
    label: "Account lockout",
    description: "Account is locked, disabled, or showing sign-in errors",
    icon: ShieldAlert,
  },
  {
    value: "permission_issue",
    label: "Permission issue",
    description: "Existing access is incorrect, missing, or not working as expected",
    icon: ShieldCheck,
  },
  {
    value: "other",
    label: "Other IAM issue",
    description: "Anything else related to identity and access management",
    icon: HelpCircle,
  },
]

const PRIORITIES: { value: Priority; label: string; hint: string }[] = [
  { value: "low", label: "Low", hint: "No immediate impact" },
  { value: "medium", label: "Medium", hint: "Affects one user's work" },
  { value: "high", label: "High", hint: "Blocking work for a team" },
  { value: "urgent", label: "Urgent", hint: "Security concern or outage" },
]

const initialFormState = {
  requestType: "" as RequestType | "",
  priority: "medium" as Priority,
  fullName: "",
  email: "",
  department: "",
  managerName: "",
  targetSystem: "",
  description: "",
  affectsOthers: "no" as "yes" | "no",
}

type SubmitStatus = "idle" | "submitting" | "success" | "error"

export default function IamRequestForm({
  endpoint = "/api/iam/requests",
  onSuccess,
}: IamRequestFormProps) {
  const [form, setForm] = useState(initialFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string>("")

  function update<K extends keyof typeof initialFormState>(
    key: K,
    value: typeof initialFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {}

    if (!form.requestType) next.requestType = "Select a request type."
    if (!form.fullName.trim()) next.fullName = "Enter your full name."
    if (!form.email.trim()) {
      next.email = "Enter your email address."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Enter a valid email address."
    }
    if (!form.department.trim()) next.department = "Enter your department."
    if (!form.description.trim()) {
      next.description = "Describe the request or problem."
    } else if (form.description.trim().length < 20) {
      next.description = "Add a bit more detail (at least 20 characters)."
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validate()) return

    setStatus("submitting")
    setErrorMessage("")

    const payload: IamRequestPayload = {
      requestType: form.requestType as RequestType,
      priority: form.priority,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      managerName: form.managerName.trim(),
      targetSystem: form.targetSystem.trim(),
      description: form.description.trim(),
      affectsOthers: form.affectsOthers === "yes",
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.message || `Request failed (${res.status})`)
      }

      setStatus("success")
      onSuccess?.(payload)
    } catch (err) {
      setStatus("error")
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong submitting your request."
      )
    }
  }

  function handleReset() {
    setForm(initialFormState)
    setErrors({})
    setStatus("idle")
    setErrorMessage("")
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-zinc-50">Request submitted</h3>
            <p className="text-sm text-zinc-400">
              The IAM team has received your request and will follow up by email at{" "}
              <span className="text-zinc-200">{form.email || "your address"}</span>.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-2 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800 hover:text-zinc-50"
            onClick={handleReset}
          >
            Submit another request
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl border-zinc-800 bg-zinc-950 text-zinc-100">
      <CardHeader className="space-y-1.5 border-b border-zinc-800 pb-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-zinc-400" />
          <Badge
            variant="outline"
            className="border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-400"
          >
            IAM
          </Badge>
        </div>
        <CardTitle className="text-xl text-zinc-50">IAM request form</CardTitle>
        <CardDescription className="text-zinc-400">
          Use this form for access requests, account problems, or other identity and
          access management issues. Urgent security concerns should also be reported
          directly to the security team.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-8 pt-6">
          {/* Request type */}
          <div className="space-y-3">
            <Label className="text-zinc-200">
              Request type <span className="text-red-400">*</span>
            </Label>
            <RadioGroup
              value={form.requestType}
              onValueChange={(v) => update("requestType", v as RequestType)}
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {REQUEST_TYPES.map(({ value, label, description, icon: Icon }) => {
                const selected = form.requestType === value
                return (
                  <Label
                    key={value}
                    htmlFor={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                      selected
                        ? "border-zinc-500 bg-zinc-900"
                        : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900"
                    }`}
                  >
                    <RadioGroupItem value={value} id={value} className="mt-0.5 border-zinc-600" />
                    <span className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-100">
                        <Icon className="h-3.5 w-3.5 text-zinc-400" />
                        {label}
                      </span>
                      <span className="text-xs text-zinc-500">{description}</span>
                    </span>
                  </Label>
                )
              })}
            </RadioGroup>
            {errors.requestType && (
              <p className="text-xs text-red-400">{errors.requestType}</p>
            )}
          </div>

          <Separator className="bg-zinc-800" />

          {/* Requester details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-300">Your details</h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-zinc-300">
                  Full name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="fullName"
                  placeholder="Jane Doe"
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                />
                {errors.fullName && <p className="text-xs text-red-400">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jane.doe@fortmont.me"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-zinc-300">
                  Department <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="department"
                  placeholder="Finance, Engineering, etc."
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                />
                {errors.department && (
                  <p className="text-xs text-red-400">{errors.department}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="managerName" className="text-zinc-300">
                  Manager name
                </Label>
                <Input
                  id="managerName"
                  placeholder="Optional"
                  value={form.managerName}
                  onChange={(e) => update("managerName", e.target.value)}
                  className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Request details */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-zinc-300">Request details</h4>

            <div className="space-y-2">
              <Label htmlFor="targetSystem" className="text-zinc-300">
                System, app, or resource
              </Label>
              <Input
                id="targetSystem"
                placeholder="e.g. Entra ID, Exchange, VPN, Fortmont dashboard"
                value={form.targetSystem}
                onChange={(e) => update("targetSystem", e.target.value)}
                className="border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-zinc-300">
                Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe what you need or the problem you're experiencing. Include error messages, when it started, and what you've already tried."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="min-h-28 border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
              />
              <div className="flex items-center justify-between">
                {errors.description ? (
                  <p className="text-xs text-red-400">{errors.description}</p>
                ) : (
                  <span className="text-xs text-zinc-600">Minimum 20 characters</span>
                )}
                <span className="text-xs text-zinc-600">{form.description.length} chars</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-zinc-300">
                  Priority
                </Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => update("priority", v as Priority)}
                >
                  <SelectTrigger
                    id="priority"
                    className="border-zinc-800 bg-zinc-900 text-zinc-100"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex flex-col">
                          <span>{p.label}</span>
                          <span className="text-xs text-zinc-500">{p.hint}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Affects other users?</Label>
                <RadioGroup
                  value={form.affectsOthers}
                  onValueChange={(v) => update("affectsOthers", v as "yes" | "no")}
                  className="flex h-9 items-center gap-4"
                >
                  <Label htmlFor="affects-no" className="flex items-center gap-2 text-sm text-zinc-300">
                    <RadioGroupItem id="affects-no" value="no" className="border-zinc-600" />
                    No
                  </Label>
                  <Label htmlFor="affects-yes" className="flex items-center gap-2 text-sm text-zinc-300">
                    <RadioGroupItem id="affects-yes" value="yes" className="border-zinc-600" />
                    Yes
                  </Label>
                </RadioGroup>
              </div>
            </div>
          </div>

          {status === "error" && (
            <Alert variant="destructive" className="border-red-900/50 bg-red-950/40 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Submission failed</AlertTitle>
              <AlertDescription className="text-red-300/80">
                {errorMessage || "Please try again, or contact IT directly if the issue persists."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t border-zinc-800 pt-6">
          <p className="text-xs text-zinc-600">
            Fields marked <span className="text-red-400">*</span> are required.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={status === "submitting"}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={status === "submitting"}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-300"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit request"
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}