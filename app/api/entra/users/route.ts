import { getGraphToken } from "@/lib/EntraHelper";

export async function GET() {
  try {
    console.log("➡️ Starting Entra users fetch");

    // 1. Get token
    const tokenData = await getGraphToken();

    console.log("🔑 Token received");
  

    // 2. Call Graph
    const res = await fetch("https://graph.microsoft.com/v1.0/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Graph status:", res.status);

    // 3. Read response body safely (even on error)
    const text = await res.text();

   

    if (!res.ok) {
      return Response.json(
        {
          error: "Microsoft Graph returned error",
          status: res.status,
          details: text,
        },
        { status: res.status }
      );
    }

    const data = JSON.parse(text);

  

    return Response.json(data);
  } catch (error: any) {
    console.error("❌ Unexpected error:", error);

    return Response.json(
      {
        error: "Failed to fetch users from Microsoft Graph",
        message: error.message,
      },
      { status: 500 }
    );
  }
}