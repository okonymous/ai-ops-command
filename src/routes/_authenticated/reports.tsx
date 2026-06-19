import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { FileBarChart, Loader2, Sparkles, Copy, Printer, Download } from "lucide-react";
import { generateReport } from "@/lib/ai.functions";
import { useTasks, useTeamMembers, computeWorkloads } from "@/hooks/useData";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_META, CATEGORY_META, PRIORITY_META } from "@/lib/constants";
import { Markdown } from "@/components/Markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const PERIODS = [
  { id: "Daily", label: "Daily" },
  { id: "Weekly", label: "Weekly" },
  { id: "Monthly", label: "Monthly" },
  { id: "Quarterly", label: "Quarterly" },
  { id: "Executive Summary", label: "Executive" },
];

function ReportsPage() {
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useTeamMembers();
  const callReport = useServerFn(generateReport);
  const [period, setPeriod] = useState("Weekly");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>("");

  const buildSummary = () => {
    const workloads = computeWorkloads(members, tasks);
    const lines = tasks.map(
      (t) =>
        `- [${STATUS_META[t.status].label}] ${t.title} | ${CATEGORY_META[t.category].label} | ${PRIORITY_META[t.priority].label} priority | ${t.task_date ?? "no date"} | assigned: ${t.assigned_name ?? "n/a"} | risk: ${t.risk_level}`,
    );
    const team = workloads.map((w) => `- ${w.member.name}: ${w.open} open, ${w.completed} completed, ${w.overdue} overdue (${w.utilization}% util)`);
    return `Date: ${format(new Date(), "dd MMM yyyy")}\nTotal tasks: ${tasks.length}\n\nTASKS:\n${lines.join("\n")}\n\nTEAM WORKLOAD:\n${team.join("\n")}`;
  };

  const generate = async () => {
    setLoading(true);
    setReport("");
    try {
      const res = (await callReport({ data: { period, tasksSummary: buildSummary() } })) as { report: string };
      setReport(res.report);
      toast.success("Report generated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const header = ["Title", "Status", "Category", "Priority", "Date", "Assigned", "Duration", "Risk", "Location"];
    const rows = tasks.map((t) => [
      t.title, t.status, t.category, t.priority, t.task_date ?? "", t.assigned_name ?? "", t.estimated_duration ?? "", t.risk_level, t.location ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `it-tasks-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="AI-generated operational reports and data exports."
        actions={
          <Button variant="outline" onClick={exportCsv} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="glass-strong mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            {PERIODS.map((p) => <TabsTrigger key={p.id} value={p.id}>{p.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <Button onClick={generate} disabled={loading} className="ml-auto gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generate {period} Report
        </Button>
      </div>

      {report ? (
        <div className="glass-strong rounded-2xl p-6">
          <div className="mb-4 flex items-center justify-end gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(report); toast.success("Copied"); }} className="gap-2">
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2">
              <Printer className="h-4 w-4" /> Print / PDF
            </Button>
          </div>
          <Markdown content={report} />
        </div>
      ) : (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <FileBarChart className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Pick a period and let AI summarize completed, ongoing, and upcoming activities with risks and recommendations.
          </p>
        </div>
      )}
    </div>
  );
}
