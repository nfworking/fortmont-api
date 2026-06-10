import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      node_name,
      node_ip,
      node_hostname,
      management_url,
      role,
      os,
      total_storage,
      used_storage,
    } = body;

    // Basic validation
    if (!node_name || !node_ip) {
      return new Response("node_name and node_ip are required", {
        status: 400,
      });
    }

    const newInfra = await prisma.infra.create({
      data: {
        node_name,
        node_ip,
        node_hostname,
        management_url,
        role,
        os,
        total_storage,
        used_storage,
      },
    });

    return Response.json(newInfra, { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}