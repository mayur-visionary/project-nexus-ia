export async function onRequest(context) {
  try {
    const { password, head } = await context.request.json();

    const CLONE_VAR_MAP = {
      jiggyasa: "NEXUS_IA_PASSWORD_JIGGYASA",
      jaydeep:  "NEXUS_IA_PASSWORD_JAYDEEP",
      tanuj:    "NEXUS_IA_PASSWORD_TANUJ"
    };

    const isClone    = !!head && !!CLONE_VAR_MAP[head];
    const envVarName = isClone ? CLONE_VAR_MAP[head] : "NEXUS_IA_PASSWORD";
    const correct    = context.env[envVarName];

    if (!correct) {
      return new Response(JSON.stringify({ error: `${envVarName} not configured` }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }
    if (password === correct) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({ success: false }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
