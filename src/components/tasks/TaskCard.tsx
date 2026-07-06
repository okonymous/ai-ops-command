import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  MapPin,
  MoreVertical,
  Trash2,
  Pencil,
  AlertTriangle,
  Wrench,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TaskDetailDialog } from "@/components/tasks/TaskDetailDialog";
import { TaskDialog } from "@/components/tasks/TaskDialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  STATUS_META,
  PRIORITY_META,
  CATEGORY_META,
  RISK_META,
  TASK_STATUSES,
  type TaskRow,
  type TeamMemberRow,
  type TaskStatus,
} from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function TaskCard({
  task,
  members,
}: {
  task: TaskRow;
  members: TeamMemberRow[];
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { canEdit, hasRole, user } = useAuth();
  const status = STATUS_META[task.status];
  const cat = CATEGORY_META[task.category];
  const assignedIds = task.assigned_to_ids?.length
    ? task.assigned_to_ids
    : task.assigned_to
    ? [task.assigned_to]
    : [];
  const assignedNames = task.assigned_names?.length
    ? task.assigned_names
    : task.assigned_name
    ? [task.assigned_name]
    : [];
  const canDelete = hasRole("admin", "it_manager", "team_lead") || task.created_by === user?.id;

  const toInitials = (name: string) =>
    name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const engineers = assignedIds.length
    ? assignedIds.map((id, i) => {
        const m = members.find((mm) => mm.id === id);
        return { name: m?.name ?? assignedNames[i] ?? "NA", position: m?.position ?? "Engineer" };
      })
    : assignedNames.map((n) => ({ name: n, position: "Engineer" }));


  const updateStatus = async (newStatus: TaskStatus) => {
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    if (error) toast.error(error.message);
    else toast.success(`Marked ${STATUS_META[newStatus].label}`);
  };

  const remove = async () => {
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) toast.error(error.message);
    else toast.success("Task deleted");
  };

  return (
    <>
    <div
      role="button"
      tabIndex={0}
      onClick={() => setDetailOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setDetailOpen(true);
        }
      }}
      className="glass-strong group relative cursor-pointer overflow-hidden rounded-2xl p-4 shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: `var(--color-${status.token})` }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn(status.bg, status.text, "text-[11px]")}>
              {status.label}
            </Badge>
            <Badge variant="outline" className="text-[11px]">
              {cat.label}
            </Badge>
          </div>
          <h3 className="mt-2 font-display font-semibold leading-tight">{task.title}</h3>
        </div>


        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="rounded-md p-1 text-muted-foreground hover:bg-accent"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Set status</DropdownMenuLabel>
              {TASK_STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => updateStatus(s)}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `var(--color-${STATUS_META[s].token})` }}
                  />
                  {STATUS_META[s].label}
                </DropdownMenuItem>
              ))}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={remove} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {task.task_date && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(new Date(task.task_date + "T00:00:00"), "dd MMM yyyy")}
          </span>
        )}
        {task.estimated_duration && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {task.estimated_duration}
          </span>
        )}
        {task.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {task.location}
          </span>
        )}
        <span className={cn("flex items-center gap-1.5", RISK_META[task.risk_level].className)}>
          <AlertTriangle className="h-3.5 w-3.5" /> {RISK_META[task.risk_level].label}
        </span>
      </div>

      {task.equipment.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          <span className="truncate">{task.equipment.join(", ")}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3">
        {engineers.length > 0 ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex -space-x-2">
              {engineers.slice(0, 4).map((e, i) => (
                <Avatar key={i} className="h-7 w-7 ring-2 ring-background">
                  <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                    {toInitials(e.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {engineers.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold ring-2 ring-background">
                  +{engineers.length - 4}
                </div>
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-xs font-medium">
                {engineers.map((e) => e.name).join(", ")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {engineers.length > 1 ? `${engineers.length} engineers` : engineers[0].position}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-muted text-[10px] font-semibold">NA</AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium text-muted-foreground">Unassigned</p>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          {(task.images?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ImageIcon className="h-3.5 w-3.5" />
              {task.images.length}
            </span>
          )}
          <Badge variant="secondary" className={cn("text-[11px]", PRIORITY_META[task.priority].className)}>
            {PRIORITY_META[task.priority].label}
          </Badge>
        </div>
      </div>
    </div>

    <TaskDetailDialog task={task} members={members} open={detailOpen} onOpenChange={setDetailOpen} />
    </>
  );


}
