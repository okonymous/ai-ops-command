export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_settings: {
        Row: {
          config: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_name: string | null
          assigned_names: string[]
          assigned_to: string | null
          assigned_to_ids: string[]
          assignment_reason: string | null
          category: Database["public"]["Enums"]["task_category"]
          created_at: string
          created_by: string | null
          description: string | null
          equipment: string[]
          estimated_duration: string | null
          id: string
          images: string[]
          location: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          required_team: string[]
          risk_level: Database["public"]["Enums"]["risk_level"]
          status: Database["public"]["Enums"]["task_status"]
          task_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_name?: string | null
          assigned_names?: string[]
          assigned_to?: string | null
          assigned_to_ids?: string[]
          assignment_reason?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string[]
          estimated_duration?: string | null
          id?: string
          images?: string[]
          location?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          required_team?: string[]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["task_status"]
          task_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_name?: string | null
          assigned_names?: string[]
          assigned_to?: string | null
          assigned_to_ids?: string[]
          assignment_reason?: string | null
          category?: Database["public"]["Enums"]["task_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: string[]
          estimated_duration?: string | null
          id?: string
          images?: string[]
          location?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          required_team?: string[]
          risk_level?: Database["public"]["Enums"]["risk_level"]
          status?: Database["public"]["Enums"]["task_status"]
          task_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          availability: string
          created_at: string
          department: string | null
          email: string | null
          employee_id: string | null
          id: string
          manager: string | null
          name: string
          phone: string | null
          photo_url: string | null
          position: string | null
          skills: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          availability?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          manager?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          availability?: string
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          manager?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          skills?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "it_manager" | "team_lead" | "engineer" | "viewer"
      risk_level: "low" | "medium" | "high"
      task_category:
        | "network"
        | "server"
        | "datacenter"
        | "virtualization"
        | "storage"
        | "backup"
        | "cloud"
        | "security"
        | "helpdesk"
        | "application"
        | "database"
        | "other"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status:
        | "planned"
        | "in_progress"
        | "completed"
        | "overdue"
        | "cancelled"
        | "on_hold"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "it_manager", "team_lead", "engineer", "viewer"],
      risk_level: ["low", "medium", "high"],
      task_category: [
        "network",
        "server",
        "datacenter",
        "virtualization",
        "storage",
        "backup",
        "cloud",
        "security",
        "helpdesk",
        "application",
        "database",
        "other",
      ],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: [
        "planned",
        "in_progress",
        "completed",
        "overdue",
        "cancelled",
        "on_hold",
      ],
    },
  },
} as const
