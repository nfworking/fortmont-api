"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users, Shield, Monitor, Building2, Server, HardDrive,
  Key, AlertCircle, CheckCircle, RefreshCw, Database,
  UserCheck, ShieldAlert, Activity, Layers, TrendingUp,
  TrendingDown, Minus, Zap, FileText, CloudOff, Globe, Lock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────────────────────

interface Formatter {
  date: (v: string | number | Date | null | undefined) => string;
  datetime: (v: string | number | Date | null | undefined) => string;
  bool: (v: boolean | null | undefined) => string;
}

interface StatusPillProps {
  value: string | boolean | number | null | undefined;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
}

interface SectionHeaderProps {
  title: string;
  count?: number;
  lastFetched: Date | null;
  onRefresh: () => void;
  loading: boolean;
}

interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt: Formatter = {
  date: (v) => v ? new Date(v).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—",
  datetime: (v) => v ? new Date(v).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—",
  bool: (v) => v === true ? "Yes" : v === false ? "No" : "—",
};

// ── Status badge ──────────────────────────────────────────────────────────────

const StatusPill: React.FC<StatusPillProps> = ({ value }) => {
  const norm = String(value ?? "").toLowerCase();
  const styles: Record<string, string> = {
    enabled:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    active:       "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    running:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    succeeded:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    available:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    compliant:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    managed:      "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    yes:          "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    disabled:     "bg-black text-zinc-400 border-zinc-500/20",
    stopped:      "bg-black text-zinc-400 border-zinc-500/20",
    deallocated:  "bg-black text-zinc-400 border-zinc-500/20",
    unmanaged:    "bg-black text-zinc-400 border-zinc-500/20",
    no:           "bg-black text-zinc-400 border-zinc-500/20",
    failed:       "bg-red-500/15 text-red-400 border-red-500/20",
    error:        "bg-red-500/15 text-red-400 border-red-500/20",
    "non-compliant": "bg-red-500/15 text-red-400 border-red-500/20",
    pending:      "bg-amber-500/15 text-amber-400 border-amber-500/20",
    updating:     "bg-amber-500/15 text-amber-400 border-amber-500/20",
    "in process": "bg-amber-500/15 text-amber-400 border-amber-500/20",
    "report only":"bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  const cls = styles[norm] ?? "bg-black text-zinc-400 border-zinc-500/20";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {String(value ?? "—")}
    </span>
  );
};

// ── Metric card (top row) ─────────────────────────────────────────────────────

const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub, trend, trendLabel, icon: Icon, iconColor }) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-500";
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium">{label}</span>
        {trendLabel && (
          <span className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            {trendLabel}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
        {Icon && <Icon size={20} className={iconColor ?? "text-zinc-600"} />}
      </div>
      {sub && <p className="text-xs text-zinc-500 leading-tight">{sub}</p>}
    </div>
  );
};

// ── Error state ───────────────────────────────────────────────────────────────

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm my-4">
    <AlertCircle size={15} />
    {message}
  </div>
);

// ── Skeleton rows ─────────────────────────────────────────────────────────────

const LoadingRows: React.FC<{ cols?: number; rows?: number }> = ({ cols = 4, rows = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <TableRow key={i} className="border-zinc-800">
        {Array.from({ length: cols }).map((_, j) => (
          <TableCell key={j}><Skeleton className="h-4 w-full bg-zinc-800" /></TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

const LoadingMetrics: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <Skeleton className="h-4 w-24 mb-4 bg-zinc-800" />
        <Skeleton className="h-8 w-16 bg-zinc-800" />
      </div>
    ))}
  </div>
);

// ── API hook ──────────────────────────────────────────────────────────────────

function useApiData<T>(endpoint: string, params: Record<string, string | number> = {}): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const stringParams: Record<string, string> = Object.fromEntries(
    Object.entries(params).map(([key, val]) => [key, String(val)])
  );
  const query = new URLSearchParams(stringParams).toString();
  const url = `${endpoint}${query ? `?${query}` : ""}`;

  const doFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
      setData(json?.value ?? json);
      setLastFetched(new Date());
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => { doFetch(); }, [doFetch]);
  return { data, loading, error, lastFetched, refresh: doFetch };
}

// ── Section header ────────────────────────────────────────────────────────────

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, count, lastFetched, onRefresh, loading }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {count !== undefined && (
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
    <div className="flex items-center gap-3">
      {lastFetched && (
        <span className="text-[11px] text-zinc-600 font-mono hidden sm:block">
          {fmt.datetime(lastFetched)}
        </span>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-white hover:bg-zinc-800"
              onClick={onRefresh} disabled={loading}
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
);

// ── Shared table wrapper ──────────────────────────────────────────────────────

const DataTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-zinc-800 overflow-hidden">
    <Table>{children}</Table>
  </div>
);

const Th: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TableHead className="text-xs text-zinc-500 font-medium bg-zinc-900/50 border-b border-zinc-800 h-9">
    {children}
  </TableHead>
);

const Td: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <TableCell className={`text-sm text-zinc-300 py-3 border-b border-zinc-800/60 ${className}`}>
    {children}
  </TableCell>
);

const Tr: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TableRow className="border-zinc-800 hover:bg-zinc-800/40 transition-colors">
    {children}
  </TableRow>
);

// ════════════════════════════════════════════════════════════════════════════
// ENTRA SECTIONS
// ════════════════════════════════════════════════════════════════════════════

interface EntraUser {
  id?: string;
  displayName?: string;
  userPrincipalName?: string;
  jobTitle?: string;
  userType?: string;
  accountEnabled?: boolean;
  createdDateTime?: string;
  strongAuthenticationMethods?: unknown[];
  isMfaRegistered?: boolean;
}

function EntraUsers() {
  const { data, loading, error, lastFetched, refresh } = useApiData<EntraUser[]>("/api/entra", { resource: "users" });
  const users = Array.isArray(data) ? data : [];
  const enabled = users.filter(u => u.accountEnabled).length;
  const guests = users.filter(u => u.userType === "Guest").length;
  const mfa = users.filter(u => (u.strongAuthenticationMethods && u.strongAuthenticationMethods.length > 0) || u.isMfaRegistered).length;

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total Users" value={users.length} icon={Users} iconColor="text-blue-500/50"
            sub="All directory accounts" />
          <MetricCard label="Enabled" value={enabled} icon={CheckCircle} iconColor="text-emerald-500/50"
            trend="up" trendLabel={`${Math.round(enabled / Math.max(users.length, 1) * 100)}%`}
            sub="Active accounts" />
          <MetricCard label="Guest Users" value={guests} icon={Globe} iconColor="text-amber-500/50"
            sub="External identities" />
          <MetricCard label="MFA Registered" value={mfa} icon={Shield} iconColor="text-violet-500/50"
            trend={mfa / Math.max(users.length, 1) > 0.8 ? "up" : "down"}
            trendLabel={`${Math.round(mfa / Math.max(users.length, 1) * 100)}%`}
            sub="Strong auth enrolled" />
        </div>
      )}
      <SectionHeader title="All Users" count={users.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Display Name</Th><Th>User Principal Name</Th><Th>Job Title</Th>
            <Th>Type</Th><Th>Status</Th><Th>Created</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={6} /> : users.slice(0, 50).map((u, i) => (
            <Tr key={u.id ?? i}>
              <Td><span className="font-medium text-white">{u.displayName}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-500 max-w-[200px] block truncate">{u.userPrincipalName}</span></Td>
              <Td className="text-zinc-400">{u.jobTitle ?? "—"}</Td>
              <Td><span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{u.userType ?? "Member"}</span></Td>
              <Td><StatusPill value={u.accountEnabled ? "Enabled" : "Disabled"} /></Td>
              <Td className="text-zinc-500 text-xs">{fmt.date(u.createdDateTime)}</Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
      {!loading && users.length > 50 && (
        <p className="text-xs text-zinc-600 text-center pt-3">Showing 50 of {users.length} users</p>
      )}
    </div>
  );
}

interface EntraGroup {
  id?: string;
  displayName?: string;
  description?: string;
  securityEnabled?: boolean;
  groupTypes?: string[];
  mailEnabled?: boolean;
  createdDateTime?: string;
}

function EntraGroups() {
  const { data, loading, error, lastFetched, refresh } = useApiData<EntraGroup[]>("/api/entra", { resource: "groups" });
  const groups = Array.isArray(data) ? data : [];
  const security = groups.filter(g => g.securityEnabled).length;
  const m365 = groups.filter(g => g.groupTypes?.includes("Unified")).length;
  const dynamic = groups.filter(g => g.groupTypes?.includes("DynamicMembership")).length;

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total Groups" value={groups.length} icon={Layers} iconColor="text-blue-500/50" sub="All groups" />
          <MetricCard label="Security" value={security} icon={Shield} iconColor="text-emerald-500/50" sub="Security-enabled" />
          <MetricCard label="Microsoft 365" value={m365} icon={Users} iconColor="text-violet-500/50" sub="Unified groups" />
          <MetricCard label="Dynamic" value={dynamic} icon={Activity} iconColor="text-amber-500/50" sub="Rule-based membership" />
        </div>
      )}
      <SectionHeader title="All Groups" count={groups.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Name</Th><Th>Description</Th><Th>Type</Th><Th>Mail Enabled</Th><Th>Created</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={5} /> : groups.slice(0, 50).map((g, i) => (
            <Tr key={g.id ?? i}>
              <Td><span className="font-medium text-white">{g.displayName}</span></Td>
              <Td><span className="text-zinc-500 text-xs max-w-[220px] block truncate">{g.description ?? "—"}</span></Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  {g.securityEnabled && <StatusPill value="Security" />}
                  {g.groupTypes?.includes("Unified") && <span className="text-xs text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">M365</span>}
                  {g.groupTypes?.includes("DynamicMembership") && <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Dynamic</span>}
                </div>
              </Td>
              <Td><StatusPill value={g.mailEnabled ? "Yes" : "No"} /></Td>
              <Td className="text-zinc-500 text-xs">{fmt.date(g.createdDateTime)}</Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface EntraDevice {
  id?: string;
  displayName?: string;
  operatingSystem?: string;
  operatingSystemVersion?: string;
  trustType?: string;
  isCompliant?: boolean;
  isManaged?: boolean;
  approximateLastSignInDateTime?: string;
}

function EntraDevices() {
  const { data, loading, error, lastFetched, refresh } = useApiData<EntraDevice[]>("/api/entra", { resource: "devices" });
  const devices = Array.isArray(data) ? data : [];
  const compliant = devices.filter(d => d.isCompliant).length;
  const managed = devices.filter(d => d.isManaged).length;
  const nonCompliant = devices.length - compliant;

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total Devices" value={devices.length} icon={Monitor} iconColor="text-blue-500/50" sub="Registered devices" />
          <MetricCard label="Compliant" value={compliant} icon={CheckCircle} iconColor="text-emerald-500/50"
            trend="up" trendLabel={`${Math.round(compliant / Math.max(devices.length, 1) * 100)}%`} sub="Meeting policy" />
          <MetricCard label="Non-Compliant" value={nonCompliant} icon={AlertCircle} iconColor="text-red-500/50"
            trend={nonCompliant > 0 ? "down" : "up"} trendLabel={`${Math.round(nonCompliant / Math.max(devices.length, 1) * 100)}%`} sub="Policy violations" />
          <MetricCard label="Managed" value={managed} icon={Shield} iconColor="text-violet-500/50" sub="Intune managed" />
        </div>
      )}
      <SectionHeader title="All Devices" count={devices.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Device Name</Th><Th>OS</Th><Th>Version</Th><Th>Join Type</Th><Th>Compliant</Th><Th>Managed</Th><Th>Last Sign-In</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={7} /> : devices.slice(0, 50).map((d, i) => (
            <Tr key={d.id ?? i}>
              <Td><span className="font-mono text-xs text-white">{d.displayName}</span></Td>
              <Td className="text-zinc-400">{d.operatingSystem ?? "—"}</Td>
              <Td><span className="font-mono text-xs text-zinc-500">{d.operatingSystemVersion ?? "—"}</span></Td>
              <Td><span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{d.trustType ?? "—"}</span></Td>
              <Td><StatusPill value={d.isCompliant ? "Compliant" : "Non-Compliant"} /></Td>
              <Td><StatusPill value={d.isManaged ? "Managed" : "Unmanaged"} /></Td>
              <Td className="text-zinc-500 text-xs">{fmt.date(d.approximateLastSignInDateTime)}</Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface Credential {
  endDateTime: string;
}

interface EntraApp {
  id?: string;
  displayName?: string;
  appId?: string;
  signInAudience?: string;
  passwordCredentials?: Credential[];
  keyCredentials?: Credential[];
  createdDateTime?: string;
}

function EntraApps() {
  const { data, loading, error, lastFetched, refresh } = useApiData<EntraApp[]>("/api/entra", { resource: "applications" });
  const apps = Array.isArray(data) ? data : [];
  const withCreds = apps.filter(a => (a.passwordCredentials?.length ?? 0) + (a.keyCredentials?.length ?? 0) > 0).length;
  const expiringSoon = apps.filter(a => {
    const now = Date.now();
    const soon = now + 30 * 24 * 60 * 60 * 1000;
    return [...(a.passwordCredentials ?? []), ...(a.keyCredentials ?? [])].some(c => {
      const exp = new Date(c.endDateTime).getTime();
      return exp > now && exp < soon;
    });
  }).length;
  const multiTenant = apps.filter(a => a.signInAudience !== "AzureADMyOrg").length;

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total Apps" value={apps.length} icon={Key} iconColor="text-blue-500/50" sub="App registrations" />
          <MetricCard label="With Credentials" value={withCreds} icon={Lock} iconColor="text-zinc-500/50" sub="Secrets or certificates" />
          <MetricCard label="Expiring Soon" value={expiringSoon} icon={AlertCircle} iconColor="text-red-500/50"
            trend={expiringSoon > 0 ? "down" : "up"} trendLabel={expiringSoon > 0 ? "Action needed" : "All clear"}
            sub="Within 30 days" />
          <MetricCard label="Multi-Tenant" value={multiTenant} icon={Globe} iconColor="text-violet-500/50" sub="External audience" />
        </div>
      )}
      <SectionHeader title="App Registrations" count={apps.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Name</Th><Th>App ID</Th><Th>Audience</Th><Th>Secrets</Th><Th>Certs</Th><Th>Created</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={6} /> : apps.slice(0, 50).map((a, i) => (
            <Tr key={a.id ?? i}>
              <Td><span className="font-medium text-white">{a.displayName}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-500">{a.appId}</span></Td>
              <Td><span className="text-xs text-zinc-400">{a.signInAudience?.replace("AzureAD", "") ?? "—"}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-300">{a.passwordCredentials?.length ?? 0}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-300">{a.keyCredentials?.length ?? 0}</span></Td>
              <Td className="text-zinc-500 text-xs">{fmt.date(a.createdDateTime)}</Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface SignInLog {
  id?: string;
  userDisplayName?: string;
  userPrincipalName?: string;
  appDisplayName?: string;
  ipAddress?: string;
  location?: {
    city?: string;
    countryOrRegion?: string;
  };
  status?: {
    errorCode: number;
  };
  authenticationRequirement?: string;
  createdDateTime?: string;
}

function EntraSignInLogs() {
  const { data, loading, error, lastFetched, refresh } = useApiData<SignInLog[]>("/api/entra", { resource: "auditLogs/signIns", top: 50 });
  const logs = Array.isArray(data) ? data : [];
  const failures = logs.filter(l => l.status?.errorCode !== 0).length;
  const mfaCount = logs.filter(l => l.authenticationRequirement === "multiFactorAuthentication").length;
  const unique = new Set(logs.map(l => l.userPrincipalName)).size;

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Recent Sign-Ins" value={logs.length} icon={Activity} iconColor="text-blue-500/50" sub="Last 24 hours" />
          <MetricCard label="Failures" value={failures} icon={AlertCircle} iconColor="text-red-500/50"
            trend={failures > 0 ? "down" : "up"} trendLabel={failures > 0 ? `${failures} failed` : "All success"} sub="Authentication errors" />
          <MetricCard label="MFA Challenged" value={mfaCount} icon={Shield} iconColor="text-violet-500/50" sub="Step-up auth required" />
          <MetricCard label="Unique Users" value={unique} icon={Users} iconColor="text-emerald-500/50" sub="Distinct accounts" />
        </div>
      )}
      <SectionHeader title="Sign-In Log" count={logs.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>User</Th><Th>Application</Th><Th>IP Address</Th><Th>Location</Th><Th>Status</Th><Th>MFA</Th><Th>Date</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={7} /> : logs.slice(0, 50).map((l, i) => (
            <Tr key={l.id ?? i}>
              <Td><span className="text-white text-xs font-medium max-w-[150px] block truncate">{l.userDisplayName ?? l.userPrincipalName ?? "—"}</span></Td>
              <Td><span className="text-zinc-400 text-xs max-w-[120px] block truncate">{l.appDisplayName ?? "—"}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-500">{l.ipAddress ?? "—"}</span></Td>
              <Td><span className="text-xs text-zinc-400">{[l.location?.city, l.location?.countryOrRegion].filter(Boolean).join(", ") || "—"}</span></Td>
              <Td><StatusPill value={l.status?.errorCode === 0 ? "Enabled" : "Failed"} /></Td>
              <Td><span className="text-xs text-zinc-400">{l.authenticationRequirement === "multiFactorAuthentication" ? "Required" : "Single"}</span></Td>
              <Td className="text-zinc-500 text-xs">{fmt.datetime(l.createdDateTime)}</Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface ConditionalAccessPolicy {
  id?: string;
  displayName?: string;
  state?: string;
  conditions?: {
    users?: {
      includeUsers?: string[];
      includeGroups?: string[];
    };
    applications?: {
      includeApplications?: string[];
    };
  };
  grantControls?: {
    builtInControls?: string[];
  };
  modifiedDateTime?: string;
}

function EntraConditionalAccess() {
  const { data, loading, error, lastFetched, refresh } = useApiData<ConditionalAccessPolicy[]>("/api/entra", { resource: "identity/conditionalAccess/policies" });
  const policies = Array.isArray(data) ? data : [];
  const enforced = policies.filter(p => p.state === "enabled").length;
  const reportOnly = policies.filter(p => p.state === "enabledForReportingButNotEnforced").length;
  const disabled = policies.filter(p => p.state === "disabled").length;

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Total Policies" value={policies.length} icon={ShieldAlert} iconColor="text-blue-500/50" sub="All CA policies" />
          <MetricCard label="Enforced" value={enforced} icon={CheckCircle} iconColor="text-emerald-500/50"
            trend="up" trendLabel={`${Math.round(enforced / Math.max(policies.length, 1) * 100)}%`} sub="Active & blocking" />
          <MetricCard label="Report Only" value={reportOnly} icon={FileText} iconColor="text-amber-500/50" sub="Audit mode" />
          <MetricCard label="Disabled" value={disabled} icon={CloudOff} iconColor="text-zinc-500/50" sub="Inactive policies" />
        </div>
      )}
      <SectionHeader title="Conditional Access Policies" count={policies.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Policy Name</Th><Th>State</Th><Th>Users</Th><Th>Applications</Th><Th>Grant Controls</Th><Th>Modified</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={6} /> : policies.map((p, i) => (
            <Tr key={p.id ?? i}>
              <Td><span className="font-medium text-white">{p.displayName}</span></Td>
              <Td>
                <StatusPill value={
                  p.state === "enabled" ? "Enabled" :
                  p.state === "disabled" ? "Disabled" : "Report Only"
                } />
              </Td>
              <Td><span className="text-xs text-zinc-400">{p.conditions?.users?.includeUsers?.[0] === "All" ? "All Users" : `${(p.conditions?.users?.includeUsers?.length ?? 0) + (p.conditions?.users?.includeGroups?.length ?? 0)} selected`}</span></Td>
              <Td><span className="text-xs text-zinc-400">{p.conditions?.applications?.includeApplications?.[0] === "All" ? "All Apps" : `${p.conditions?.applications?.includeApplications?.length ?? 0} apps`}</span></Td>
              <Td><span className="text-xs text-zinc-400">{p.grantControls?.builtInControls?.join(", ") ?? "—"}</span></Td>
              <Td className="text-zinc-500 text-xs">{fmt.date(p.modifiedDateTime)}</Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// AZURE SECTIONS
// ════════════════════════════════════════════════════════════════════════════

interface AzureSubscription {
  subscriptionId?: string;
  displayName?: string;
  tenantId?: string;
  state?: string;
  subscriptionPolicies?: {
    quotaId?: string;
    spendingLimit?: string;
  };
}

function AzureSubscriptions() {
  const { data, loading, error, lastFetched, refresh } = useApiData<AzureSubscription[]>("/api/azure", { resource: "subscriptions" });
  const subs = Array.isArray(data) ? data : [];
  const enabled = subs.filter(s => s.state === "Enabled").length;

  return (
    <div>
      {loading ? <LoadingMetrics count={2} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Total Subscriptions" value={subs.length} icon={Building2} iconColor="text-blue-500/50" sub="Visible to service principal" />
          <MetricCard label="Enabled" value={enabled} icon={CheckCircle} iconColor="text-emerald-500/50"
            trend="up" trendLabel={`${Math.round(enabled / Math.max(subs.length, 1) * 100)}%`} sub="Active subscriptions" />
        </div>
      )}
      <SectionHeader title="Subscriptions" count={subs.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Name</Th><Th>Subscription ID</Th><Th>Tenant ID</Th><Th>Offer</Th><Th>Spending Limit</Th><Th>State</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={6} /> : subs.map((s, i) => (
            <Tr key={s.subscriptionId ?? i}>
              <Td><span className="font-medium text-white">{s.displayName}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-500">{s.subscriptionId}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-500">{s.tenantId}</span></Td>
              <Td><span className="text-xs text-zinc-400">{s.subscriptionPolicies?.quotaId ?? "—"}</span></Td>
              <Td><span className="text-xs text-zinc-400">{s.subscriptionPolicies?.spendingLimit ?? "—"}</span></Td>
              <Td><StatusPill value={s.state} /></Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface AzureResourceGroup {
  id?: string;
  name?: string;
  location?: string;
  properties?: {
    provisioningState?: string;
  };
  tags?: Record<string, string>;
}

function AzureResourceGroups() {
  const { data, loading, error, lastFetched, refresh } = useApiData<AzureResourceGroup[]>("/api/azure", { resource: "resourceGroups" });
  const groups = Array.isArray(data) ? data : [];
  const regions = [...new Set(groups.map(g => g.location).filter((loc): loc is string => !!loc))];

  return (
    <div>
      {loading ? <LoadingMetrics count={2} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Resource Groups" value={groups.length} icon={Database} iconColor="text-blue-500/50" sub="All resource groups" />
          <MetricCard label="Regions" value={regions.length} icon={Globe} iconColor="text-violet-500/50" sub={regions.slice(0, 2).join(", ") + (regions.length > 2 ? "…" : "")} />
        </div>
      )}
      <SectionHeader title="Resource Groups" count={groups.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Name</Th><Th>Location</Th><Th>Provisioning State</Th><Th>Tags</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={4} /> : groups.map((g, i) => (
            <Tr key={g.id ?? i}>
              <Td><span className="font-mono text-xs text-white">{g.name}</span></Td>
              <Td><span className="text-xs text-zinc-400">{g.location}</span></Td>
              <Td><StatusPill value={g.properties?.provisioningState} /></Td>
              <Td>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(g.tags ?? {}).slice(0, 3).map(([k, v]) => (
                    <span key={k} className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">{k}={v}</span>
                  ))}
                  {Object.keys(g.tags ?? {}).length === 0 && <span className="text-xs text-zinc-600">—</span>}
                </div>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface AzureVM {
  id?: string;
  name?: string;
  location?: string;
  powerState?: string;
  size?: string;
  osType?: string;
  properties?: {
    hardwareProfile?: {
      vmSize?: string;
    };
    storageProfile?: {
      osDisk?: {
        osType?: string;
      };
    };
    instanceView?: {
      statuses?: Array<{
        code?: string;
        displayStatus?: string;
      }>;
    };
  };
}

function AzureVMs() {
  const { data, loading, error, lastFetched, refresh } = useApiData<AzureVM[]>("/api/azure", { resource: "virtualMachines" });
  const vms = Array.isArray(data) ? data : [];
  const running = vms.filter(v => {
    const state = v.powerState ?? v.properties?.instanceView?.statuses?.find(s => s.code?.startsWith("PowerState/"))?.displayStatus ?? "";
    return state.toLowerCase().includes("running");
  }).length;
  const regions = [...new Set(vms.map(v => v.location).filter((loc): loc is string => !!loc))];

  return (
    <div>
      {loading ? <LoadingMetrics count={4} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Virtual Machines" value={vms.length} icon={Server} iconColor="text-blue-500/50" sub="All VMs" />
          <MetricCard label="Running" value={running} icon={Zap} iconColor="text-emerald-500/50"
            trend="up" trendLabel={`${Math.round(running / Math.max(vms.length, 1) * 100)}%`} sub="Active instances" />
          <MetricCard label="Stopped" value={vms.length - running} icon={CloudOff} iconColor="text-zinc-500/50" sub="Deallocated / stopped" />
          <MetricCard label="Regions" value={regions.length} icon={Globe} iconColor="text-violet-500/50" sub={regions.slice(0, 2).join(", ")} />
        </div>
      )}
      <SectionHeader title="Virtual Machines" count={vms.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Name</Th><Th>Resource Group</Th><Th>Location</Th><Th>Size</Th><Th>OS</Th><Th>Power State</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={6} /> : vms.map((v, i) => {
            const rg = v.id?.split("/resourceGroups/")[1]?.split("/")[0] ?? "—";
            const state = v.powerState ?? v.properties?.instanceView?.statuses?.find(s => s.code?.startsWith("PowerState/"))?.displayStatus ?? "—";
            return (
              <Tr key={v.id ?? i}>
                <Td><span className="font-mono text-xs text-white">{v.name}</span></Td>
                <Td><span className="text-xs text-zinc-500">{rg}</span></Td>
                <Td><span className="text-xs text-zinc-400">{v.location}</span></Td>
                <Td><span className="font-mono text-xs text-zinc-400">{v.properties?.hardwareProfile?.vmSize ?? v.size ?? "—"}</span></Td>
                <Td><span className="text-xs text-zinc-400">{v.properties?.storageProfile?.osDisk?.osType ?? v.osType ?? "—"}</span></Td>
                <Td><StatusPill value={state} /></Td>
              </Tr>
            );
          })}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface AzureStorageAccount {
  id?: string;
  name?: string;
  location?: string;
  kind?: string;
  sku?: {
    name?: string;
  };
  properties?: {
    supportsHttpsTrafficOnly?: boolean;
    minimumTlsVersion?: string;
    provisioningState?: string;
  };
}

function AzureStorage() {
  const { data, loading, error, lastFetched, refresh } = useApiData<AzureStorageAccount[]>("/api/azure", { resource: "storageAccounts" });
  const accounts = Array.isArray(data) ? data : [];
  const httpsOnly = accounts.filter(a => a.properties?.supportsHttpsTrafficOnly).length;

  return (
    <div>
      {loading ? <LoadingMetrics count={2} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Storage Accounts" value={accounts.length} icon={HardDrive} iconColor="text-blue-500/50" sub="All storage accounts" />
          <MetricCard label="HTTPS Only" value={httpsOnly} icon={Lock} iconColor="text-emerald-500/50"
            trend={httpsOnly === accounts.length ? "up" : "down"}
            trendLabel={httpsOnly === accounts.length ? "All secure" : `${accounts.length - httpsOnly} at risk`}
            sub="Enforced HTTPS" />
        </div>
      )}
      <SectionHeader title="Storage Accounts" count={accounts.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Name</Th><Th>Location</Th><Th>SKU</Th><Th>Kind</Th><Th>Min TLS</Th><Th>HTTPS Only</Th><Th>State</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={7} /> : accounts.map((a, i) => (
            <Tr key={a.id ?? i}>
              <Td><span className="font-mono text-xs text-white">{a.name}</span></Td>
              <Td><span className="text-xs text-zinc-400">{a.location}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-400">{a.sku?.name ?? "—"}</span></Td>
              <Td><span className="text-xs text-zinc-400">{a.kind}</span></Td>
              <Td><span className="font-mono text-xs text-zinc-400">{a.properties?.minimumTlsVersion?.replace("TLS", "") ?? "—"}</span></Td>
              <Td><StatusPill value={a.properties?.supportsHttpsTrafficOnly ? "Yes" : "No"} /></Td>
              <Td><StatusPill value={a.properties?.provisioningState} /></Td>
            </Tr>
          ))}
        </TableBody>
      </DataTable>
    </div>
  );
}

interface AzureRoleAssignmentProps {
  principalId?: string;
  principalType?: string;
  roleDefinitionId?: string;
  scope?: string;
}

interface AzureRoleAssignment {
  id?: string;
  scope?: string;
  properties?: AzureRoleAssignmentProps;
  principalId?: string;
  principalType?: string;
  roleDefinitionId?: string;
}

function AzureRoles() {
  const { data, loading, error, lastFetched, refresh } = useApiData<AzureRoleAssignment[]>("/api/azure", { resource: "roleAssignments" });
  const roles = Array.isArray(data) ? data : [];
  const uniqueRoles = new Set(roles.map(r => ((r.properties ?? r) as AzureRoleAssignmentProps).roleDefinitionId?.split("/").pop())).size;

  return (
    <div>
      {loading ? <LoadingMetrics count={2} /> : error ? <ErrorState message={error} /> : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MetricCard label="Role Assignments" value={roles.length} icon={UserCheck} iconColor="text-blue-500/50" sub="Subscription scope" />
          <MetricCard label="Unique Roles" value={uniqueRoles} icon={Layers} iconColor="text-violet-500/50" sub="Distinct role definitions" />
        </div>
      )}
      <SectionHeader title="Role Assignments" count={roles.length} lastFetched={lastFetched} onRefresh={refresh} loading={loading} />
      <DataTable>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <Th>Principal ID</Th><Th>Principal Type</Th><Th>Role</Th><Th>Scope</Th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? <LoadingRows cols={4} /> : roles.slice(0, 50).map((r, i) => {
            const props = (r.properties ?? r) as AzureRoleAssignmentProps;
            return (
              <Tr key={r.id ?? i}>
                <Td><span className="font-mono text-xs text-zinc-500 max-w-[180px] block truncate">{props.principalId}</span></Td>
                <Td><span className="text-xs text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">{props.principalType ?? "—"}</span></Td>
                <Td><span className="font-mono text-xs text-zinc-400 max-w-[200px] block truncate">{props.roleDefinitionId?.split("/").pop() ?? "—"}</span></Td>
                <Td><span className="text-xs text-zinc-500 max-w-[200px] block truncate">{props.scope ?? r.scope ?? "—"}</span></Td>
              </Tr>
            );
          })}
        </TableBody>
      </DataTable>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT LAYOUT
// ════════════════════════════════════════════════════════════════════════════

interface TabConfig {
  value: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const ENTRA_TABS: TabConfig[] = [
  { value: "users",   label: "Users",            icon: Users },
  { value: "groups",  label: "Groups",           icon: Layers },
  { value: "devices", label: "Devices",          icon: Monitor },
  { value: "apps",    label: "App Registrations",icon: Key },
  { value: "signin",  label: "Sign-In Logs",     icon: Activity },
  { value: "ca",      label: "Cond. Access",     icon: ShieldAlert },
];

const AZURE_TABS: TabConfig[] = [
  { value: "subscriptions", label: "Subscriptions",    icon: Building2 },
  { value: "rgs",           label: "Resource Groups",  icon: Database },
  { value: "vms",           label: "Virtual Machines", icon: Server },
  { value: "storage",       label: "Storage",          icon: HardDrive },
  { value: "roles",         label: "Role Assignments", icon: UserCheck },
];

export default function EntraAzureDashboard() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-100">

        {/* ── Top nav ──────────────────────────────────────────────────── */}
        <div className="border-b border-zinc-800 bg-zinc-950 px-6 py-3 sticky top-0 z-10">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-blue-400" />
              <span className="font-semibold text-sm text-white tracking-tight">Entra &amp; Azure</span>
              <span className="text-zinc-600 text-xs hidden sm:block">/ Cloud Administration Console</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-500">Live</span>
            </div>
          </div>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <Tabs defaultValue="entra" className="space-y-6">

            {/* Cloud selector */}
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-auto">
              <TabsTrigger value="entra"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 gap-2 text-sm px-4 py-1.5">
                <Shield size={14} /> Entra ID
              </TabsTrigger>
              <TabsTrigger value="azure"
                className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white text-zinc-400 gap-2 text-sm px-4 py-1.5">
                <Building2 size={14} /> Azure
              </TabsTrigger>
            </TabsList>

            {/* ── ENTRA ── */}
            <TabsContent value="entra" className="mt-0">
              <Tabs defaultValue="users">
                <TabsList className="bg-transparent border-b border-zinc-800 rounded-none w-full justify-start p-0 h-auto mb-6 gap-0">
                  {ENTRA_TABS.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger key={value} value={value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-zinc-500 gap-1.5 text-xs px-4 py-2.5 h-auto bg-transparent hover:text-zinc-300 transition-colors">
                      <Icon size={13} />{label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="users"><EntraUsers /></TabsContent>
                <TabsContent value="groups"><EntraGroups /></TabsContent>
                <TabsContent value="devices"><EntraDevices /></TabsContent>
                <TabsContent value="apps"><EntraApps /></TabsContent>
                <TabsContent value="signin"><EntraSignInLogs /></TabsContent>
                <TabsContent value="ca"><EntraConditionalAccess /></TabsContent>
              </Tabs>
            </TabsContent>

            {/* ── AZURE ── */}
            <TabsContent value="azure" className="mt-0">
              <Tabs defaultValue="subscriptions">
                <TabsList className="bg-transparent border-b border-zinc-800 rounded-none w-full justify-start p-0 h-auto mb-6 gap-0">
                  {AZURE_TABS.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger key={value} value={value}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:text-white text-zinc-500 gap-1.5 text-xs px-4 py-2.5 h-auto bg-transparent hover:text-zinc-300 transition-colors">
                      <Icon size={13} />{label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="subscriptions"><AzureSubscriptions /></TabsContent>
                <TabsContent value="rgs"><AzureResourceGroups /></TabsContent>
                <TabsContent value="vms"><AzureVMs /></TabsContent>
                <TabsContent value="storage"><AzureStorage /></TabsContent>
                <TabsContent value="roles"><AzureRoles /></TabsContent>
              </Tabs>
            </TabsContent>

          </Tabs>
        </div>
      </div>
    </TooltipProvider>
  );
}