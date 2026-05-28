import type { CSSProperties } from "react";
import { auth } from "@/lib/auth";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function ServerSettingsPage() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader title="Server settings" />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Server settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              This page is wired up so the sidebar can navigate here. Add your server configuration controls here.
            </p>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}