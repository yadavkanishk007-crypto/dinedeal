export default async function handler(req: any, res: any) {
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

    const contentType = response.headers.get("content-type");
    res.setHeader("content-type", contentType || "application/json");

    const data = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(data));

  } catch (error) {
    res.status(500).json({ error: "Proxy failed" });
  }
}
