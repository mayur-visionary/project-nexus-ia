// functions/achievement-desk-auth.js
// Achievement Desk — IA password gate
// Pattern: matches IA auth.js (onRequest + CORS + NEXUS_IA_PASSWORD)
// Master + Nevilson → NEXUS_IA_PASSWORD
// Jiggyasa          → NEXUS_IA_PASSWORD_JIGGYASA
// Jaydeep           → NEXUS_IA_PASSWORD_JAYDEEP
// Tanuj             → NEXUS_IA_PASSWORD_TANUJ

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
    const { password, head } = await request.json();

    const CLONE_VAR_MAP = {
      jiggyasa : "NEXUS_IA_PASSWORD_JIGGYASA",
      jaydeep  : "NEXUS_IA_PASSWORD_JAYDEEP",
      tanuj    : "NEXUS_IA_PASSWORD_TANUJ"
      // nevilson: falls through to NEXUS_IA_PASSWORD (master)
    };

    const isClone    = !!head && !!CLONE_VAR_MAP[head];
    const envVarName = isClone ? CLONE_VAR_MAP[head] : "NEXUS_IA_PASSWORD";
    const correct    = env[envVarName];

    if (!correct) {
      return new Response(
        JSON.stringify({ success: false, error: `${envVarName} not configured in environment` }),
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
