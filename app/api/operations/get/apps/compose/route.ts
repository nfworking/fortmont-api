import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const name = searchParams.get("name") ?? undefined;
  const description = searchParams.get("description") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const compose_path = searchParams.get("compose_path") ?? undefined;
  const repo_url = searchParams.get("repo_url") ?? undefined;
  const url = searchParams.get("url") ?? undefined;
  const infra_id = searchParams.get("infra_id") ?? undefined;

  const portParam = searchParams.get("port");
  const port = portParam ? Number(portParam) : undefined;

  const where: any = {};

  if (name) where.name = name;
  if (description) where.description = description;
  if (status) where.status = status;
  if (category) where.category = category;
  if (compose_path) where.compose_path = compose_path;
  if (repo_url) where.repo_url = repo_url;
  if (url) where.url = url;
  if (infra_id) where.infra_id = infra_id;
  if (port !== undefined && !Number.isNaN(port)) where.port = port;

  const lxcs = await prisma.composeApps.findMany({
    where,
  });

  return Response.json(lxcs);
}