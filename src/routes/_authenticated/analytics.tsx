import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { useTasks, useTeamMembers, computeWorkloads } from "@/hooks/useData";
import { PageHeader, ChartCard } from "@/components/PageHeader";
import { CATEGORY_META, TASK_CATEGORIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.75rem",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

function AnalyticsPage() {
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useTeamMembers();

  const trend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
    return months.map((m) => {
      const inMonth = tasks.filter((t) => {
        if (!t.task_date) return false;
        const d = new Date(t.task_date + "T00:00:00");
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      });
      return {
        name: format(m, "MMM"),
        created: inMonth.length,
        completed: inMonth.filter((t) => t.status === "completed").length,
      };
    });
  }, [tasks]);

  const performance = useMemo(() => {
    const workloads = computeWorkloads(members, tasks);
    return workloads.map((w) => ({ name: w.member.name.split(" ")[0], completed: w.completed, open: w.open }));
  }, [members, tasks]);

  const categoryDist = useMemo(
    () =>
      TASK_CATEGORIES.map((c) => ({ name: CATEGORY_META[c].label, value: tasks.filter((t) => t.category === c).length })).filter((d) => d.value > 0),
    [tasks],
  );

  const workloadDist = useMemo(() => {
    const workloads = computeWorkloads(members, tasks).filter((w) => w.total > 0);
    const maxTotal = Math.max(1, ...workloads.map((w) => w.total));
    return workloads
      .map((w) => ({
        name: w.member.name.split(" ")[0],
        util: Math.round((w.total / maxTotal) * 100),
        total: w.total,
        open: w.open,
      }))
      .sort((a, b) => b.total - a.total);
  }, [members, tasks]);

  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;
  const sla = completed + overdue === 0 ? 100 : Math.round((completed / (completed + overdue)) * 100);
  const progress = tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100);

  return (
    <div>
      <PageHeader title="Analytics" description="Performance, workload, and compliance insights." />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="SLA Compliance" value={`${sla}%`} />
        <Metric label="Project Progress" value={`${progress}%`} />
        <Metric label="Total Completed" value={completed} />
        <Metric label="Active Engineers" value={members.length} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Task Completion Trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="created" stroke="var(--color-chart-1)" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="var(--color-chart-2)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Engineer Performance">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" stackId="a" fill="var(--color-chart-2)" radius={[0, 0, 0, 0]} barSize={28} />
              <Bar dataKey="open" stackId="a" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categoryDist.length ? categoryDist : [{ name: "None", value: 1 }]} dataKey="value" nameKey="name" outerRadius={95} label>
                {(categoryDist.length ? categoryDist : [{ name: "None", value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Workload Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={workloadDist} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis type="category" dataKey="name" width={70} stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="util" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="glass-strong rounded-2xl p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
