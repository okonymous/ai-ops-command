import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TaskRow, TeamMemberRow } from "@/lib/constants";

export function useTasks() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`tasks-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["tasks"],
    queryFn: async (): Promise<TaskRow[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("task_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeamMembers() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`team-changes-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "team_members" }, () => {
        qc.invalidateQueries({ queryKey: ["team_members"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: ["team_members"],
    queryFn: async (): Promise<TeamMemberRow[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type Workload = {
  member: TeamMemberRow;
  total: number;
  open: number;
  completed: number;
  overdue: number;
  utilization: number;
};

export function computeWorkloads(members: TeamMemberRow[], tasks: TaskRow[]): Workload[] {
  return members
    .map((member) => {
      const mine = tasks.filter((t) => t.assigned_to === member.id);
      const open = mine.filter((t) => t.status === "planned" || t.status === "in_progress").length;
      const completed = mine.filter((t) => t.status === "completed").length;
      const overdue = mine.filter((t) => t.status === "overdue").length;
      const utilization = Math.min(100, Math.round((open * 25)));
      return { member, total: mine.length, open, completed, overdue, utilization };
    })
    .sort((a, b) => b.utilization - a.utilization);
}
