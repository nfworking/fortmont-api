"use client";

import type { ReactNode } from "react";
import {
  Server,
  Container,
  ShieldCheck,
  Globe,
  Users,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
};

type QuickLinkProps = {
  icon: ReactNode;
  label: string;
  description: string;
  href?: string;
};

type AlertItem = {
  level: "warn" | "ok" | "info";
  message: string;
};

// ── Glass card primitive ───────────────────────────────────────────────────
function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-md backdrop-saturate-150 ${className}`}
    >
      {children}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent = "text-white" }: StatCardProps) {
  return (
    <GlassCard className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
          {label}
        </span>
        <span className="text-white/40">{icon}</span>
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </GlassCard>
  );
}

// ── Quick link card ────────────────────────────────────────────────────────
function QuickLink({ icon, label, description }: QuickLinkProps) {
  return (
    <GlassCard className="group flex cursor-pointer items-start gap-4 p-5 transition-all duration-200 hover:bg-white/20 hover:shadow-xl">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 group-hover:bg-white/20 group-hover:text-white">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-white/50">{description}</p>
      </div>
    </GlassCard>
  );
}

// ── Alert row ──────────────────────────────────────────────────────────────
const alertColour: Record<AlertItem["level"], string> = {
  ok: "text-emerald-300",
  warn: "text-amber-300",
  info: "text-sky-300",
};

function AlertRow({ level, message }: AlertItem) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-1 py-2">
      <AlertCircle className={`h-4 w-4 shrink-0 ${alertColour[level]}`} />
      <p className="text-sm text-white/70">{message}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const stats: StatCardProps[] = [
    {
      icon: <Server className="h-4 w-4" />,
      label: "VMs Online",
      value: "12 / 14",
      sub: "2 stopped",
      accent: "text-white",
    },
    {
      icon: <Container className="h-4 w-4" />,
      label: "LXC Containers",
      value: "31",
      sub: "All running",
      accent: "text-emerald-300",
    },
    {
      icon: <Cpu className="h-4 w-4" />,
      label: "CPU Usage",
      value: "38%",
      sub: "Avg across nodes",
      accent: "text-amber-300",
    },
    {
      icon: <HardDrive className="h-4 w-4" />,
      label: "Storage Used",
      value: "4.2 TB",
      sub: "of 8 TB total",
      accent: "text-sky-300",
    },
    {
      icon: <Wifi className="h-4 w-4" />,
      label: "Network I/O",
      value: "1.4 Gbps",
      sub: "Last 5 min avg",
      accent: "text-white",
    },
    {
      icon: <Activity className="h-4 w-4" />,
      label: "Uptime",
      value: "99.97%",
      sub: "Past 30 days",
      accent: "text-emerald-300",
    },
  ];

  const links: QuickLinkProps[] = [
    {
      icon: <Server className="h-5 w-5" />,
      label: "Server Registry",
      description: "Browse and manage physical hosts",
    },
    {
      icon: <Container className="h-5 w-5" />,
      label: "LXC Registry",
      description: "Inspect running containers",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: "SSL Certificates",
      description: "View expiry and renewal status",
    },
    {
      icon: <Globe className="h-5 w-5" />,
      label: "DNS Records",
      description: "Manage zones and records",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Site Users",
      description: "Access control and roles",
    },
    {
      icon: <Activity className="h-5 w-5" />,
      label: "Proxy",
      description: "Reverse proxy routes",
    },
  ];

  const alerts: AlertItem[] = [
    { level: "warn", message: "pve-node-02: memory pressure above 80% for 15 min" },
    { level: "ok",   message: "All SSL certificates valid — next expiry in 34 days" },
    { level: "info", message: "Proxmox VE 8.3 update available for pve-node-01" },
    { level: "warn", message: "Backup job 'vm-104' completed with warnings" },
    { level: "ok",   message: "DNS propagation confirmed for fortmont.me" },
  ];

  return (
    <div className="min-h-screen bg-background/60 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-white/40">Fortmont infrastructure overview</p>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        {/* Lower two-column layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Quick links — takes 2/3 */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Quick access
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {links.map((l) => (
                <QuickLink key={l.label} {...l} />
              ))}
            </div>
          </div>

          {/* Alerts — takes 1/3 */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Recent alerts
            </p>
            <GlassCard className="divide-y divide-white/10 p-4">
              {alerts.map((a) => (
                <AlertRow key={a.message} {...a} />
              ))}
            </GlassCard>
          </div>

        </div>
      </div>
    </div>
  );
}