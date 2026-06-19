import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ListTodo,
  CalendarClock,
  Loader,
  CheckCircle2,
  AlertOctagon,
  Flame,
  Gauge,
  CalendarDays,
  CalendarRange,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  startOfWeek,
  endOfWeek,
  format,
  isWithinInterval,
  subMonths,
  startOfMonth,
} from "date-fns";
import { useTasks, useTeamMembers, computeWorkloads } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PageHeader, ChartCard } from "@/components/PageHeader";
import { TaskCard } from "@/components/tasks/TaskCard";
import { CATEGORY_META, PRIORITY_META, TASK_CATEGORIES, TASK_PRIORITIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/")({
  component: Dashboard,
});

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function Dashboard() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: members = [] } = useTeamMembers();
  const { profile } = useAuth();

  const stats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const byStatus = (s: string) => tasks.filter((t) => t.status === s).length;
    const workloads = computeWorkloads(members, tasks);
    const avgUtil = workloads.length
      ? Math.round(workloads.reduce((a, w) => a + w.utilization, 0) / workloads.length)
      : 0;

    const inWeek = tasks.filter(
      (t) =>
        t.task_date &&
        isWithinInterval(new Date(t.task_date + "T00:00:00"), { start: weekStart, end: weekEnd }),
    ).length;

    return {
      total: tasks.length,
      planned: byStatus("planned"),
      inProgress: byStatus("in_progress"),
      completed: byStatus("completed"),
      overdue: byStatus("overdue"),
      highPriority: tasks.filter((t) => t.priority === "high" || t.priority === "critical").length,
      avgUtil,
      todayCount: tasks.filter((t) => t.task_date === today).length,
      weekCount: inWeek,
      upcoming: tasks.filter((t) => t.task_date && t.task_date > today && t.status === "planned").length,
    };
  }, [tasks, members]);

  const categoryData = useMemo(
    () =>
      TASK_CATEGORIES.map((c) => ({
        name: CATEGORY_META[c].label,
        value: tasks.filter((t) => t.category === c).length,
      })).filter((d) => d.value > 0),
    [tasks],
  );

  const engineerData = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((t) => {
      const n = t.assigned_name || "Unassigned";
      map.set(n, (map.get(n) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [tasks]);

  const priorityData = useMemo(
    () =>
      TASK_PRIORITIES.map((p) => ({
        name: PRIORITY_META[p].label,
        value: tasks.filter((t) => t.priority === p).length,
      })).filter((d) => d.value > 0),
    [tasks],
  );

  const trendData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
    return months.map((m) => {
      const label = format(m, "MMM");
      const completed = tasks.filter((t) => {
        if (t.status !== "completed" || !t.task_date) return false;
        const d = new Date(t.task_date + "T00:00:00");
        return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
      }).length;
      return { name: label, completed };
    });
  }, [tasks]);

  const slaRate = useMemo(() => {
    const done = stats.completed;
    const missed = stats.overdue;
    const denom = done + missed;
    return denom === 0 ? 100 : Math.round((done / denom) * 100);
  }, [stats]);

  const todayTasks = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return tasks.filter((t) => t.task_date === today || t.status === "in_progress").slice(0, 4);
  }, [tasks]);

  return (
    <div>
      <PageHeader
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`}
        description="Live overview of your IT operations — tasks, schedules, and team workload."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Total Tasks" value={stats.total} icon={ListTodo} accent="primary" />
        <KpiCard label="Planned" value={stats.planned} icon={CalendarClock} accent="info" />
        <KpiCard label="In Progress" value={stats.inProgress} icon={Loader} accent="warning" />
        <KpiCard label="Completed" value={stats.completed} icon={CheckCircle2} accent="success" />
        <KpiCard label="Overdue" value={stats.overdue} icon={AlertOctagon} accent="destructive" />
        <KpiCard label="High Priority" value={stats.highPriority} icon={Flame} accent="destructive" />
        <KpiCard label="Team Utilization" value={`${stats.avgUtil}%`} icon={Gauge} accent="primary" />
        <KpiCard label="Today" value={stats.todayCount} icon={CalendarDays} accent="info" />
        <KpiCard label="This Week" value={stats.weekCount} icon={CalendarRange} accent="success" />
        <KpiCard label="Upcoming" value={stats.upcoming} icon={ArrowUpRight} accent="muted" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Monthly Completion Trend">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="var(--color-chart-1)"
                strokeWidth={2}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={priorityData.length ? priorityData : [{ name: "None", value: 1 }]}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {(priorityData.length ? priorityData : [{ name: "None", value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <Legend items={priorityData} />
        </ChartCard>

        <ChartCard title="SLA Achievement">
          <ResponsiveContainer width="100%" height={240}>
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={[{ name: "SLA", value: slaRate, fill: "var(--color-chart-2)" }]}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar background dataKey="value" cornerRadius={20} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="-mt-32 mb-24 text-center font-display text-4xl font-bold">{slaRate}%</p>
          <p className="text-center text-xs text-muted-foreground">On-time completion rate</p>
        </ChartCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Tasks by Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={90} stroke="var(--color-muted-foreground)" fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="value" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tasks by Engineer">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={engineerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="value" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 font-display text-lg font-semibold">Today & Active Tasks</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : todayTasks.length === 0 ? (
          <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No tasks for today yet. Use the AI Assistant to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {todayTasks.map((t) => (
              <TaskCard key={t.id} task={t} members={members} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "0.75rem",
  color: "var(--color-popover-foreground)",
  fontSize: "12px",
};

function Legend({ items }: { items: { name: string; value: number }[] }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-3">
      {items.map((it, i) => (
        <span key={it.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
          {it.name} ({it.value})
        </span>
      ))}
    </div>
  );
}
