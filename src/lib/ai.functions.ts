import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";

type Member = { id: string; name: string; position: string | null; skills: string[] };

type ParseInput = { text: string; today: string; members: Member[]; model?: string };

async function callGateway(body: Record<string, unknown>) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured (missing key).");

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Please try again shortly.");
  if (res.status === 402) throw new Error("AI credits exhausted. Add credits to continue.");
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI request failed (${res.status}): ${t.slice(0, 200)}`);
  }
  return res.json();
}

export const parseTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ParseInput) => {
    if (!input?.text || typeof input.text !== "string") throw new Error("text is required");
    return input;
  })
  .handler(async ({ data }) => {
    const memberList = data.members
      .map((m) => `- ${m.name} (${m.position ?? "Engineer"}) skills: ${m.skills.join(", ") || "n/a"}`)
      .join("\n");

    const system = `You are an expert IT Operations assistant for an Indonesian IT team. You convert short natural-language activity descriptions (Indonesian or English) into a single structured IT task. Resolve relative dates using today=${data.today}. Indonesian month names: Januari..Desember. "Besok"=tomorrow, "Lusa"=in 2 days, weekday names (Senin..Minggu / Monday..Sunday) = the next upcoming occurrence.

Categorize using these rules:
- Firewall/Fortigate/VPN/security/audit -> security
- Switch/Router/Cisco/network -> network
- Dell/HP/PowerEdge/physical server -> server
- VMware/vSphere/Hyper-V/cluster/VM -> virtualization
- Veeam/backup -> backup
- SAN/NAS/disk/storage -> storage
- Azure/AWS/GCP/cloud -> cloud
- datacenter/DC/rack/cooling -> datacenter
- helpdesk/ticket/user support -> helpdesk
- app/website/deployment -> application
- SQL/Oracle/Postgres/database -> database
- else -> other

Available engineers:
${memberList || "(none yet)"}

Pick the best matching engineer(s) by skills. A task may need MORE THAN ONE engineer — if the activity mentions multiple people, or the work clearly requires several engineers, include all of them. If no engineer fits or none exist, return an empty assigned_member_ids array and put a generic name in assigned_names.`;

    const userPrompt = `Activity: "${data.text}"

Return ONLY JSON with this exact shape:
{
  "title": string,
  "description": string,
  "date": "YYYY-MM-DD" or null,
  "category": one of [network,server,datacenter,virtualization,storage,backup,cloud,security,helpdesk,application,database,other],
  "priority": one of [low,medium,high,critical],
  "risk_level": one of [low,medium,high],
  "estimated_duration": string (e.g. "4 Hours"),
  "location": string or null,
  "equipment": string[],
  "required_team": string[],
  "assigned_member_ids": string[] (each must match an engineer id from the list; empty array if none),
  "assigned_names": string[] (display names of the assigned engineers, one per assignment),
  "assignment_reason": string
}`;


    const json = await callGateway({
      model: data.model || DEFAULT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    // Derive status from date
    let status = "planned";
    const date = (parsed.date as string) || null;
    if (date) {
      const d = new Date(date + "T00:00:00");
      const t = new Date(data.today + "T00:00:00");
      if (d.getTime() === t.getTime()) status = "in_progress";
      else if (d.getTime() < t.getTime()) status = "overdue";
      else status = "planned";
    }

    return { ...parsed, status };
  });

type ReportInput = {
  period: string;
  tasksSummary: string;
  model?: string;
};

export const generateReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ReportInput) => {
    if (!input?.tasksSummary) throw new Error("tasksSummary is required");
    return input;
  })
  .handler(async ({ data }) => {
    const json = await callGateway({
      model: data.model || DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an IT Operations manager writing a professional executive report in clean Markdown. Use clear sections with ## headings: Management Summary, Completed Activities, Ongoing Activities, Upcoming Activities, Risks & Issues, and Recommendations. Be concise and business-oriented.",
        },
        {
          role: "user",
          content: `Generate a ${data.period} IT Operations report from this task data:\n\n${data.tasksSummary}`,
        },
      ],
      temperature: 0.4,
    });

    const content = json?.choices?.[0]?.message?.content ?? "No report generated.";
    return { report: content as string };
  });
