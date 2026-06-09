"use client";

import { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Mail,
  UserCircle,
  Shield,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Smartphone,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingData {
  // Profile
  jobTitle: string;
  department: string;
  avatarUrl: string | null;

  // Role
  role: string;

  // Mailbox — always required
  mailboxAlias: string;
  mailboxDomain: string;
  mailboxPassword: string;

  // Devices — phones only
  phones: RegisteredPhone[];
}

interface RegisteredPhone {
  id: string;
  name: string;
  number: string;
}

type StrengthScore = 0 | 1 | 2 | 3;

interface PasswordStrength {
  score: StrengthScore;
  label: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEPS = [
  { id: "profile", label: "Profile", icon: UserCircle },
  { id: "role",    label: "Role",    icon: Shield },
  { id: "mailbox", label: "Mailbox", icon: Mail },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "review",  label: "Review",  icon: CheckCircle2 },
] as const;

type StepId = (typeof STEPS)[number]["id"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES = [
  { value: "viewer",  label: "Viewer",               description: "Read-only access to assigned resources" },
  { value: "support", label: "Support Technician",    description: "Manage tickets and user requests" },
  { value: "admin",   label: "IT Administrator",      description: "Full access to infrastructure management" },
  { value: "manager", label: "Department Manager",    description: "Manage team members and approvals" },
];

const DOMAINS = ["fortmont.me", "corp.fortmont.me", "dev.fortmont.me"];

function initData(): OnboardingData {
  return {
    jobTitle: "",
    department: "",
    avatarUrl: null,
    role: "",
    mailboxAlias: "",
    mailboxDomain: DOMAINS[0],
    mailboxPassword: "",
    phones: [],
  };
}

// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------

function passwordStrength(pw: string): PasswordStrength {
  if (!pw || pw.length === 0) return { score: 0, label: "", color: "" };

  let score = 0;
  if (pw.length >= 8)                                   score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))            score++;
  if (/[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw))     score++;

  if (score === 3) return { score: 3, label: "Strong", color: "bg-emerald-500" };
  if (score === 2) return { score: 2, label: "Fair",   color: "bg-amber-500" };
  if (score === 1) return { score: 1, label: "Weak",   color: "bg-destructive" };
  return { score: 0, label: "", color: "" };
}

// ---------------------------------------------------------------------------
// Sub-step: Profile
// ---------------------------------------------------------------------------

function ProfileStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ avatarUrl: url });
    // TODO: Upload avatar to your storage provider (e.g. Azure Blob / S3 / local)
    // POST /api/users/avatar with FormData containing the image file.
    // Replace the object URL with the returned permanent URL in data.avatarUrl.
  }

  return (
    <div className="space-y-6">
      {/* Avatar picker */}
      <div className="flex flex-col items-center gap-3">
        <Avatar
          className="h-20 w-20 ring-2 ring-border cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <AvatarImage src={data.avatarUrl ?? undefined} />
          <AvatarFallback className="text-lg bg-muted text-muted-foreground">
            <UserCircle className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload photo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="jobTitle">Job title</Label>
          <Input
            id="jobTitle"
            placeholder="Systems Engineer"
            value={data.jobTitle}
            onChange={(e) => onChange({ jobTitle: e.target.value })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Select value={data.department} onValueChange={(v) => onChange({ department: v })}>
            <SelectTrigger id="department">
              <SelectValue placeholder="Select department…" />
            </SelectTrigger>
            <SelectContent>
              {["IT", "Engineering", "Finance", "HR", "Operations", "Sales", "Legal"].map((d) => (
                <SelectItem key={d} value={d.toLowerCase()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Role
// ---------------------------------------------------------------------------

function RoleStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Select the role that best matches this user&apos;s responsibilities. Role assignment
        controls what they can see and do across the platform.
      </p>

      <div className="grid gap-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange({ role: r.value })}
            className={cn(
              "w-full text-left rounded-lg border px-4 py-3 transition-all",
              "hover:bg-accent hover:border-accent-foreground/20",
              data.role === r.value
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium leading-none">{r.label}</span>
              {data.role === r.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.description}</p>
          </button>
        ))}
      </div>

      {data.role && (
        <div className="rounded-md bg-muted/50 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">
            Selected: {ROLES.find((r) => r.value === data.role)?.label}
          </p>
          <p>
            {/* TODO: Load dynamic permission list from your role definition API */}
            {/* GET /api/roles/{role}/permissions — render a breakdown of allowed scopes */}
            Permissions will be assigned from your Entra ID role group on completion.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Mailbox (required)
// ---------------------------------------------------------------------------

function MailboxStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const pw = data.mailboxPassword ?? "";
  const strength = passwordStrength(pw);
  const preview = data.mailboxAlias ? `${data.mailboxAlias}@${data.mailboxDomain}` : null;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        A mailbox is required for all new users. Set the email address and an initial password —
        the user should change this on first sign-in.
      </p>

      {/* Email address */}
      <div className="space-y-1.5">
        <Label htmlFor="alias">
          Email address <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="alias"
            placeholder="jane.smith"
            value={data.mailboxAlias}
            onChange={(e) =>
              onChange({ mailboxAlias: e.target.value.toLowerCase().replace(/\s+/g, ".") })
            }
            className="flex-1"
          />
          <Select
            value={data.mailboxDomain}
            onValueChange={(v) => onChange({ mailboxDomain: v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>
                  @{d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {preview && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 mt-1">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-mono">{preview}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">Preview</Badge>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="mailboxPassword">
          Initial password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="mailboxPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            value={pw}
            onChange={(e) => onChange({ mailboxPassword: e.target.value })}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength meter */}
        {pw.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="flex gap-1">
              {([1, 2, 3] as StrengthScore[]).map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    i <= strength.score ? strength.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <p className="text-xs text-muted-foreground">
                Password strength:{" "}
                <span
                  className={cn(
                    strength.score === 1 && "text-destructive",
                    strength.score === 2 && "text-amber-500",
                    strength.score === 3 && "text-emerald-500"
                  )}
                >
                  {strength.label}
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-md border border-dashed border-muted-foreground/25 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">Exchange provisioning</p>
        <p>
          {/*
           * Handled in handleSubmit via POST /api/mailbox/create
           * Body: { email, password }
           * Force password change on first login via Exchange New-Mailbox -ResetPasswordOnNextLogon.
           */}
          Mailbox will be provisioned on your Exchange 2019 server on completion.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Devices (phones only)
// ---------------------------------------------------------------------------

function DevicesStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (patch: Partial<OnboardingData>) => void;
}) {
  const [phoneName, setPhoneName]     = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  function addPhone() {
    if (!phoneName.trim()) return;
    const newPhone: RegisteredPhone = {
      id: crypto.randomUUID(),
      name: phoneName.trim(),
      number: phoneNumber.trim(),
    };
    onChange({ phones: [...data.phones, newPhone] });
    setPhoneName("");
    setPhoneNumber("");
    // TODO: POST /api/devices/register
    // Body: { userId, name: phoneName, type: "mobile", number: phoneNumber }
    // Integrate with Entra ID device registration or your MDM/Intune solution.
  }

  function removePhone(id: string) {
    onChange({ phones: data.phones.filter((p) => p.id !== id) });
    // TODO: DELETE /api/devices/{id} to de-register the device in Entra ID / MDM
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Register the user&apos;s phone for MDM enrolment. They&apos;ll receive an enrolment
        invitation on first sign-in. This step is optional.
      </p>

      {/* Add phone form */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Register a phone
        </p>
        <div className="space-y-2">
          <Input
            placeholder="Device label (e.g. Jane's iPhone 15)"
            value={phoneName}
            onChange={(e) => setPhoneName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPhone(); }}
          />
          <Input
            placeholder="Phone number (optional, for enrolment SMS)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addPhone(); }}
          />
        </div>
        <Button
          type="button"
          onClick={addPhone}
          disabled={!phoneName.trim()}
          size="sm"
          className="w-full gap-1.5"
        >
          <Smartphone className="h-3.5 w-3.5" />
          Add phone
        </Button>
      </div>

      {/* Registered phones list */}
      {data.phones.length > 0 ? (
        <div className="space-y-2">
          {data.phones.map((phone) => (
            <div
              key={phone.id}
              className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5"
            >
              <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{phone.name}</p>
                {phone.number && (
                  <p className="text-xs text-muted-foreground font-mono">{phone.number}</p>
                )}
              </div>
              <Badge variant="outline" className="text-[10px] shrink-0">
                Mobile
              </Badge>
              <button
                type="button"
                onClick={() => removePhone(phone.id)}
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors text-xs shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 py-8 flex flex-col items-center gap-2 text-muted-foreground">
          <Smartphone className="h-7 w-7" />
          <p className="text-sm">No phone registered</p>
          <p className="text-xs">Can be added later from the user profile</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-step: Review
// ---------------------------------------------------------------------------

function ReviewStep({ data }: { data: OnboardingData }) {
  const roleLabel = ROLES.find((r) => r.value === data.role)?.label ?? "—";
  const pw = data.mailboxPassword ?? "";
  const maskedPassword = "•".repeat(Math.min(pw.length, 12));

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: "Job title",  value: data.jobTitle || "—" },
    { label: "Department", value: data.department || "—" },
    { label: "Role",       value: roleLabel },
    { label: "Mailbox",    value: `${data.mailboxAlias}@${data.mailboxDomain}` },
    { label: "Password",   value: <span className="font-mono tracking-widest">{maskedPassword || "—"}</span> },
    {
      label: "Phones",
      value: data.phones.length > 0
        ? data.phones.map((p) => p.name).join(", ")
        : "None registered",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Avatar summary */}
      <div className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3">
        <Avatar className="h-12 w-12 ring-1 ring-border">
          <AvatarImage src={data.avatarUrl ?? undefined} />
          <AvatarFallback className="text-sm bg-muted">
            <UserCircle className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium font-mono text-sm">
            {data.mailboxAlias}@{data.mailboxDomain}
          </p>
          <p className="text-xs text-muted-foreground">{data.jobTitle || "No job title"}</p>
        </div>
        <Badge variant="secondary" className="ml-auto capitalize">
          {data.role || "No role"}
        </Badge>
      </div>

      {/* Detail rows */}
      <div className="divide-y divide-border rounded-lg border overflow-hidden">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center px-4 py-2.5 text-sm">
            <span className="w-28 text-muted-foreground shrink-0 text-xs">{label}</span>
            <span className="text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-dashed border-muted-foreground/20 px-4 py-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/60 mb-0.5">On confirmation</p>
        <p>
          {/*
           * TODO: Extend handleSubmit to also:
           * 1. Assign Entra ID role group via Graph API
           * 2. POST /api/devices/register for each registered phone
           * Return a per-action status object and handle partial failures gracefully.
           */}
          All queued actions will be submitted to the provisioning pipeline.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main OnboardingFlow component
// ---------------------------------------------------------------------------

export default function OnboardingFlow() {
  const [stepIndex, setStepIndex]       = useState(0);
  const [direction, setDirection]       = useState<1 | -1>(1);
  const [data, setData]                 = useState<OnboardingData>(initData);
  const [submitting, setSubmitting]     = useState(false);
  const [submitError, setSubmitError]   = useState<string | null>(null);
  const [complete, setComplete]         = useState(false);

  const currentStep = STEPS[stepIndex];
  const progress    = ((stepIndex + 1) / STEPS.length) * 100;

  function patch(p: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...p }));
  }

  function canAdvance(): boolean {
    switch (currentStep.id as StepId) {
      case "role":
        return data.role !== "";
      case "mailbox":
        return (
          data.mailboxAlias.trim().length > 0 &&
          (data.mailboxPassword ?? "").trim().length >= 8
        );
      default:
        return true;
    }
  }

  function goNext() {
    if (stepIndex >= STEPS.length - 1) return;
    setDirection(1);
    setStepIndex((i) => i + 1);
  }

  function goBack() {
    if (stepIndex === 0) return;
    setDirection(-1);
    setStepIndex((i) => i - 1);
  }

 async function handleSubmit() {
  setSubmitting(true);
  setSubmitError(null);

  try {
    const res = await fetch("/api/mailbox/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `${data.mailboxAlias}@${data.mailboxDomain}`,
        password: data.mailboxPassword,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(payload?.error ?? "Mailbox creation failed");
    }

    // ✅ Mark user as onboarded
    const onboardRes = await fetch("/api/users/onboarded", {
      method: "POST",
    });

    if (!onboardRes.ok) {
      throw new Error("Failed to update onboarding status");
    }

    setComplete(true);
  } catch (err) {
    setSubmitError(err instanceof Error ? err.message : "Something went wrong");
  } finally {
    setSubmitting(false);
  }
}

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------
  if (complete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">User onboarded</h2>
          <p className="text-sm text-muted-foreground">
            The account is being provisioned. A welcome email will be sent to{" "}
            <span className="font-mono text-foreground">
              {data.mailboxAlias}@{data.mailboxDomain}
            </span>{" "}
            once the mailbox is ready.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setData(initData());
              setStepIndex(0);
              setComplete(false);
            }}
          >
            Onboard another user
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-xl space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">New user setup</h1>
          <p className="text-sm text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length} — {currentStep.label}
          </p>
        </div>

        {/* Progress + step pills */}
        <div className="space-y-3">
          <Progress value={progress} className="h-1" />
          <div className="flex gap-1.5 flex-wrap">
            {STEPS.map((step, i) => {
              const Icon   = step.icon;
              const done   = i < stepIndex;
              const active = i === stepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={i > stepIndex}
                  onClick={() => {
                    if (i < stepIndex) {
                      setDirection(-1);
                      setStepIndex(i);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground"
                      : done
                      ? "bg-muted text-muted-foreground hover:bg-accent cursor-pointer"
                      : "bg-muted/40 text-muted-foreground/50 cursor-not-allowed"
                  )}
                >
                  {done ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = currentStep.icon;
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}
              <h2 className="text-sm font-medium">{currentStep.label}</h2>
              {currentStep.id === "mailbox" && (
                <Badge variant="destructive" className="ml-auto text-[10px]">Required</Badge>
              )}
            </div>
          </div>

          <div className="px-6 py-5 min-h-[300px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
              >
                {currentStep.id === "profile" && <ProfileStep data={data} onChange={patch} />}
                {currentStep.id === "role"    && <RoleStep    data={data} onChange={patch} />}
                {currentStep.id === "mailbox" && <MailboxStep data={data} onChange={patch} />}
                {currentStep.id === "devices" && <DevicesStep data={data} onChange={patch} />}
                {currentStep.id === "review"  && <ReviewStep  data={data} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="gap-1.5"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            {currentStep.id !== "review" ? (
              <Button
                size="sm"
                type="button"
                onClick={goNext}
                disabled={!canAdvance()}
                className="gap-1.5"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1.5">
                {submitError && (
                  <p className="text-xs text-destructive">{submitError}</p>
                )}
                <Button
                  size="sm"
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-1.5"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {submitting ? "Provisioning…" : "Confirm & provision"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}