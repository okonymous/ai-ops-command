import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
} from "date-fns";
import {
  FileBarChart,
  Loader2,
  Sparkles,
  Copy,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { generateReport } from "@/lib/ai.functions";
import { useTasks, useTeamMembers, computeWorkloads } from "@/hooks/useData";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  STATUS_META,
  CATEGORY_META,
  PRIORITY_META,
  type TaskRow,
  type TeamMemberRow,
} from "@/lib/constants";
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

type DetailPeriod = "day" | "week" | "month";

const DETAIL_TABS: { id: DetailPeriod; label: string }[] = [
  { id: "day", label: "Daily" },
  { id: "week", label: "Weekly" },
  { id: "month", label: "Monthly" },
];

function getRange(period: DetailPeriod, ref: Date) {
  if (period === "day") return { start: startOfDay(ref), end: endOfDay(ref) };
  if (period === "week")
    return { start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) };
  return { start: startOfMonth(ref), end: endOfMonth(ref) };
}

function rangeLabel(period: DetailPeriod, ref: Date) {
  if (period === "day") return format(ref, "EEEE, dd MMM yyyy");
  if (period === "week") {
    const { start, end } = getRange("week", ref);
    return `${format(start, "dd MMM")} – ${format(end, "dd MMM yyyy")}`;
  }
  return format(ref, "MMMM yyyy");
}

function shiftRef(period: DetailPeriod, ref: Date, dir: number) {
  if (period === "day") return addDays(ref, dir);
  if (period === "week") return addWeeks(ref, dir);
  return addMonths(ref, dir);
}

function ReportsPage() {
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useTeamMembers();
  const callReport = useServerFn(generateReport);
  const [period, setPeriod] = useState("Weekly");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string>("");

  const [detailPeriod, setDetailPeriod] = useState<DetailPeriod>("day");
  const [refDate, setRefDate] = useState<Date>(new Date());

  const { start, end } = useMemo(() => getRange(detailPeriod, refDate), [detailPeriod, refDate]);

  const periodTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (!t.task_date) return false;
        const d = new Date(t.task_date + "T00:00:00");
        return d >= start && d <= end;
      })
      .sort((a, b) => (a.task_date ?? "").localeCompare(b.task_date ?? ""));
  }, [tasks, start, end]);

  const stats = useMemo(() => {
    const by = (s: string) => periodTasks.filter((t) => t.status === s).length;
    return {
      total: periodTasks.length,
      completed: by("completed"),
      in_progress: by("in_progress"),
      planned: by("planned"),
      overdue: by("overdue"),
    };
  }, [periodTasks]);

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

  const exportCsv = (rows: TaskRow[], filenamePart: string) => {
    if (rows.length === 0) {
      toast.error("No tasks in this period to export.");
      return;
    }
    const header = ["Title", "Status", "Category", "Priority", "Date", "Assigned", "Duration", "Risk", "Location"];
    const body = rows.map((t) => [
      t.title, STATUS_META[t.status].label, CATEGORY_META[t.category].label, PRIORITY_META[t.priority].label, t.task_date ?? "", t.assigned_name ?? "", t.estimated_duration ?? "", t.risk_level, t.location ?? "",
    ]);
    const csv = [header, ...body].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `it-tasks-${filenamePart}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} tasks`);
  };

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Detailed task reports by period, AI summaries, and data exports."
        actions={
          <Button variant="outline" onClick={() => exportCsv(tasks, format(new Date(), "yyyy-MM-dd") + "-all")} className="gap-2">
            <Download className="h-4 w-4" /> Export All
          </Button>
        }
      />

      {/* Detailed task report */}
      <div className="glass-strong mb-6 rounded-2xl p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="font-display text-sm font-semibold">Detailed Task Report</h3>
          <Tabs value={detailPeriod} onValueChange={(v) => setDetailPeriod(v as DetailPeriod)}>
            <TabsList>
              {DETAIL_TABS.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setRefDate((d) => shiftRef(detailPeriod, d, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[180px] text-center text-sm font-medium">{rangeLabel(detailPeriod, refDate)}</span>
            <Button variant="outline" size="icon" onClick={() => setRefDate((d) => shiftRef(detailPeriod, d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRefDate(new Date())}>Today</Button>
          </div>

          <Button
            className="ml-auto gap-2"
            onClick={() => exportCsv(periodTasks, `${detailPeriod}-${format(start, "yyyy-MM-dd")}`)}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatBox label="Total" value={stats.total} />
          <StatBox label="Completed" value={stats.completed} />
          <StatBox label="In Progress" value={stats.in_progress} />
          <StatBox label="Planned" value={stats.planned} />
          <StatBox label="Overdue" value={stats.overdue} />
        </div>

        {periodTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No tasks scheduled in this period.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periodTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {t.task_date ? format(new Date(t.task_date + "T00:00:00"), "dd MMM") : "—"}
                    </TableCell>
                    <TableCell className="font-medium">{t.title}</TableCell>
                    <TableCell>{CATEGORY_META[t.category].label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={PRIORITY_META[t.priority].className}>
                        {PRIORITY_META[t.priority].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{t.assigned_name ?? "—"}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[t.status].bg} ${STATUS_META[t.status].text}`}>
                        {STATUS_META[t.status].label}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* AI report */}
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

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3 text-center">
      <p className="font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
