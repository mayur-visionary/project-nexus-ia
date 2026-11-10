// =============================================================================
// /functions/nexus-grid-auth.js
// Project Nexus IA — Nexus Grid Authentication
// No clone mode — single master view only.
// Folds under NEXUS_IA_PASSWORD (same env var as auth.js).
// =============================================================================

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      }
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { password } = await request.json();
    const correct = env.NEXUS_IA_PASSWORD;

    if (!correct) {
      return new Response(
        JSON.stringify({ success: false, error: "Server config error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const success = password === correct;
    return new Response(
      JSON.stringify({ success }),
      { status: success ? 200 : 401, headers: { "Content-Type": "application/json" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "Bad request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
