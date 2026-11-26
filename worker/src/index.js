const corsHeaders = {
  "Access-Control-Allow-Origin": "https://colony-file.pages.dev",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/" || url.pathname === "/health") {
      try {
        const row = await env.DB.prepare("SELECT 1 AS ok").first();
        return json({ service: "COLONY FILE API", status: "running", database: row?.ok === 1 ? "connected" : "unknown", storage: env.FILES ? "bound" : "not_bound" });
      } catch (error) {
        return json({ service: "COLONY FILE API", status: "needs_setup", database: "not_connected", error: "Check the D1 binding named DB." }, 503);
      }
    }

    return json({ error: "Not found" }, 404);
  }
};
