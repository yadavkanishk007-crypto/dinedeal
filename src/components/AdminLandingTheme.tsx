import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { landingThemes } from "@/data/landingThemes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const toLocalInput = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function AdminLandingTheme() {
  const [theme, setTheme] = useState("diwali");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (supabase.from("landing_settings" as any) as any)
      .select("active_theme,starts_at,ends_at").eq("id", 1).maybeSingle()
      .then(({ data, error }: any) => {
        if (error) { setMessage("Theme settings are unavailable. Apply the landing theme migration first."); return; }
        if (data) {
          setTheme(data.active_theme);
          setStartsAt(toLocalInput(data.starts_at));
          setEndsAt(toLocalInput(data.ends_at));
        }
      });
  }, []);

  const save = async () => {
    setMessage("");
    if (startsAt && endsAt && Date.parse(startsAt) >= Date.parse(endsAt)) {
      setMessage("End time must be after start time.");
      return;
    }
    setSaving(true);
    const { data, error } = await (supabase.from("landing_settings" as any) as any)
      .update({
        active_theme: theme,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        updated_at: new Date().toISOString(),
      }).eq("id", 1).select("id").maybeSingle();
    setSaving(false);
    setMessage(error?.message || (!data ? "Update was not allowed. Check your admin role." : "Landing theme saved."));
  };

  return <Card className="max-w-2xl">
    <CardHeader><CardTitle>Landing theme</CardTitle></CardHeader>
    <CardContent className="space-y-5">
      <label className="block text-sm font-medium">Theme
        <select className="mt-2 w-full rounded-xl border bg-background p-3 text-foreground" value={theme} onChange={(event) => setTheme(event.target.value)}>
          {Object.entries(landingThemes).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Starts (optional)
          <input type="datetime-local" className="mt-2 w-full rounded-xl border bg-background p-3 text-foreground" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
        </label>
        <label className="text-sm font-medium">Ends (optional)
          <input type="datetime-local" className="mt-2 w-full rounded-xl border bg-background p-3 text-foreground" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} />
        </label>
      </div>
      <p className="text-sm text-muted-foreground">Outside the scheduled dates, visitors see the everyday theme. Clear both dates to activate immediately.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save theme"}</Button>
        <Button variant="outline" onClick={() => window.open(`/landing-preview?theme=${encodeURIComponent(theme)}`, "_blank")}>Preview theme</Button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
    </CardContent>
  </Card>;
}
