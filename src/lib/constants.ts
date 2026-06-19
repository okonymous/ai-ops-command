import type { Database } from "@/integrations/supabase/types";

export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TeamMemberRow = Database["public"]["Tables"]["team_members"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type TaskCategory = Database["public"]["Enums"]["task_category"];
export type RiskLevel = Database["public"]["Enums"]["risk_level"];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; token: string; text: string; bg: string }
> = {
  planned: { label: "Planned", token: "status-planned", text: "text-status-planned", bg: "bg-status-planned/15" },
  in_progress: { label: "In Progress", token: "status-progress", text: "text-status-progress", bg: "bg-status-progress/15" },
  completed: { label: "Completed", token: "status-completed", text: "text-status-completed", bg: "bg-status-completed/15" },
  overdue: { label: "Overdue", token: "status-overdue", text: "text-status-overdue", bg: "bg-status-overdue/15" },
  cancelled: { label: "Cancelled", token: "status-cancelled", text: "text-status-cancelled", bg: "bg-status-cancelled/15" },
  on_hold: { label: "On Hold", token: "status-cancelled", text: "text-muted-foreground", bg: "bg-muted" },
};

export const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-info/15 text-info" },
  high: { label: "High", className: "bg-warning/20 text-warning" },
  critical: { label: "Critical", className: "bg-destructive/15 text-destructive" },
};

export const RISK_META: Record<RiskLevel, { label: string; className: string }> = {
  low: { label: "Low Risk", className: "text-success" },
  medium: { label: "Medium Risk", className: "text-warning" },
  high: { label: "High Risk", className: "text-destructive" },
};

export const CATEGORY_META: Record<TaskCategory, { label: string; icon: string }> = {
  network: { label: "Network", icon: "Network" },
  server: { label: "Server", icon: "Server" },
  datacenter: { label: "Datacenter", icon: "Building2" },
  virtualization: { label: "Virtualization", icon: "Boxes" },
  storage: { label: "Storage", icon: "HardDrive" },
  backup: { label: "Backup", icon: "DatabaseBackup" },
  cloud: { label: "Cloud", icon: "Cloud" },
  security: { label: "Security", icon: "ShieldCheck" },
  helpdesk: { label: "Helpdesk", icon: "Headset" },
  application: { label: "Application", icon: "AppWindow" },
  database: { label: "Database", icon: "Database" },
  other: { label: "Other", icon: "Wrench" },
};

export const ROLE_META: Record<AppRole, { label: string; className: string }> = {
  admin: { label: "Admin", className: "bg-destructive/15 text-destructive" },
  it_manager: { label: "IT Manager", className: "bg-primary/15 text-primary" },
  team_lead: { label: "Team Lead", className: "bg-info/15 text-info" },
  engineer: { label: "Engineer", className: "bg-success/15 text-success" },
  viewer: { label: "Viewer", className: "bg-muted text-muted-foreground" },
};

export const TASK_STATUSES = Object.keys(STATUS_META) as TaskStatus[];
export const TASK_PRIORITIES = Object.keys(PRIORITY_META) as TaskPriority[];
export const TASK_CATEGORIES = Object.keys(CATEGORY_META) as TaskCategory[];
export const RISK_LEVELS = Object.keys(RISK_META) as RiskLevel[];

export const AI_PROVIDERS = [
  { id: "lovable", name: "Lovable AI (Built-in)", local: false, defaultUrl: "" },
  { id: "openai", name: "OpenAI", local: false, defaultUrl: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic Claude", local: false, defaultUrl: "https://api.anthropic.com/v1" },
  { id: "gemini", name: "Google Gemini", local: false, defaultUrl: "https://generativelanguage.googleapis.com/v1beta" },
  { id: "openrouter", name: "OpenRouter", local: false, defaultUrl: "https://openrouter.ai/api/v1" },
  { id: "groq", name: "Groq", local: false, defaultUrl: "https://api.groq.com/openai/v1" },
  { id: "deepseek", name: "DeepSeek", local: false, defaultUrl: "https://api.deepseek.com/v1" },
  { id: "mistral", name: "Mistral", local: false, defaultUrl: "https://api.mistral.ai/v1" },
  { id: "cohere", name: "Cohere", local: false, defaultUrl: "https://api.cohere.ai/v1" },
  { id: "ollama", name: "Ollama (Local)", local: true, defaultUrl: "http://localhost:11434" },
  { id: "lmstudio", name: "LM Studio (Local)", local: true, defaultUrl: "http://localhost:1234/v1" },
  { id: "openwebui", name: "Open WebUI (Local)", local: true, defaultUrl: "http://localhost:3000/api" },
  { id: "custom", name: "Custom OpenAI-Compatible", local: false, defaultUrl: "" },
] as const;
