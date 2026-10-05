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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_generation_runs: {
        Row: {
          attempt_id: string | null
          correlation_id: string | null
          created_at: string
          duration_ms: number
          error_code: string | null
          error_message: string | null
          estimated_cost_usd: number | null
          id: string
          input_characters: number
          input_tokens: number | null
          material_id: string | null
          model: string
          output_tokens: number | null
          prompt_version: string
          provider: string
          provider_attempt: number
          quality: Json | null
          schema_version: string
          stage: string
          status: string
          user_id: string
        }
        Insert: {
          attempt_id?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms: number
          error_code?: string | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_characters?: number
          input_tokens?: number | null
          material_id?: string | null
          model: string
          output_tokens?: number | null
          prompt_version: string
          provider: string
          provider_attempt: number
          quality?: Json | null
          schema_version: string
          stage: string
          status: string
          user_id: string
        }
        Update: {
          attempt_id?: string | null
          correlation_id?: string | null
          created_at?: string
          duration_ms?: number
          error_code?: string | null
          error_message?: string | null
          estimated_cost_usd?: number | null
          id?: string
          input_characters?: number
          input_tokens?: number | null
          material_id?: string | null
          model?: string
          output_tokens?: number | null
          prompt_version?: string
          provider?: string
          provider_attempt?: number
          quality?: Json | null
          schema_version?: string
          stage?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_runs_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "processing_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_runs_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          content_url: string | null
          created_at: string
          failure_code: string | null
          failure_message: string | null
          file_name: string | null
          file_size_bytes: number | null
          flashcards: Json | null
          generation_metadata: Json | null
          id: string
          is_processed: boolean | null
          material_type: string
          mime_type: string | null
          page_count: number | null
          quizzes: Json | null
          status: Database["public"]["Enums"]["material_status"]
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_url?: string | null
          created_at?: string
          failure_code?: string | null
          failure_message?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          flashcards?: Json | null
          generation_metadata?: Json | null
          id?: string
          is_processed?: boolean | null
          material_type: string
          mime_type?: string | null
          page_count?: number | null
          quizzes?: Json | null
          status?: Database["public"]["Enums"]["material_status"]
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_url?: string | null
          created_at?: string
          failure_code?: string | null
          failure_message?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          flashcards?: Json | null
          generation_metadata?: Json | null
          id?: string
          is_processed?: boolean | null
          material_type?: string
          mime_type?: string | null
          page_count?: number | null
          quizzes?: Json | null
          status?: Database["public"]["Enums"]["material_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_events: {
        Row: {
          attempt_id: string | null
          correlation_id: string
          created_at: string
          duration_ms: number | null
          error_code: string | null
          event_name: string
          id: number
          material_id: string | null
          metadata: Json
          severity: string
          source: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          attempt_id?: string | null
          correlation_id: string
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          event_name: string
          id?: never
          material_id?: string | null
          metadata?: Json
          severity: string
          source: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          attempt_id?: string | null
          correlation_id?: string
          created_at?: string
          duration_ms?: number | null
          error_code?: string | null
          event_name?: string
          id?: never
          material_id?: string | null
          metadata?: Json
          severity?: string
          source?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operational_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "processing_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_events_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_entitlements: {
        Row: {
          chat_message_limit: number
          generation_limit: number
          max_file_bytes: number
          max_pages_per_document: number
          page_limit: number
          plan_type: string
          updated_at: string
        }
        Insert: {
          chat_message_limit: number
          generation_limit: number
          max_file_bytes: number
          max_pages_per_document: number
          page_limit: number
          plan_type: string
          updated_at?: string
        }
        Update: {
          chat_message_limit?: number
          generation_limit?: number
          max_file_bytes?: number
          max_pages_per_document?: number
          page_limit?: number
          plan_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      processing_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          event_id: string | null
          failure_code: string | null
          failure_message: string | null
          finished_at: string | null
          generation_reserved: boolean
          heartbeat_at: string | null
          id: string
          idempotency_key: string
          material_id: string
          page_count: number
          quota_released_at: string | null
          reserved_pages: number
          retryable: boolean
          started_at: string | null
          status: Database["public"]["Enums"]["processing_attempt_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          event_id?: string | null
          failure_code?: string | null
          failure_message?: string | null
          finished_at?: string | null
          generation_reserved?: boolean
          heartbeat_at?: string | null
          id?: string
          idempotency_key: string
          material_id: string
          page_count?: number
          quota_released_at?: string | null
          reserved_pages?: number
          retryable?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_attempt_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          event_id?: string | null
          failure_code?: string | null
          failure_message?: string | null
          finished_at?: string | null
          generation_reserved?: boolean
          heartbeat_at?: string | null
          id?: string
          idempotency_key?: string
          material_id?: string
          page_count?: number
          quota_released_at?: string | null
          reserved_pages?: number
          retryable?: boolean
          started_at?: string | null
          status?: Database["public"]["Enums"]["processing_attempt_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_attempts_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agent_message_count: number | null
          created_at: string
          current_streak: number
          full_name: string | null
          generation_count: number | null
          highest_streak: number
          id: string
          last_active_date: string | null
          last_message_date: string | null
          plan_type: string | null
          timezone: string
          total_xp: number
          updated_at: string
        }
        Insert: {
          agent_message_count?: number | null
          created_at?: string
          current_streak?: number
          full_name?: string | null
          generation_count?: number | null
          highest_streak?: number
          id: string
          last_active_date?: string | null
          last_message_date?: string | null
          plan_type?: string | null
          timezone?: string
          total_xp?: number
          updated_at?: string
        }
        Update: {
          agent_message_count?: number | null
          created_at?: string
          current_streak?: number
          full_name?: string | null
          generation_count?: number | null
          highest_streak?: number
          id?: string
          last_active_date?: string | null
          last_message_date?: string | null
          plan_type?: string | null
          timezone?: string
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
      }
      quiz_scores: {
        Row: {
          created_at: string
          id: string
          learner_local_date: string | null
          learner_timezone: string | null
          lesson_id: string
          mutation_key: string | null
          percentage: number
          score: number
          total_questions: number
          user_id: string
          xp_awarded: number
        }
        Insert: {
          created_at?: string
          id?: string
          learner_local_date?: string | null
          learner_timezone?: string | null
          lesson_id: string
          mutation_key?: string | null
          percentage: number
          score: number
          total_questions: number
          user_id: string
          xp_awarded?: number
        }
        Update: {
          created_at?: string
          id?: string
          learner_local_date?: string | null
          learner_timezone?: string | null
          lesson_id?: string
          mutation_key?: string | null
          percentage?: number
          score?: number
          total_questions?: number
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_ledger: {
        Row: {
          consumed_at: string | null
          expired_at: string | null
          id: string
          metadata: Json
          mutation_key: string
          refunded_at: string | null
          related_id: string | null
          reserved_at: string
          resource: Database["public"]["Enums"]["usage_resource"]
          state: Database["public"]["Enums"]["usage_state"]
          units: number
          user_id: string
          window_ends_at: string
          window_started_at: string
        }
        Insert: {
          consumed_at?: string | null
          expired_at?: string | null
          id?: string
          metadata?: Json
          mutation_key: string
          refunded_at?: string | null
          related_id?: string | null
          reserved_at?: string
          resource: Database["public"]["Enums"]["usage_resource"]
          state?: Database["public"]["Enums"]["usage_state"]
          units: number
          user_id: string
          window_ends_at: string
          window_started_at: string
        }
        Update: {
          consumed_at?: string | null
          expired_at?: string | null
          id?: string
          metadata?: Json
          mutation_key?: string
          refunded_at?: string | null
          related_id?: string | null
          reserved_at?: string
          resource?: Database["public"]["Enums"]["usage_resource"]
          state?: Database["public"]["Enums"]["usage_state"]
          units?: number
          user_id?: string
          window_ends_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          created_at: string
          page_pool_reset_at: string | null
          updated_at: string
          user_id: string
          weekly_pages_used: number | null
        }
        Insert: {
          created_at?: string
          page_pool_reset_at?: string | null
          updated_at?: string
          user_id: string
          weekly_pages_used?: number | null
        }
        Update: {
          created_at?: string
          page_pool_reset_at?: string | null
          updated_at?: string
          user_id?: string
          weekly_pages_used?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_material_retry_attempt: {
        Args: {
          p_idempotency_key: string
          p_material_id: string
          p_user_id: string
        }
        Returns: {
          attempt_id: string
          attempt_status: Database["public"]["Enums"]["processing_attempt_status"]
          material_id: string
        }[]
      }
      get_operational_health: { Args: { p_hours?: number }; Returns: Json }
      get_usage_summary: { Args: { p_user_id: string }; Returns: Json }
      purge_expired_operational_data: {
        Args: { p_ai_retention_days?: number; p_event_retention_days?: number }
        Returns: Json
      }
      record_operational_event: {
        Args: {
          p_attempt_id?: string
          p_correlation_id: string
          p_duration_ms?: number
          p_error_code?: string
          p_event_name: string
          p_material_id?: string
          p_metadata?: Json
          p_severity: string
          p_source: string
          p_status?: string
          p_user_id?: string
        }
        Returns: number
      }
      record_quiz_progress: {
        Args: {
          p_lesson_id: string
          p_mutation_key: string
          p_score: number
          p_timezone: string
          p_total_questions: number
          p_user_id: string
          p_xp_awarded: number
        }
        Returns: Json
      }
      register_material_attempt: {
        Args: {
          p_file_name: string
          p_file_size_bytes: number
          p_idempotency_key: string
          p_mime_type: string
          p_storage_path: string
          p_title: string
          p_user_id: string
        }
        Returns: {
          attempt_id: string
          attempt_status: Database["public"]["Enums"]["processing_attempt_status"]
          material_id: string
        }[]
      }
      reserve_and_queue_material: {
        Args: { p_attempt_id: string; p_page_count: number; p_user_id: string }
        Returns: {
          attempt_id: string
          material_id: string
          plan_type: string
          queue_status: string
        }[]
      }
      reserve_usage: {
        Args: {
          p_metadata?: Json
          p_mutation_key: string
          p_related_id?: string
          p_resource: Database["public"]["Enums"]["usage_resource"]
          p_units: number
          p_user_id: string
        }
        Returns: {
          consumed_at: string | null
          expired_at: string | null
          id: string
          metadata: Json
          mutation_key: string
          refunded_at: string | null
          related_id: string | null
          reserved_at: string
          resource: Database["public"]["Enums"]["usage_resource"]
          state: Database["public"]["Enums"]["usage_state"]
          units: number
          user_id: string
          window_ends_at: string
          window_started_at: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_processing_attempt_state: {
        Args: {
          p_attempt_id: string
          p_event_id?: string
          p_failure_code?: string
          p_failure_message?: string
          p_retryable?: boolean
          p_status: Database["public"]["Enums"]["processing_attempt_status"]
        }
        Returns: undefined
      }
      settle_usage: {
        Args: {
          p_mutation_key: string
          p_resource: Database["public"]["Enums"]["usage_resource"]
          p_state: Database["public"]["Enums"]["usage_state"]
          p_user_id: string
        }
        Returns: {
          consumed_at: string | null
          expired_at: string | null
          id: string
          metadata: Json
          mutation_key: string
          refunded_at: string | null
          related_id: string | null
          reserved_at: string
          resource: Database["public"]["Enums"]["usage_resource"]
          state: Database["public"]["Enums"]["usage_state"]
          units: number
          user_id: string
          window_ends_at: string
          window_started_at: string
        }
        SetofOptions: {
          from: "*"
          to: "usage_ledger"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      material_status:
        | "UPLOADED"
        | "QUEUED"
        | "PARSING_DOCUMENT"
        | "GENERATING_SUMMARY"
        | "BUILDING_ASSESSMENTS"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
      processing_attempt_status:
        | "REGISTERED"
        | "QUEUED"
        | "RUNNING"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
        | "DEAD_LETTER"
      usage_resource: "generation" | "pages" | "chat_message"
      usage_state: "RESERVED" | "CONSUMED" | "REFUNDED" | "EXPIRED"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      material_status: [
        "UPLOADED",
        "QUEUED",
        "PARSING_DOCUMENT",
        "GENERATING_SUMMARY",
        "BUILDING_ASSESSMENTS",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
      ],
      processing_attempt_status: [
        "REGISTERED",
        "QUEUED",
        "RUNNING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "DEAD_LETTER",
      ],
      usage_resource: ["generation", "pages", "chat_message"],
      usage_state: ["RESERVED", "CONSUMED", "REFUNDED", "EXPIRED"],
    },
  },
} as const
