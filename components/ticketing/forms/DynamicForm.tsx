import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  type FieldDef,
  type FieldValue,
  type RequestType,
  type ShowWhen,
  formConfig,
} from "@/lib/form-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react"; // Added Loader2 icon

type Values = Record<string, FieldValue>;

function matches(rule: ShowWhen, values: Values): boolean {
  const v = values[rule.field];
  if (Array.isArray(rule.equals)) return rule.equals.includes(v as never);
  return v === rule.equals;
}

function isVisible(field: FieldDef, values: Values): boolean {
  if (!field.showWhen) return true;
  const rules = Array.isArray(field.showWhen) ? field.showWhen : [field.showWhen];
  return rules.every((r) => matches(r, values));
}

function InfoCallout({ field }: { field: FieldDef }) {
  const Icon =
    field.tone === "warning" ? AlertCircle : field.tone === "success" ? CheckCircle2 : Info;
  return (
    <div className="flex gap-3 rounded-md border border-border bg-muted p-4">
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1">
        <p className="text-sm font-medium">{field.label}</p>
        {field.body && (
          <p className="whitespace-pre-line text-sm text-muted-foreground">{field.body}</p>
        )}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FieldDef;
  value: FieldValue;
  onChange: (v: FieldValue) => void;
  disabled?: boolean; // Prop to visually block input during submission
}) {
  if (field.type === "info") return <InfoCallout field={field} />;

  const labelEl = (
    <Label htmlFor={field.id} className="text-sm font-medium">
      {field.label}
      {field.required && <span className="ml-1 text-muted-foreground">*</span>}
    </Label>
  );

  const desc = field.description && (
    <p className="text-xs text-muted-foreground">{field.description}</p>
  );

  switch (field.type) {
    case "text":
    case "email":
      return (
        <div className="space-y-2">
          {labelEl}
          {desc}
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            disabled={disabled}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          {labelEl}
          {desc}
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder}
            value={value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
            required={field.required}
            disabled={disabled}
          />
        </div>
      );

    case "textarea":
      return (
        <div className="space-y-2">
          {labelEl}
          {desc}
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            rows={4}
            disabled={disabled}
          />
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          {labelEl}
          {desc}
          <Select value={(value as string) ?? ""} onValueChange={(v) => onChange(v)} disabled={disabled}>
            <SelectTrigger id={field.id}>
              <SelectValue placeholder={field.placeholder ?? "Select…"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "radio":
      return (
        <div className="space-y-2">
          {labelEl}
          {desc}
          <RadioGroup
            value={(value as string) ?? ""}
            onValueChange={(v) => onChange(v)}
            className="gap-2"
            disabled={disabled}
          >
            {field.options?.map((o) => (
              <div key={o.value} className="flex items-center gap-2">
                <RadioGroupItem value={o.value} id={`${field.id}-${o.value}`} />
                <Label htmlFor={`${field.id}-${o.value}`} className="font-normal">
                  {o.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-start gap-2">
          <Checkbox
            id={field.id}
            checked={Boolean(value)}
            onCheckedChange={(c) => onChange(Boolean(c))}
            disabled={disabled}
          />
          <Label htmlFor={field.id} className="text-sm font-normal leading-snug">
            {field.label}
            {field.required && <span className="ml-1 text-muted-foreground">*</span>}
          </Label>
        </div>
      );
  }
}

export function DynamicForm() {
  const [typeId, setTypeId] = useState<string>("");
  const [values, setValues] = useState<Values>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Tracks network requests

  const activeType: RequestType | undefined = useMemo(
    () => formConfig.find((t) => t.id === typeId),
    [typeId],
  );

  const visibleFields = useMemo(() => {
    if (!activeType) return [];
    return activeType.fields.filter((f) => isVisible(f, values));
  }, [activeType, values]);

  function setField(id: string, v: FieldValue) {
    setValues((prev) => ({ ...prev, [id]: v }));
  }

  function handleTypeChange(newId: string) {
    setTypeId(newId);
    setValues({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeType || isSubmitting) return;

    // 1. Validation loop
    for (const f of visibleFields) {
      if (!f.required || f.type === "info") continue;
      const v = values[f.id];
      const empty =
        v === undefined ||
        v === "" ||
        (f.type === "checkbox" && v !== true);
      if (empty) {
        toast.error(`Please complete: ${f.label}`);
        return;
      }
    }

    // 2. Prepare Payload
    const payload = {
      type: activeType.id,
      values: Object.fromEntries(visibleFields.map((f) => [f.id, values[f.id]])),
    };

    setIsSubmitting(true);

    // 3. HTTP POST Submission
    try {
      const response = await fetch("https://auto.fortmont.me/webhook-test/for-schema", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server responded with code ${response.status}`);
      }

      toast.success("Ticket submitted successfully", {
        description: `Type: ${activeType.label}`,
      });
      
      // Optional: Clear form data after successful submission
      setValues({});
      setTypeId("");

    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit ticket", {
        description: error instanceof Error ? error.message : "An unknown network error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="request-type" className="text-sm font-medium">
          Request type<span className="ml-1 text-muted-foreground">*</span>
        </Label>
        <Select value={typeId} onValueChange={handleTypeChange} disabled={isSubmitting}>
          <SelectTrigger id="request-type">
            <SelectValue placeholder="Select a request type…" />
          </SelectTrigger>
          <SelectContent>
            {formConfig.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeType && (
          <p className="text-xs text-muted-foreground">{activeType.description}</p>
        )}
      </div>

      {activeType && (
        <>
          <div className="h-px w-full bg-border" />
          <div className="space-y-6">
            {visibleFields.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={values[field.id]}
                onChange={(v) => setField(field.id, v)}
                disabled={isSubmitting}
              />
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setValues({})}
            >
              Reset
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit ticket"
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}