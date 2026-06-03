// app/api-docs/page.tsx

import fs from "fs/promises";
import path from "path";

async function getRoutes() {
  const apiDir = path.join(process.cwd(), "app", "api");

  async function walk(dir: string, prefix = "/api") {
    const entries = await fs.readdir(dir, {
      withFileTypes: true,
    });

    const routes: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        routes.push(
          ...(await walk(
            fullPath,
            `${prefix}/${entry.name}`
          ))
        );
      }

      if (entry.isFile() && entry.name === "route.ts") {
        routes.push(prefix);
      }
    }

    return routes;
  }

  return walk(apiDir);
}

export default async function ApiDocsPage() {
  const routes = await getRoutes();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        API Routes
      </h1>

      <ul className="space-y-2">
        {routes.map((route) => (
          <li key={route}>
            <code>{route}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}