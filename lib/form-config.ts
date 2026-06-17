/**
 * Central form configuration.
 *
 * Add/remove request types, fields, or conditional branches here — the
 * DynamicForm component reads this file and renders everything automatically.
 *
 * Field types supported: text, textarea, email, number, select, radio,
 * checkbox, info. Any field may declare `showWhen` to render conditionally
 * based on previously-answered field values.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "info";

export type FieldValue = string | number | boolean | undefined;

export interface ShowWhen {
  /** Field id (within the same request type) to check. */
  field: string;
  /** Value(s) that activate this field. */
  equals: FieldValue | FieldValue[];
}

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDef {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: FieldOption[];
  /** For `info` fields: tone of the callout. */
  tone?: "info" | "warning" | "success";
  /** For `info` fields: markdown-ish body text (plain text + line breaks). */
  body?: string;
  showWhen?: ShowWhen | ShowWhen[];
}

export interface RequestType {
  id: string;
  label: string;
  description: string;
  fields: FieldDef[];
}

export const formConfig: RequestType[] = [
  {
    id: "general",
    label: "General",
    description: "Questions, access, or anything that doesn't fit elsewhere.",
    fields: [
      {
        id: "summary",
        label: "Short summary",
        type: "text",
        placeholder: "e.g. Request for new monitor",
        required: true,
      },
      {
        id: "details",
        label: "Details",
        type: "textarea",
        placeholder: "Describe what you need…",
        required: true,
      },
      {
        id: "urgency",
        label: "Urgency",
        type: "select",
        required: true,
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
        ],
      },
      {
        id: "contact_email",
        label: "Contact email",
        type: "email",
        placeholder: "you@company.com",
        required: true,
      },
    ],
  },

  {
    id: "infrastructure",
    label: "Infrastructure",
    description: "Servers, networking, storage, on-prem and cloud infra.",
    fields: [
      {
        id: "service_down",
        label: "Is the service currently down?",
        type: "radio",
        required: true,
        options: [
          { label: "Yes — outage", value: "yes" },
          { label: "No — degraded or question", value: "no" },
        ],
      },
      {
        id: "outage_instructions",
        label: "Before you continue",
        type: "info",
        tone: "warning",
        body:
          "If this is a production outage:\n" +
          "1. Page the on-call engineer in #infra-oncall.\n" +
          "2. Check the status dashboard for known incidents.\n" +
          "3. Capture any error messages or screenshots below.",
        showWhen: { field: "service_down", equals: "yes" },
      },
      {
        id: "service_name",
        label: "Affected service / hostname",
        type: "text",
        placeholder: "e.g. api-gateway-prod",
        required: true,
      },
      {
        id: "device_ip",
        label: "Device or endpoint IP",
        type: "text",
        placeholder: "10.0.0.1",
        showWhen: { field: "service_down", equals: "yes" },
        required: true,
      },
      {
        id: "people_affected",
        label: "Approx. people affected",
        type: "number",
        placeholder: "0",
        showWhen: { field: "service_down", equals: "yes" },
        required: true,
      },
      {
        id: "started_at",
        label: "When did it start?",
        type: "text",
        placeholder: "e.g. 10:42 today",
        showWhen: { field: "service_down", equals: "yes" },
      },
      {
        id: "question",
        label: "Your question",
        type: "textarea",
        placeholder: "Describe what you'd like to know…",
        showWhen: { field: "service_down", equals: "no" },
        required: true,
      },
      {
        id: "contact_email",
        label: "Contact email",
        type: "email",
        placeholder: "you@company.com",
        required: true,
      },
    ],
  },

  {
    id: "iam",
    label: "IAM / Access",
    description: "Account creation, permissions, group membership, MFA.",
    fields: [
      {
        id: "action",
        label: "What do you need?",
        type: "select",
        required: true,
        options: [
          { label: "Grant access", value: "grant" },
          { label: "Revoke access", value: "revoke" },
          { label: "Reset MFA", value: "mfa_reset" },
          { label: "Unlock account", value: "unlock" },
        ],
      },
      {
        id: "manager_approval_note",
        label: "Manager approval required",
        type: "info",
        tone: "info",
        body:
          "Grant requests require written approval from the requester's line manager. " +
          "Please CC them on the ticket or attach approval below.",
        showWhen: { field: "action", equals: "grant" },
      },
      {
        id: "target_user",
        label: "Target user (email)",
        type: "email",
        placeholder: "user@company.com",
        required: true,
      },
      {
        id: "system",
        label: "System / application",
        type: "select",
        required: true,
        options: [
          { label: "AWS", value: "aws" },
          { label: "Azure AD", value: "azure" },
          { label: "GitHub Org", value: "github" },
          { label: "Okta", value: "okta" },
          { label: "Other", value: "other" },
        ],
      },
      {
        id: "role",
        label: "Role / permission level",
        type: "text",
        placeholder: "e.g. ReadOnly, Admin",
        showWhen: { field: "action", equals: ["grant", "revoke"] },
        required: true,
      },
      {
        id: "mfa_method",
        label: "Preferred MFA method after reset",
        type: "radio",
        options: [
          { label: "Authenticator app", value: "totp" },
          { label: "Hardware key", value: "hardware" },
          { label: "SMS (not recommended)", value: "sms" },
        ],
        showWhen: { field: "action", equals: "mfa_reset" },
      },
      {
        id: "justification",
        label: "Business justification",
        type: "textarea",
        placeholder: "Why is this access needed?",
        required: true,
      },
      {
        id: "acknowledge",
        label: "I confirm this request complies with the access policy.",
        type: "checkbox",
        required: true,
      },
    ],
  },
];
