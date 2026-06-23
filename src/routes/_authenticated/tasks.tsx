import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, ListTodo, CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useTasks, useTeamMembers } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STATUS_META,
  PRIORITY_META,
  CATEGORY_META,
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: members = [] } = useTeamMembers();
  const { canEdit } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [category, setCategory] = useState("all");
  const [engineer, setEngineer] = useState("all");
  const [timeframe, setTimeframe] = useState("all");
  const [date, setDate] = useState<Date | undefined>(undefined);

  const filtered = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const selected = date ? format(date, "yyyy-MM-dd") : null;
    return tasks.filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (category !== "all" && t.category !== category) return false;
      if (
        engineer !== "all" &&
        !(t.assigned_to_ids?.length ? t.assigned_to_ids.includes(engineer) : t.assigned_to === engineer)
      )
        return false;
      if (selected && t.task_date !== selected) return false;
      if (timeframe === "past" && !(t.task_date && t.task_date < today)) return false;
      if (timeframe === "today" && t.task_date !== today) return false;
      if (timeframe === "upcoming" && !(t.task_date && t.task_date > today)) return false;
      if (search && !`${t.title} ${t.description ?? ""} ${t.assigned_name ?? ""}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [tasks, status, priority, category, engineer, timeframe, date, search]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={`${filtered.length} of ${tasks.length} tasks`}
        actions={
          canEdit && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          )
        }
      />

      <div className="glass-strong mb-5 flex flex-wrap items-center gap-2 rounded-2xl p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="pl-9" />
        </div>
        <FilterSelect value={status} onChange={setStatus} placeholder="Status" options={TASK_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))} />
        <FilterSelect value={priority} onChange={setPriority} placeholder="Priority" options={TASK_PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label }))} />
        <FilterSelect value={category} onChange={setCategory} placeholder="Category" options={TASK_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_META[c].label }))} />
        <FilterSelect value={engineer} onChange={setEngineer} placeholder="Engineer" options={members.map((m) => ({ value: m.id, label: m.name }))} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      ) : filtered.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <ListTodo className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No tasks match your filters. Try the AI Assistant or create one manually.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} members={members} />
          ))}
        </div>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
