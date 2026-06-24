import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  MapPin,
  AlertTriangle,
  Wrench,
  Users,
  ImagePlus,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  STATUS_META,
  PRIORITY_META,
  CATEGORY_META,
  RISK_META,
  type TaskRow,
  type TeamMemberRow,
} from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BUCKET = "task-attachments";

export function TaskDetailDialog({
  task,
  members,
  open,
  onOpenChange,
}: {
  task: TaskRow;
  members: TeamMemberRow[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { canEdit } = useAuth();
  const status = STATUS_META[task.status];
  const cat = CATEGORY_META[task.category];

  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const images = task.images ?? [];

  useEffect(() => {
    if (!open || images.length === 0) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(images, 3600);
      if (error || !data || !active) return;
      const map: Record<string, string> = {};
      data.forEach((d) => {
        if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
      });
      setUrls(map);
    })();
    return () => {
      active = false;
    };
  }, [open, images.join(",")]);

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
  const engineers = assignedIds.length
    ? assignedIds.map((id, i) => {
        const m = members.find((mm) => mm.id === id);
        return { name: m?.name ?? assignedNames[i] ?? "NA", position: m?.position ?? "Engineer" };
      })
    : assignedNames.map((n) => ({ name: n, position: "Engineer" }));

  const toInitials = (name: string) =>
    name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setUploading(true);
    try {
      const newPaths: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        const ext = file.name.split(".").pop() || "png";
        const path = `${task.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          contentType: file.type,
        });
        if (error) {
          toast.error(error.message);
          continue;
        }
        newPaths.push(path);
      }
      if (newPaths.length > 0) {
        const next = [...images, ...newPaths];
        const { error } = await supabase.from("tasks").update({ images: next }).eq("id", task.id);
        if (error) toast.error(error.message);
        else toast.success("Image attached");
      }
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async (path: string) => {
    setRemoving(path);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      const next = images.filter((p) => p !== path);
      const { error } = await supabase.from("tasks").update({ images: next }).eq("id", task.id);
      if (error) toast.error(error.message);
      else toast.success("Image removed");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn(status.bg, status.text, "text-[11px]")}>
                {status.label}
              </Badge>
              <Badge variant="outline" className="text-[11px]">{cat.label}</Badge>
              <Badge variant="secondary" className={cn("text-[11px]", PRIORITY_META[task.priority].className)}>
                {PRIORITY_META[task.priority].label}
              </Badge>
            </div>
            <DialogTitle className="mt-1 text-left text-xl">{task.title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {task.description && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {task.task_date && (
                <Detail icon={<CalendarDays className="h-4 w-4" />} label="Date">
                  {format(new Date(task.task_date + "T00:00:00"), "dd MMM yyyy")}
                </Detail>
              )}
              {task.estimated_duration && (
                <Detail icon={<Clock className="h-4 w-4" />} label="Duration">
                  {task.estimated_duration}
                </Detail>
              )}
              {task.location && (
                <Detail icon={<MapPin className="h-4 w-4" />} label="Location">
                  {task.location}
                </Detail>
              )}
              <Detail
                icon={<AlertTriangle className={cn("h-4 w-4", RISK_META[task.risk_level].className)} />}
                label="Risk"
              >
                <span className={RISK_META[task.risk_level].className}>{RISK_META[task.risk_level].label}</span>
              </Detail>
            </div>

            {task.equipment.length > 0 && (
              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Wrench className="h-3.5 w-3.5" /> Equipment
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {task.equipment.map((eq, i) => (
                    <Badge key={i} variant="outline" className="text-[11px]">{eq}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Assigned Engineers
              </p>
              {engineers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {engineers.map((e, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
                          {toInitials(e.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <p className="text-xs font-medium">{e.name}</p>
                        <p className="text-[11px] text-muted-foreground">{e.position}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </div>

            {task.assignment_reason && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <p className="mb-1 text-xs font-medium text-muted-foreground">AI Assignment Reason</p>
                {task.assignment_reason}
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ImagePlus className="h-3.5 w-3.5" /> Attachments ({images.length})
                </p>
                {canEdit && (
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUpload}
                      disabled={uploading}
                    />
                    <Button asChild size="sm" variant="outline" className="gap-1.5" disabled={uploading}>
                      <span>
                        {uploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5" />
                        )}
                        Attach Image
                      </span>
                    </Button>
                  </label>
                )}
              </div>

              {images.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No images attached yet.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {images.map((path) => (
                    <div key={path} className="group relative aspect-square overflow-hidden rounded-lg border">
                      {urls[path] ? (
                        <img
                          src={urls[path]}
                          alt="Task attachment"
                          className="h-full w-full cursor-pointer object-cover"
                          onClick={() => setPreview(urls[path])}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => removeImage(path)}
                          disabled={removing === path}
                          className="absolute right-1 top-1 rounded-md bg-background/80 p-1 text-destructive opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                          title="Remove image"
                        >
                          {removing === path ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setPreview(null)}
        >
          <button className="absolute right-4 top-4 rounded-md bg-background/20 p-2 text-white">
            <X className="h-5 w-5" />
          </button>
          <img src={preview} alt="Preview" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="leading-tight">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="font-medium">{children}</p>
      </div>
    </div>
  );
}
