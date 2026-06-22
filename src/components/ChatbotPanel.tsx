import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  Check,
  CalendarDays,
  User as UserIcon,
  ShieldAlert,
} from "lucide-react";
import { parseTask } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTeamMembers } from "@/hooks/useData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  PRIORITY_META,
  STATUS_META,
  type TaskCategory,
  type TaskPriority,
  type TaskStatus,
  type RiskLevel,
} from "@/lib/constants";
import { toast } from "sonner";

type ParsedTask = {
  title: string;
  description: string;
  date: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  risk_level: RiskLevel;
  estimated_duration: string;
  location: string | null;
  equipment: string[];
  required_team: string[];
  assigned_member_ids: string[];
  assigned_names: string[];
  assignment_reason: string;
};


type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text?: string;
  task?: ParsedTask;
  created?: boolean;
};

const SUGGESTIONS = [
  "20 Juni 2026 instalasi firewall Fortigate di Kantor Pusat oleh Andi",
  "Besok maintenance VMware Cluster oleh Ocky",
  "30 Juni verifikasi backup Veeam",
  "Jumat audit keamanan server",
];

export function ChatbotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { data: members = [] } = useTeamMembers();
  const callParse = useServerFn(parseTask);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hi! Describe any IT activity in plain language (Indonesian or English) and I'll build a structured task — assigning the right engineer, scheduling it, and setting priority automatically.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const handleSend = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const result = (await callParse({
        data: {
          text,
          today: format(new Date(), "yyyy-MM-dd"),
          members: members.map((m) => ({ id: m.id, name: m.name, position: m.position, skills: m.skills })),
        },
      })) as ParsedTask;

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Here's the task I extracted. Review and create it:",
          task: result,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", text: `⚠️ ${(e as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (msgId: string, task: ParsedTask) => {
    if (!user) return;
    setCreating(msgId);
    // Keep only ids that match a real team member.
    const validIds = (task.assigned_member_ids ?? []).filter((id) =>
      members.some((m) => m.id === id),
    );
    const validNames = validIds.length
      ? validIds.map((id) => members.find((m) => m.id === id)?.name ?? "")
      : task.assigned_names ?? [];
    const { error } = await supabase.from("tasks").insert({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      task_date: task.date,
      estimated_duration: task.estimated_duration,
      risk_level: task.risk_level,
      equipment: task.equipment ?? [],
      required_team: task.required_team ?? [],
      location: task.location,
      assigned_to_ids: validIds,
      assigned_names: validNames,
      assigned_to: validIds[0] ?? null,
      assigned_name: validNames.join(", ") || null,
      assignment_reason: task.assignment_reason,
      created_by: user.id,
    });
    setCreating(null);
    if (error) return toast.error(error.message);

    toast.success(`Task created: ${task.title}`);
    setMessages((m) => m.map((x) => (x.id === msgId ? { ...x, created: true } : x)));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-strong relative flex h-full w-full flex-col rounded-none shadow-2xl sm:w-[420px] sm:rounded-2xl">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold">AI Task Assistant</p>
            <p className="text-[11px] text-muted-foreground">Natural language → structured tasks</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[90%] space-y-2", msg.role === "user" && "items-end")}>
                {msg.text && (
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {msg.text}
                  </div>
                )}
                {msg.task && <TaskPreview task={msg.task} />}
                {msg.task && (
                  <Button
                    size="sm"
                    className="w-full gap-2"
                    disabled={msg.created || creating === msg.id}
                    onClick={() => handleCreate(msg.id, msg.task!)}
                    variant={msg.created ? "secondary" : "default"}
                  >
                    {creating === msg.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : msg.created ? (
                      <>
                        <Check className="h-4 w-4" /> Task Created
                      </>
                    ) : (
                      "Create Task"
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing & building task...
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="rounded-full border bg-background/50 px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {s.length > 36 ? s.slice(0, 36) + "…" : s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t p-3">
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="e.g. 22 Juni upgrade VMware Cluster oleh Ocky"
              rows={2}
              className="resize-none pr-12"
            />
            <Button
              size="icon"
              className="absolute bottom-2 right-2 h-8 w-8"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskPreview({ task }: { task: ParsedTask }) {
  const cat = CATEGORY_META[task.category] ?? CATEGORY_META.other;
  const status = STATUS_META[task.status] ?? STATUS_META.planned;
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold leading-tight">{task.title}</p>
        <Badge variant="secondary" className={cn(status.bg, status.text, "shrink-0")}>
          {status.label}
        </Badge>
      </div>
      {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{cat.label}</Badge>
        <Badge variant="secondary" className={PRIORITY_META[task.priority]?.className}>
          {PRIORITY_META[task.priority]?.label} priority
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
        {task.date && (
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" /> {task.date} • {task.estimated_duration}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <UserIcon className="h-3.5 w-3.5" />{" "}
          {task.assigned_names?.length ? task.assigned_names.join(", ") : "Unassigned"}
          {task.assignment_reason && (
            <span className="text-foreground/60">— {task.assignment_reason}</span>
          )}
        </span>

        {task.location && (
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" /> {task.location}
          </span>
        )}
      </div>
      {task.equipment?.length > 0 && (
        <p className="text-[11px] text-muted-foreground">Equipment: {task.equipment.join(", ")}</p>
      )}
    </div>
  );
}
