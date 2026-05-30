export async function GET() {
  const token = process.env.PROXMOX_API_TOKEN;

  if (!token) {
    return Response.json({ error: "Missing token" }, { status: 500 });
  }

  try {
    const res = await fetch("https://ao2.fortmont.me/api2/json/nodes/prodinfra/lxc", {
      headers: {
        Authorization: token,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const details = await res.text();
      return Response.json(
        {
          error: "Proxmox request failed",
          status: res.status,
          details,
        },
        { status: res.status }
      );
    }

    const data = await res.json();

    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch";
    return Response.json({ error: message }, { status: 500 });
  }
}
