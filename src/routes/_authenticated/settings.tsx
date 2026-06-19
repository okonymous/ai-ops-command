import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Save, Users2, Bell, Palette, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_META, type AppRole } from "@/lib/constants";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type UserRow = { id: string; full_name: string | null; email: string | null; role: AppRole | null };

function SettingsPage() {
  const { profile, user, hasRole, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [notif, setNotif] = useState({ inApp: true, email: true, telegram: false, whatsapp: false, dueReminder: true, overdue: true });
  const isAdmin = hasRole("admin");

  useEffect(() => setName(profile?.full_name ?? ""), [profile]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", user.id);
    if (error) toast.error(error.message);
    else { toast.success("Profile updated"); refresh(); }
  };

  return (
    <div>
      <PageHeader title="System Settings" description="Profile, appearance, notifications, and access control." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card icon={Users2} title="Profile">
          <div className="space-y-1.5">
            <Label className="text-xs">Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <Button onClick={saveProfile} size="sm" className="gap-2"><Save className="h-4 w-4" /> Save Profile</Button>
        </Card>

        <Card icon={Palette} title="Appearance">
          <div className="space-y-1.5">
            <Label className="text-xs">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light" | "system")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card icon={Bell} title="Notifications">
          {([
            ["inApp", "In-App Notifications"],
            ["email", "Email Notifications"],
            ["telegram", "Telegram Notifications"],
            ["whatsapp", "WhatsApp Webhook"],
            ["dueReminder", "Task Due Reminder"],
            ["overdue", "Overdue Reminder"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-sm font-normal">{label}</Label>
              <Switch checked={notif[key]} onCheckedChange={(v) => setNotif((n) => ({ ...n, [key]: v }))} />
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => toast.success("Notification preferences saved")}>Save Preferences</Button>
        </Card>

        {isAdmin && <RoleManager />}
      </div>
    </div>
  );
}

function RoleManager() {
  const [users, setUsers] = useState<UserRow[]>([]);

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role as AppRole]));
    setUsers((profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? null })));
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, role: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); load(); }
  };

  return (
    <Card icon={ShieldCheck} title="Access Control (Admin)">
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border p-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{u.full_name || "Unnamed"}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {u.role && <Badge variant="secondary" className={ROLE_META[u.role].className}>{ROLE_META[u.role].label}</Badge>}
              <Select value={u.role ?? undefined} onValueChange={(v) => changeRole(u.id, v as AppRole)}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Set role" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_META) as AppRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_META[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Users2; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-strong space-y-4 rounded-2xl p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="font-display font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}
