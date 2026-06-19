import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  addWeeks,
  addDays,
  addYears,
  isSameMonth,
  isSameDay,
  isToday,
  eachMonthOfInterval,
  startOfYear,
  endOfYear,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTasks, useTeamMembers } from "@/hooks/useData";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_META,
  CATEGORY_META,
  PRIORITY_META,
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  type TaskRow,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

type View = "day" | "week" | "month" | "year";

function CalendarPage() {
  const { data: tasks = [] } = useTasks();
  const { data: members = [] } = useTeamMembers();
  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [engineer, setEngineer] = useState("all");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (!t.task_date) return false;
        if (engineer !== "all" && t.assigned_to !== engineer) return false;
        if (category !== "all" && t.category !== category) return false;
        if (priority !== "all" && t.priority !== priority) return false;
        return true;
      }),
    [tasks, engineer, category, priority],
  );

  const tasksOn = (day: Date) =>
    filtered.filter((t) => t.task_date && isSameDay(new Date(t.task_date + "T00:00:00"), day));

  const nav = (dir: number) => {
    setCursor((c) =>
      view === "month" ? addMonths(c, dir) : view === "week" ? addWeeks(c, dir) : view === "day" ? addDays(c, dir) : addYears(c, dir),
    );
  };

  const title =
    view === "year"
      ? format(cursor, "yyyy")
      : view === "day"
        ? format(cursor, "EEEE, dd MMMM yyyy")
        : format(cursor, "MMMM yyyy");

  return (
    <div>
      <PageHeader title="Calendar" description="Engineer, team, and task schedule." />

      <div className="glass-strong mb-4 flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <span className="ml-1 font-display text-lg font-semibold">{title}</span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={engineer} onValueChange={setEngineer}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Engineer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engineers</SelectItem>
              {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[130px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TASK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[120px]"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {TASK_PRIORITIES.map((p) => <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Tabs value={view} onValueChange={(v) => setView(v as View)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {view === "month" && <MonthView cursor={cursor} tasksOn={tasksOn} />}
      {view === "week" && <WeekView cursor={cursor} tasksOn={tasksOn} />}
      {view === "day" && <DayView cursor={cursor} tasks={tasksOn(cursor)} />}
      {view === "year" && <YearView cursor={cursor} filtered={filtered} setCursor={setCursor} setView={setView} />}
    </div>
  );
}

function TaskPill({ task }: { task: TaskRow }) {
  const status = STATUS_META[task.status];
  return (
    <div
      className="truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `color-mix(in oklch, var(--color-${status.token}) 18%, transparent)`,
        color: `var(--color-${status.token})`,
      }}
      title={`${task.title} — ${task.assigned_name ?? ""}`}
    >
      {task.title}
    </div>
  );
}

function MonthView({ cursor, tasksOn }: { cursor: Date; tasksOn: (d: Date) => TaskRow[] }) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="glass-strong overflow-hidden rounded-2xl">
      <div className="grid grid-cols-7 border-b text-center text-xs font-semibold text-muted-foreground">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayTasks = tasksOn(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[96px] border-b border-r p-1.5",
                !isSameMonth(day, cursor) && "bg-muted/30 text-muted-foreground",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday(day) && "bg-primary font-bold text-primary-foreground")}>
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => <TaskPill key={t.id} task={t} />)}
                {dayTasks.length > 3 && <p className="text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, tasksOn }: { cursor: Date; tasksOn: (d: Date) => TaskRow[] }) {
  const start = startOfWeek(cursor, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end: endOfWeek(cursor, { weekStartsOn: 1 }) });
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => (
        <div key={day.toISOString()} className="glass-strong min-h-[180px] rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">{format(day, "EEE")}</span>
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs", isToday(day) && "bg-primary font-bold text-primary-foreground")}>
              {format(day, "d")}
            </span>
          </div>
          <div className="space-y-1.5">
            {tasksOn(day).map((t) => <TaskPill key={t.id} task={t} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayView({ cursor, tasks }: { cursor: Date; tasks: TaskRow[] }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <h3 className="mb-3 font-display font-semibold">{format(cursor, "EEEE, dd MMMM yyyy")}</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No scheduled activities.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const status = STATUS_META[t.status];
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl border p-3">
                <div className="h-10 w-1 rounded-full" style={{ backgroundColor: `var(--color-${status.token})` }} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.assigned_name} • {t.estimated_duration} • {t.location}</p>
                </div>
                <Badge variant="secondary" className={cn(status.bg, status.text)}>{status.label}</Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function YearView({
  cursor,
  filtered,
  setCursor,
  setView,
}: {
  cursor: Date;
  filtered: TaskRow[];
  setCursor: (d: Date) => void;
  setView: (v: View) => void;
}) {
  const months = eachMonthOfInterval({ start: startOfYear(cursor), end: endOfYear(cursor) });
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {months.map((m) => {
        const count = filtered.filter((t) => {
          const d = new Date(t.task_date + "T00:00:00");
          return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear();
        }).length;
        return (
          <button
            key={m.toISOString()}
            onClick={() => { setCursor(m); setView("month"); }}
            className="glass-strong rounded-2xl p-5 text-left transition-colors hover:bg-accent"
          >
            <p className="font-display font-semibold">{format(m, "MMMM")}</p>
            <p className="mt-2 font-display text-3xl font-bold text-primary">{count}</p>
            <p className="text-xs text-muted-foreground">scheduled tasks</p>
          </button>
        );
      })}
    </div>
  );
}
