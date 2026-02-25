export default async function handler(req: any, res: any) {
  const path = req.query.path || "";
  const query = req.url.includes("?") ? "?" + req.url.split("?")[1] : "";

  const supabaseUrl = "https://biokoqkqledhvrqfbwvd.supabase.co";

  try {
    const response = await fetch(`${supabaseUrl}/${path}${query}`, {
      method: req.method,
      headers: {
        ...req.headers,
      },
      body: req.method !== "GET" ? req.body : undefined,
    });

    const data = await response.text();

    res.status(response.status).send(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy failed" });
  }
}
