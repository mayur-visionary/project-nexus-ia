// =============================================================================
// /functions/bookings.js
// Project Nexus IA — Invoice App GetBookings Proxy
// Replaces: /functions/api.js (HubSpot deal search) from original Nexus build
//
// Accepts:  POST { FROMDATE: "DD/MM/YYYY", TODATE: "DD/MM/YYYY" }
// Forwards: POST to Invoice App GetBookings with Token header (server-side)
// Returns:  { IsSuccess, Data: [...bookings] }
//
// Token is read from env var INVOICE_APP_TOKEN — never sent to client
// =============================================================================

export async function onRequest(context) {
  const { request, env } = context;

  // ── CORS preflight ─────────────────────────────────────────────────────────
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // ── Token guard ────────────────────────────────────────────────────────────
  const token = env.INVOICE_APP_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ IsSuccess: false, Message: "Server config error: missing token" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Parse request body ─────────────────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ IsSuccess: false, Message: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { FROMDATE, TODATE } = body;
  if (!FROMDATE || !TODATE) {
    return new Response(
      JSON.stringify({ IsSuccess: false, Message: "FROMDATE and TODATE are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── Forward to Invoice App ─────────────────────────────────────────────────
  try {
    const iaRes = await fetch(
      "https://quote.uplers.net/CustomDashboard/GetBookings",
      {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          "Token":        token,
        },
        body: JSON.stringify({ FROMDATE, TODATE }),
      }
    );

    if (!iaRes.ok) {
      return new Response(
        JSON.stringify({ IsSuccess: false, Message: `Invoice App error: ${iaRes.status}` }),
        { status: iaRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await iaRes.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type":                "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });

  } catch (e) {
    return new Response(
      JSON.stringify({ IsSuccess: false, Message: `Fetch error: ${e.message}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
