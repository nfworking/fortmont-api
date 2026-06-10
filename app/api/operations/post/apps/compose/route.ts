import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      name,
      description,
      status,
      category,
      compose_path,
      repo_url,
      port,
      url,
      infra_id,
    } = body;

    // Basic validation (you can upgrade to Zod later)
    if (!name) {
      return new Response("Name is required", { status: 400 });
    }

    const newApp = await prisma.composeApps.create({
      data: {
        name,
        description,
        status,
        category,
        compose_path,
        repo_url,
        url,
        infra_id,
        port: port ? Number(port) : null,
      },
    });

    return Response.json(newApp, { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const lxc_unique_id = searchParams.get("lxc_unique_id") ?? undefined;

  if (!lxc_unique_id) {
    return Response.json({ error: "Missing lxc_unique_id" }, { status: 400 });
  }

  const lxc = await prisma.lxc.delete({
    where: {
      lxc_unique_id,
    },
  });

  return Response.json(lxc);
}

export async function PATCH(req: Request) {
  const body = await req.json();

  const { searchParams } = new URL(req.url);
  const lxc_unique_id = searchParams.get("lxc_unique_id") ?? undefined;

  if (!lxc_unique_id) {
    return Response.json({ error: "Missing lxc_unique_id" }, { status: 400 });
  }

  const lxc = await prisma.lxc.update({
    where: {
      lxc_unique_id,
    },
    data: {
      lxc_ip: body.lxc_ip,
      lxc_role: body.lxc_role,
      lxc_status: body.lxc_status,
      lxc_compose_status: body.lxc_compose_status
    },
  });

  return Response.json(lxc);
}