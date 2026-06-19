import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  RefreshCw,
  Radar,
  Server,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AI_PROVIDERS } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ai-settings")({
  component: AiSettingsPage,
});

type ProviderConfig = { apiKey: string; baseUrl: string; model: string; temperature: number; maxTokens: number };
type Config = {
  providers: Record<string, ProviderConfig>;
  routing: Record<string, string>;
  failover: { primary: string; fallback1: string; fallback2: string };
};

const LOVABLE_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "openai/gpt-5",
  "openai/gpt-5-mini",
];

const ROUTING_TASKS = [
  ["task_parsing", "Task Parsing"],
  ["task_assignment", "Task Assignment"],
  ["report_generation", "Report Generation"],
  ["documentation", "Documentation"],
  ["local_processing", "Local Processing"],
];

function defaultConfig(): Config {
  const providers: Record<string, ProviderConfig> = {};
  AI_PROVIDERS.forEach((p) => {
    providers[p.id] = { apiKey: "", baseUrl: p.defaultUrl, model: "", temperature: 0.3, maxTokens: 2048 };
  });
  return {
    providers,
    routing: {
      task_parsing: "google/gemini-3-flash-preview",
      task_assignment: "google/gemini-2.5-flash",
      report_generation: "google/gemini-2.5-pro",
      documentation: "openai/gpt-5-mini",
      local_processing: "ollama",
    },
    failover: { primary: "lovable", fallback1: "openrouter", fallback2: "ollama" },
  };
}

function AiSettingsPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<Config>(defaultConfig());
  const [active, setActive] = useState("lovable");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [status, setStatus] = useState<Record<string, { ok: boolean; ms: number; models: string[] }>>({});
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("ai_settings")
      .select("config")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.config) setConfig({ ...defaultConfig(), ...(data.config as Config) });
      });
  }, [user]);

  const setProvider = (id: string, patch: Partial<ProviderConfig>) =>
    setConfig((c) => ({ ...c, providers: { ...c.providers, [id]: { ...c.providers[id], ...patch } } }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("ai_settings")
      .upsert({ user_id: user.id, config }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("AI settings saved");
  };

  const testConnection = async (id: string) => {
    setTesting(id);
    const cfg = config.providers[id];
    const start = performance.now();
    try {
      if (id === "lovable") {
        setStatus((s) => ({ ...s, [id]: { ok: true, ms: 0, models: LOVABLE_MODELS } }));
        toast.success("Lovable AI is built-in and active");
      } else if (id === "ollama") {
        const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/api/tags`);
        const data = await res.json();
        const models = (data.models ?? []).map((m: { name: string }) => m.name);
        setStatus((s) => ({ ...s, [id]: { ok: true, ms: Math.round(performance.now() - start), models } }));
        toast.success(`Ollama connected — ${models.length} models`);
      } else {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;
        const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/models`, { headers });
        const data = await res.json();
        const models = (data.data ?? data.models ?? []).map((m: { id?: string; name?: string }) => m.id ?? m.name).filter(Boolean);
        setStatus((s) => ({ ...s, [id]: { ok: true, ms: Math.round(performance.now() - start), models } }));
        toast.success(`Connected — ${models.length} models`);
      }
    } catch {
      setStatus((s) => ({ ...s, [id]: { ok: false, ms: 0, models: [] } }));
      toast.error("Connection failed (check URL / CORS / key)");
    } finally {
      setTesting(null);
    }
  };

  const scanLocal = async () => {
    setScanning(true);
    const targets = [
      { id: "ollama", url: "http://localhost:11434/api/tags" },
      { id: "lmstudio", url: "http://localhost:1234/v1/models" },
      { id: "openwebui", url: "http://localhost:3000/api/models" },
    ];
    let found = 0;
    await Promise.all(
      targets.map(async (t) => {
        try {
          const res = await fetch(t.url);
          if (res.ok) {
            found++;
            setStatus((s) => ({ ...s, [t.id]: { ok: true, ms: 0, models: [] } }));
          }
        } catch {
          /* not running */
        }
      }),
    );
    setScanning(false);
    toast[found ? "success" : "info"](found ? `Found ${found} local AI service(s)` : "No local AI services detected");
  };

  const activeProvider = AI_PROVIDERS.find((p) => p.id === active)!;
  const cfg = config.providers[active];

  return (
    <div>
      <PageHeader
        title="AI Settings"
        description="Configure cloud and local AI providers, model routing, and failover."
        actions={
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </Button>
        }
      />

      <Tabs defaultValue="providers">
        <TabsList className="mb-4">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="routing">Model Routing</TabsTrigger>
          <TabsTrigger value="failover">Failover</TabsTrigger>
          <TabsTrigger value="discovery">Local Discovery</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
            <div className="glass-strong h-fit space-y-1 rounded-2xl p-2">
              {AI_PROVIDERS.map((p) => {
                const st = status[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => setActive(p.id)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${active === p.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    {p.local ? <Server className="h-4 w-4" /> : <BrainCircuit className="h-4 w-4" />}
                    <span className="flex-1 truncate">{p.name}</span>
                    {st?.ok && <CheckCircle2 className="h-4 w-4 text-success" />}
                  </button>
                );
              })}
            </div>

            <div className="glass-strong rounded-2xl p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold">{activeProvider.name}</h3>
                  {activeProvider.id === "lovable" && (
                    <p className="text-xs text-muted-foreground">Built-in — no API key required. Powers the AI assistant.</p>
                  )}
                </div>
                {status[active] && (
                  <Badge variant="secondary" className={status[active].ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}>
                    {status[active].ok ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                    {status[active].ok ? `Connected ${status[active].ms ? `· ${status[active].ms}ms` : ""}` : "Failed"}
                  </Badge>
                )}
              </div>

              {active !== "lovable" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Base URL</Label>
                    <Input value={cfg.baseUrl} onChange={(e) => setProvider(active, { baseUrl: e.target.value })} placeholder={activeProvider.defaultUrl} />
                  </div>
                  {!activeProvider.local && (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">API Key</Label>
                      <Input type="password" value={cfg.apiKey} onChange={(e) => setProvider(active, { apiKey: e.target.value })} placeholder="sk-..." />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default Model</Label>
                    <Input value={cfg.model} onChange={(e) => setProvider(active, { model: e.target.value })} placeholder="model name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Max Tokens</Label>
                    <Input type="number" value={cfg.maxTokens} onChange={(e) => setProvider(active, { maxTokens: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs">Temperature: {cfg.temperature.toFixed(2)}</Label>
                    <Slider value={[cfg.temperature]} min={0} max={1} step={0.05} onValueChange={([v]) => setProvider(active, { temperature: v })} />
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center gap-2">
                <Button variant="outline" onClick={() => testConnection(active)} disabled={testing === active} className="gap-2">
                  {testing === active ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Test Connection
                </Button>
              </div>

              {status[active]?.models?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Available Models ({status[active].models.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {status[active].models.slice(0, 24).map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="routing">
          <div className="glass-strong max-w-2xl space-y-4 rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">Assign a specific model to each AI task type.</p>
            {ROUTING_TASKS.map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label>{label}</Label>
                <Select value={config.routing[key]} onValueChange={(v) => setConfig((c) => ({ ...c, routing: { ...c.routing, [key]: v } }))}>
                  <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOVABLE_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    {AI_PROVIDERS.filter((p) => p.local).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failover">
          <div className="glass-strong max-w-2xl space-y-4 rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">If the primary model fails, requests retry through fallbacks automatically.</p>
            {([["primary", "Primary Model"], ["fallback1", "Fallback Model"], ["fallback2", "Fallback Model 2"]] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label>{label}</Label>
                <Select value={config.failover[key]} onValueChange={(v) => setConfig((c) => ({ ...c, failover: { ...c.failover, [key]: v } }))}>
                  <SelectTrigger className="w-[260px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AI_PROVIDERS.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="discovery">
          <div className="glass-strong max-w-2xl rounded-2xl p-6 text-center">
            <Radar className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h3 className="font-display text-lg font-semibold">Scan Local AI Services</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Detect Ollama, LM Studio, and Open WebUI running on this machine.
            </p>
            <Button onClick={scanLocal} disabled={scanning} className="mt-4 gap-2">
              {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radar className="h-4 w-4" />} Scan Now
            </Button>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {["ollama", "lmstudio", "openwebui"].map((id) => (
                <div key={id} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium capitalize">{id}</p>
                  <Badge variant="secondary" className={status[id]?.ok ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                    {status[id]?.ok ? "Detected" : "Not found"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
