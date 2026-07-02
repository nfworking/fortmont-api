"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsSection } from "@/components/account/Settingssection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeyRound, Mail, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react"

import { toast } from "sonner";

type TwoFactorStatus = {
  enabled: boolean;
  method: "email" | "authenticator";
  hasEmail: boolean;
  email: string | null;
  hasAuthenticator: boolean;
  pendingVerification: boolean;
  pendingAuthenticatorVerification: boolean;
};

export default function SecuritySection() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSetupMethod, setTwoFactorSetupMethod] = useState<"email" | "authenticator">("email");
  const [authenticatorQrCode, setAuthenticatorQrCode] = useState<string | null>(null);
  const [authenticatorManualKey, setAuthenticatorManualKey] = useState<string | null>(null);
  const [isTwoFactorBusy, setIsTwoFactorBusy] = useState(false);
  const [isTwoFactorVerificationPending, setIsTwoFactorVerificationPending] = useState(false);

  const fetchTwoFactorStatus = useCallback(async () => {
    const response = await fetch("/api/account/2fa", {
      credentials: "include",
    });

    if (!response.ok) return;

    const data = await response.json();
    setTwoFactorStatus(data);
    if (data.pendingVerification && !data.enabled) {
      setTwoFactorSetupMethod("email");
      setIsTwoFactorVerificationPending(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTwoFactorStatus();
  }, [fetchTwoFactorStatus]);

  const handleTwoFactorStart = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const method = submitter?.value === "authenticator" ? "authenticator" : "email";

    setTwoFactorSetupMethod(method);
    setIsTwoFactorBusy(true);

    try {
      const response = await fetch("/api/account/2fa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: twoFactorPassword,
          method,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to send verification code");
      }

      setIsTwoFactorVerificationPending(true);
      if (method === "authenticator") {
        setAuthenticatorQrCode(data.qrCodeDataUrl ?? null);
        setAuthenticatorManualKey(data.manualEntryKey ?? null);
        toast.success("Scan the QR code with your authenticator app.");
      } else {
        setAuthenticatorQrCode(null);
        setAuthenticatorManualKey(null);
        toast.success(`Verification code sent to ${data.maskedEmail ?? twoFactorStatus?.email ?? "your email"}.`);
      }
      await fetchTwoFactorStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send verification code");
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  const handleTwoFactorVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsTwoFactorBusy(true);

    try {
      const response = await fetch("/api/account/2fa", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          code: twoFactorCode,
          method: twoFactorSetupMethod,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to verify code");
      }

      setTwoFactorCode("");
      setTwoFactorPassword("");
      setAuthenticatorQrCode(null);
      setAuthenticatorManualKey(null);
      setIsTwoFactorVerificationPending(false);
      toast.success(
        twoFactorSetupMethod === "authenticator"
          ? "Authenticator app 2FA enabled."
          : "Email 2FA enabled.",
      );
      await fetchTwoFactorStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to verify code");
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  const handleTwoFactorDisable = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsTwoFactorBusy(true);

    try {
      const response = await fetch("/api/account/2fa", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: twoFactorPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to disable 2FA");
      }

      setTwoFactorCode("");
      setTwoFactorPassword("");
      setAuthenticatorQrCode(null);
      setAuthenticatorManualKey(null);
      setIsTwoFactorVerificationPending(false);
      toast.success("Two-factor authentication disabled.");
      await fetchTwoFactorStatus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable 2FA");
    } finally {
      setIsTwoFactorBusy(false);
    }
  };

  const handlePasswordChange = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  const currentPassword = String(
    formData.get("currentPassword") ?? ""
  );

  const newPassword = String(
    formData.get("newPassword") ?? ""
  );

  const confirmPassword = String(
    formData.get("confirmPassword") ?? ""
  );
  

  if (newPassword !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }



  const response = await fetch("/api/account/update-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      currentPassword,
      newPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to update password");
  }

  toast.success("Password updated successfully. Please log in again.");
  await signOut({ redirect: true, callbackUrl: "/login?callbackurl=%2Fplatform%2Faccount%3Fsection%3Dsecurity" });
  
};

  return (
    <div className="flex flex-col gap-8">
      {/* ── Change password ── */}
      <SettingsSection
        tag="Security"
        title="Change password"
        description="After updating your password you will be signed out of all other active sessions."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-4">
            <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-xs text-muted-foreground">
                Current password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••••••"
                className="bg-background/50"
                name="currentPassword"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs text-muted-foreground">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••••••"
                  className="bg-background/50"
                  name="newPassword"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••••••"
                  className="bg-background/50"
                  name="confirmPassword"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Minimum 12 characters.</p>
            <div className="flex justify-end pt-2">
              <Button size="sm">Update password</Button>
            </div>
            </form>
          </CardContent>
        </Card>
      </SettingsSection>

      <SettingsSection
        tag="Two-factor authentication"
        title="Two-factor authentication"
        description="Add an extra layer of security to your account by requiring a verification code when signing in."
      >
        <Card className="bg-background/35 backdrop-blur-md border-border/60">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                {twoFactorStatus?.enabled ? (
                  twoFactorStatus?.method === "authenticator" ? (
                    <Smartphone className="h-4 w-4 text-primary" />
                  ) : (
                    <Mail className="h-4 w-4 text-primary" />
                  )
                ) : (
                  <ShieldCheck className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm font-medium">
                    {twoFactorStatus?.enabled ? "2FA is enabled" : "2FA is disabled"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorStatus?.enabled ? (
                      twoFactorStatus?.method === "authenticator"
                        ? "Verification codes are generated by your authenticator app."
                        : `Verification codes are sent to your email address (${twoFactorStatus?.email}).`
                    ) : (
                      "Choose a two-factor method to secure your account."
                    )}
                  </p>
                </div>

                {!twoFactorStatus?.enabled && !isTwoFactorVerificationPending && (
                  <div className="space-y-4">
                    <Tabs
                      value={twoFactorSetupMethod}
                      onValueChange={(val) => setTwoFactorSetupMethod(val as "email" | "authenticator")}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Code
                        </TabsTrigger>
                        <TabsTrigger value="authenticator" className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Authenticator App
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="email" className="space-y-2 mt-4">
                        <p className="text-sm text-muted-foreground">
                          Verification codes will be sent to your registered email address:{" "}
                          <strong className="text-foreground">{twoFactorStatus?.email ?? "your email"}</strong>.
                        </p>
                      </TabsContent>
                      <TabsContent value="authenticator" className="space-y-2 mt-4">
                        <p className="text-sm text-muted-foreground">
                          Use a mobile authenticator app (like Google Authenticator, Microsoft Authenticator, or 1Password) to scan a QR code and generate secure codes.
                        </p>
                      </TabsContent>
                    </Tabs>

                    <form onSubmit={handleTwoFactorStart} className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="two-factor-password" className="text-xs text-muted-foreground">
                          Confirm password to continue
                        </Label>
                        <Input
                          id="two-factor-password"
                          type="password"
                          className="bg-background/50"
                          value={twoFactorPassword}
                          onChange={(event) => setTwoFactorPassword(event.target.value)}
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          disabled={isTwoFactorBusy || (twoFactorSetupMethod === "email" && twoFactorStatus?.hasEmail === false)}
                          value={twoFactorSetupMethod}
                          name="method"
                        >
                          {isTwoFactorBusy ? "Initiating..." : "Start setup"}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {!twoFactorStatus?.enabled && isTwoFactorVerificationPending && (
                  <form onSubmit={handleTwoFactorVerify} className="space-y-4">
                    {twoFactorSetupMethod === "authenticator" ? (
                      <div className="space-y-4">
                        <p className="text-sm font-medium">Set up Authenticator App</p>
                        <p className="text-sm text-muted-foreground">
                          1. Scan the QR code below using your authenticator app:
                        </p>
                        {authenticatorQrCode ? (
                          <div className="flex justify-center p-3 bg-white rounded-lg border border-border/80 w-fit mx-auto">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={authenticatorQrCode}
                              alt="Authenticator QR Code"
                              className="w-[180px] h-[180px]"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-[180px] h-[180px] border border-dashed rounded-lg mx-auto">
                            <span className="text-xs text-muted-foreground animate-pulse">Generating QR Code...</span>
                          </div>
                        )}

                        {authenticatorManualKey && (
                          <div className="space-y-1.5 text-center">
                            <p className="text-xs text-muted-foreground">
                              Can&apos;t scan? Enter this key manually:
                            </p>
                            <div className="inline-flex items-center gap-2 bg-muted border border-border px-3 py-1.5 rounded-md font-mono text-sm font-semibold select-all text-foreground tracking-wider">
                              {authenticatorManualKey}
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label htmlFor="two-factor-code" className="text-xs text-muted-foreground">
                            2. Enter the 6-digit code from your app to verify
                          </Label>
                          <Input
                            id="two-factor-code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            className="bg-background/50 text-center font-mono text-lg tracking-[0.5em] pl-[0.5em]"
                            value={twoFactorCode}
                            onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="000000"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm font-medium">Verify Email Code</p>
                        <p className="text-sm text-muted-foreground">
                          We sent a verification code to your email. Enter the 6-digit code to complete setup.
                        </p>
                        <div className="space-y-1.5">
                          <Label htmlFor="two-factor-code" className="text-xs text-muted-foreground">
                            Verification code
                          </Label>
                          <Input
                            id="two-factor-code"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            className="bg-background/50 text-center font-mono text-lg tracking-[0.5em] pl-[0.5em]"
                            value={twoFactorCode}
                            placeholder="000000"
                            onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isTwoFactorBusy}
                        onClick={() => {
                          setIsTwoFactorVerificationPending(false);
                          setAuthenticatorQrCode(null);
                          setAuthenticatorManualKey(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" disabled={isTwoFactorBusy}>
                        {isTwoFactorBusy ? "Verifying..." : "Enable 2FA"}
                      </Button>
                    </div>
                  </form>
                )}

                {twoFactorStatus?.enabled && (
                  <form onSubmit={handleTwoFactorDisable} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="two-factor-disable-password" className="text-xs text-muted-foreground">
                        Current password
                      </Label>
                      <Input
                        id="two-factor-disable-password"
                        type="password"
                        className="bg-background/50"
                        value={twoFactorPassword}
                        onChange={(event) => setTwoFactorPassword(event.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" disabled={isTwoFactorBusy}>
                        {isTwoFactorBusy ? "Disabling..." : "Disable 2FA"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* ── Danger zone ── */}
      <SettingsSection
        tag="Danger zone"
        title="Deactivate account"
        description="Deactivating your account suspends access immediately. An administrator can reverse this."
      >
        <Card className="bg-background/35 backdrop-blur-md border-destructive/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-lg bg-destructive/10 p-2">
                <ShieldAlert className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted-foreground">
                  This will immediately revoke your access to Fortmont. All active
                  sessions will be terminated. Your data is preserved and the account
                  can be reactivated by an administrator.
                </p>
                <Button variant="destructive" size="sm">
                  Deactivate my account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </SettingsSection>
    </div>
  );
}
