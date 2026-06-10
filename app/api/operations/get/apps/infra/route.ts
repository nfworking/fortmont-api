import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const node_name = searchParams.get("node_name") ?? undefined;
  const node_ip = searchParams.get("node_ip") ?? undefined;
  const node_hostname = searchParams.get("node_hostname") ?? undefined;
  const role = searchParams.get("role") ?? undefined;
  const os = searchParams.get("os") ?? undefined;

  const where: any = {};

  if (node_name) where.node_name = node_name;
  if (node_ip) where.node_ip = node_ip;
  if (node_hostname) where.node_hostname = node_hostname;
  if (role) where.role = role;
  if (os) where.os = os;

  const infra = await prisma.infra.findMany({
    where,
    include: {
      apps: true, // optional: include ComposeApps on each node
    },
  });

  return Response.json(infra);
}