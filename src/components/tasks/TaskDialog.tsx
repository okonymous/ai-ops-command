import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_CATEGORIES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  RISK_LEVELS,
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  RISK_META,
  type TaskRow,
} from "@/lib/constants";
import { toast } from "sonner";

const empty = {
  title: "",
  description: "",
  category: "other",
  priority: "medium",
  status: "planned",
  task_date: "",
  estimated_duration: "",
  risk_level: "low",
  location: "",
  assigned_ids: [] as string[],
  equipment: "",
  required_team: "",
};

export function TaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: TaskRow | null;
}) {
  const { user } = useAuth();
  const { data: members = [] } = useTeamMembers();
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        category: task.category,
        priority: task.priority,
        status: task.status,
        task_date: task.task_date ?? "",
        estimated_duration: task.estimated_duration ?? "",
        risk_level: task.risk_level,
        location: task.location ?? "",
        assigned_ids:
          task.assigned_to_ids?.length
            ? task.assigned_to_ids
            : task.assigned_to
            ? [task.assigned_to]
            : [],
        equipment: task.equipment.join(", "),
        required_team: task.required_team.join(", "),
      });
    } else {
      setForm({ ...empty });
    }
  }, [task, open]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggleEngineer = (id: string) =>
    setForm((f) => ({
      ...f,
      assigned_ids: f.assigned_ids.includes(id)
        ? f.assigned_ids.filter((x) => x !== id)
        : [...f.assigned_ids, id],
    }));

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!user) return;
    setSaving(true);
    const selected = members.filter((m) => form.assigned_ids.includes(m.id));
    const names = selected.map((m) => m.name);
    const payload = {
      title: form.title,
      description: form.description || null,
      category: form.category as TaskRow["category"],
      priority: form.priority as TaskRow["priority"],
      status: form.status as TaskRow["status"],
      task_date: form.task_date || null,
      estimated_duration: form.estimated_duration || null,
      risk_level: form.risk_level as TaskRow["risk_level"],
      location: form.location || null,
      assigned_to_ids: selected.map((m) => m.id),
      assigned_names: names,
      assigned_to: selected[0]?.id ?? null,
      assigned_name: names.join(", ") || null,
      equipment: form.equipment ? form.equipment.split(",").map((s) => s.trim()).filter(Boolean) : [],
      required_team: form.required_team
        ? form.required_team.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    const { error } = task
      ? await supabase.from("tasks").update(payload).eq("id", task.id)
      : await supabase.from("tasks").insert({ ...payload, created_by: user.id });

    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(task ? "Task updated" : "Task created");
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={form.priority} onValueChange={(v) => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_META[p].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Risk">
              <Select value={form.risk_level} onValueChange={(v) => set("risk_level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RISK_LEVELS.map((r) => (
                    <SelectItem key={r} value={r}>{RISK_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={form.task_date} onChange={(e) => set("task_date", e.target.value)} />
            </Field>
            <Field label="Duration">
              <Input placeholder="4 Hours" value={form.estimated_duration} onChange={(e) => set("estimated_duration", e.target.value)} />
            </Field>
          </div>

          <Field label="Assigned Engineer">
            <Select value={form.assigned_to} onValueChange={(v) => set("assigned_to", v)}>
              <SelectTrigger><SelectValue placeholder="Select engineer" /></SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} — {m.position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Location">
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Data Center / Kantor Pusat" />
          </Field>
          <Field label="Equipment (comma separated)">
            <Input value={form.equipment} onChange={(e) => set("equipment", e.target.value)} placeholder="Console Cable, Laptop" />
          </Field>
          <Field label="Required Team (comma separated)">
            <Input value={form.required_team} onChange={(e) => set("required_team", e.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
