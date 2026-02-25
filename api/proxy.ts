export default async function handler(req: any, res: any) {
  const allowedOrigin = "https://www.dinedeal.in";

  // 🔥 Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");
    return res.status(200).end();
  }

  const { path } = req.query;
  const supabaseUrl = process.env.SUPABASE_URL;

  if (!supabaseUrl) {
    return res.status(500).json({ error: "SUPABASE_URL not configured" });
  }

  const targetPath = Array.isArray(path) ? path.join("/") : path;
  const targetUrl = `${supabaseUrl}/${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined,
      },
      body: req.method !== "GET" ? req.body : undefined,
    });

    const buffer = await response.arrayBuffer();

    // 🔥 Add CORS headers to actual response
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey");

    res.status(response.status).send(Buffer.from(buffer));

  } catch (error) {
    res.status(500).json({ error: "Proxy failed" });
  }
}
