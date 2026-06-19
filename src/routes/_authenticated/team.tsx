import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Mail, Phone, Trash2, Users, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTasks, useTeamMembers, computeWorkloads } from "@/hooks/useData";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team")({
  component: TeamPage,
});

const SAMPLE = [
  { name: "Ocky Arfian", position: "System Engineer", department: "Infrastructure", skills: ["VMware", "Windows Server", "Linux", "Datacenter", "Storage", "Backup"], email: "ocky@company.com", phone: "0812-1111-2222", manager: "IT Manager" },
  { name: "Andi Pratama", position: "Network Engineer", department: "Network", skills: ["Firewall", "Router", "Switch", "VPN", "Fortigate", "Cisco"], email: "andi@company.com", phone: "0812-3333-4444", manager: "IT Manager" },
  { name: "Budi Santoso", position: "Security Engineer", department: "Security", skills: ["Security Audit", "SIEM", "Firewall", "Penetration Testing"], email: "budi@company.com", phone: "0812-5555-6666", manager: "Team Lead" },
  { name: "Sari Wijaya", position: "Cloud Engineer", department: "Cloud", skills: ["Azure", "AWS", "Kubernetes", "Terraform"], email: "sari@company.com", phone: "0812-7777-8888", manager: "IT Manager" },
];

function TeamPage() {
  const { data: members = [] } = useTeamMembers();
  const { data: tasks = [] } = useTasks();
  const { hasRole } = useAuth();
  const canManage = hasRole("admin", "it_manager", "team_lead");
  const [open, setOpen] = useState(false);
  const workloads = computeWorkloads(members, tasks);

  const seed = async () => {
    const { error } = await supabase.from("team_members").insert(SAMPLE);
    if (error) toast.error(error.message);
    else toast.success("Sample team added");
  };

  return (
    <div>
      <PageHeader
        title="Team Members"
        description="Engineers, skills, and live workload utilization."
        actions={
          canManage && (
            <div className="flex gap-2">
              {members.length === 0 && (
                <Button variant="outline" onClick={seed} className="gap-2">
                  <Sparkles className="h-4 w-4" /> Add Sample Team
                </Button>
              )}
              <Button onClick={() => setOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Add Member
              </Button>
            </div>
          )
        }
      />

      {members.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No team members yet. Add engineers so the AI can assign tasks by skill.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workloads.map(({ member, total, open: openTasks, completed, overdue, utilization }) => {
            const initials = member.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
            const utilColor =
              utilization >= 80 ? "text-destructive" : utilization >= 50 ? "text-warning" : "text-success";
            return (
              <div key={member.id} className="glass-strong rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.photo_url ?? undefined} />
                    <AvatarFallback className="bg-primary/15 font-semibold text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-display font-semibold">{member.name}</h3>
                      {canManage && (
                        <button
                          onClick={async () => {
                            const { error } = await supabase.from("team_members").delete().eq("id", member.id);
                            if (error) toast.error(error.message);
                            else toast.success("Member removed");
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{member.position} • {member.department}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className={cn("font-semibold", utilColor)}>{utilization}%</span>
                  </div>
                  <Progress value={utilization} />
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  <Stat label="Total" value={total} />
                  <Stat label="Open" value={openTasks} />
                  <Stat label="Done" value={completed} />
                  <Stat label="Overdue" value={overdue} accent={overdue > 0 ? "text-destructive" : ""} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {member.skills.slice(0, 6).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>

                <div className="mt-3 flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
                  {member.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {member.email}</span>}
                  {member.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {member.phone}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <MemberDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 py-2">
      <p className={cn("font-display text-lg font-bold", accent)}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function MemberDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [form, setForm] = useState({ name: "", position: "", department: "", email: "", phone: "", employee_id: "", manager: "", skills: "" });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.from("team_members").insert({
      name: form.name,
      position: form.position || null,
      department: form.department || null,
      email: form.email || null,
      phone: form.phone || null,
      employee_id: form.employee_id || null,
      manager: form.manager || null,
      skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Member added");
    setForm({ name: "", position: "", department: "", email: "", phone: "", employee_id: "", manager: "", skills: "" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {[
            ["name", "Full Name"],
            ["position", "Position"],
            ["department", "Department"],
            ["employee_id", "Employee ID"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["manager", "Manager"],
          ].map(([k, label]) => (
            <div key={k} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input value={(form as Record<string, string>)[k]} onChange={(e) => set(k, e.target.value)} />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label className="text-xs">Skills (comma separated)</Label>
            <Input value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="VMware, Linux, Backup" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
