"use client";

import { useEffect, useState } from "react";

type RegistryEntry = {
  id: string | number;
  name?: string | null;
  version?: string | null;
  hosted_on?: string | null;
  server_url?: string | null;
};

export function ServerRegistryTable() {
  const [registry, setRegistry] = useState<RegistryEntry[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/registry");
      if (!res.ok) {
        setRegistry([]);
        return;
      }

      const data = await res.json();
      setRegistry(Array.isArray(data) ? data : []);
    }

    load();
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="rounded-2xl border border-border/60 bg-linear-to-br from-background via-background to-muted/30 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              FortmontAPI
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
              Server registry overview
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Live registry records pulled from the Prisma-backed registry endpoint.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {registry.length} entries
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Registry Servers</h2>
          <p className="text-sm text-muted-foreground">
            Current registry context and server metadata.
          </p>
        </div>

        {registry.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
            No registry entries found.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="min-w-full table-auto">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Version
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Hosted on
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Server URL
                  </th>
                </tr>
              </thead>
              <tbody>
                {registry.map((entry) => (
                  <tr key={entry.id} className="border-t border-border/60">
                    <td className="px-4 py-3 text-sm text-foreground">{entry.id}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.name ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.version ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.hosted_on ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{entry.server_url ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
