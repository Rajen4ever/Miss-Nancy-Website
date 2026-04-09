import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/env";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          clerk_user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          image_url: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          clerk_user_id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          image_url?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          clerk_user_id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          image_url?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          clerk_user_id: string;
          title: string;
          summary: string | null;
          archived: boolean;
          last_message_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          title?: string;
          summary?: string | null;
          archived?: boolean;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          title?: string;
          summary?: string | null;
          archived?: boolean;
          last_message_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          clerk_user_id: string;
          role: "system" | "user" | "assistant" | "tool";
          content: Json;
          model: string | null;
          tool_name: string | null;
          tool_call_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          clerk_user_id: string;
          role: "system" | "user" | "assistant" | "tool";
          content?: Json;
          model?: string | null;
          tool_name?: string | null;
          tool_call_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          clerk_user_id?: string;
          role?: "system" | "user" | "assistant" | "tool";
          content?: Json;
          model?: string | null;
          tool_name?: string | null;
          tool_call_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          clerk_user_id: string;
          name: string;
          slug: string;
          description: string | null;
          status: Database["public"]["Enums"]["project_status"];
          color: string | null;
          metadata: Json;
          archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          name: string;
          slug: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          color?: string | null;
          metadata?: Json;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["project_status"];
          color?: string | null;
          metadata?: Json;
          archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          clerk_user_id: string;
          project_id: string | null;
          created_from_session_id: string | null;
          title: string;
          description: string | null;
          status: Database["public"]["Enums"]["task_status"];
          priority: Database["public"]["Enums"]["task_priority"];
          due_at: string | null;
          completed_at: string | null;
          sort_order: number;
          source: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          project_id?: string | null;
          created_from_session_id?: string | null;
          title: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["task_priority"];
          due_at?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          source?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          project_id?: string | null;
          created_from_session_id?: string | null;
          title?: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          priority?: Database["public"]["Enums"]["task_priority"];
          due_at?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          source?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      memory_items: {
        Row: {
          id: string;
          clerk_user_id: string;
          project_id: string | null;
          session_id: string | null;
          content: string;
          kind: Database["public"]["Enums"]["memory_kind"];
          importance: number;
          source: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          project_id?: string | null;
          session_id?: string | null;
          content: string;
          kind?: Database["public"]["Enums"]["memory_kind"];
          importance?: number;
          source?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          project_id?: string | null;
          session_id?: string | null;
          content?: string;
          kind?: Database["public"]["Enums"]["memory_kind"];
          importance?: number;
          source?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          clerk_user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id: string | null;
          plan_slug: string;
          status: string;
          cancel_at_period_end: boolean;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          stripe_customer_id: string;
          stripe_subscription_id: string;
          stripe_price_id?: string | null;
          plan_slug?: string;
          status: string;
          cancel_at_period_end?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          stripe_customer_id?: string;
          stripe_subscription_id?: string;
          stripe_price_id?: string | null;
          plan_slug?: string;
          status?: string;
          cancel_at_period_end?: boolean;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_submissions: {
        Row: {
          id: string;
          clerk_user_id: string | null;
          full_name: string;
          email: string;
          company: string | null;
          message: string;
          source: string;
          status: Database["public"]["Enums"]["request_status"];
          hubspot_contact_id: string | null;
          hubspot_object_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id?: string | null;
          full_name: string;
          email: string;
          company?: string | null;
          message: string;
          source?: string;
          status?: Database["public"]["Enums"]["request_status"];
          hubspot_contact_id?: string | null;
          hubspot_object_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string | null;
          full_name?: string;
          email?: string;
          company?: string | null;
          message?: string;
          source?: string;
          status?: Database["public"]["Enums"]["request_status"];
          hubspot_contact_id?: string | null;
          hubspot_object_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      demo_requests: {
        Row: {
          id: string;
          clerk_user_id: string | null;
          full_name: string;
          email: string;
          company: string | null;
          role: string | null;
          team_size: string | null;
          use_case: string;
          calendly_event_uri: string | null;
          status: Database["public"]["Enums"]["request_status"];
          hubspot_contact_id: string | null;
          hubspot_object_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id?: string | null;
          full_name: string;
          email: string;
          company?: string | null;
          role?: string | null;
          team_size?: string | null;
          use_case: string;
          calendly_event_uri?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          hubspot_contact_id?: string | null;
          hubspot_object_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string | null;
          full_name?: string;
          email?: string;
          company?: string | null;
          role?: string | null;
          team_size?: string | null;
          use_case?: string;
          calendly_event_uri?: string | null;
          status?: Database["public"]["Enums"]["request_status"];
          hubspot_contact_id?: string | null;
          hubspot_object_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      project_status: "active" | "on_hold" | "completed" | "archived";
      task_status: "todo" | "in_progress" | "blocked" | "done";
      task_priority: "low" | "medium" | "high" | "urgent";
      memory_kind: "general" | "preference" | "fact" | "constraint" | "summary" | "decision";
      request_status: "new" | "in_review" | "scheduled" | "closed" | "spam";
    };
  };
};

export type AppSupabaseClient = SupabaseClient<Database>;

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey =
  typeof window === "undefined" ? env.SUPABASE_SERVICE_ROLE_KEY : undefined;

let browserClient: AppSupabaseClient | undefined;

function buildClientOptions(accessToken?: string) {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      : undefined
  } as const;
}

export function createSupabaseBrowserClient(accessToken?: string): AppSupabaseClient {
  if (accessToken) {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, buildClientOptions(accessToken));
  }

  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, buildClientOptions());
  }

  return browserClient;
}

export async function createSupabaseServerClient(): Promise<AppSupabaseClient> {
  const { auth } = await import("@clerk/nextjs/server");
  const authObject = await auth();

  if (!authObject.userId) {
    throw new Error("Unauthorized");
  }

  const accessToken = await authObject.getToken({
    template: env.CLERK_SUPABASE_JWT_TEMPLATE
  });

  if (!accessToken) {
    throw new Error(
      `Missing Clerk JWT for template "${env.CLERK_SUPABASE_JWT_TEMPLATE}". Configure a Clerk JWT template for Supabase.`
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, buildClientOptions(accessToken));
}

export function createSupabaseAdminClient(): AppSupabaseClient {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is only available on the server.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

export async function getAuthenticatedSupabaseContext() {
  const { auth } = await import("@clerk/nextjs/server");
  const authObject = await auth();

  if (!authObject.userId) {
    throw new Error("Unauthorized");
  }

  const accessToken = await authObject.getToken({
    template: env.CLERK_SUPABASE_JWT_TEMPLATE
  });

  if (!accessToken) {
    throw new Error(
      `Missing Clerk JWT for template "${env.CLERK_SUPABASE_JWT_TEMPLATE}". Configure a Clerk JWT template for Supabase.`
    );
  }

  return {
    userId: authObject.userId,
    supabase: createClient<Database>(supabaseUrl, supabaseAnonKey, buildClientOptions(accessToken))
  };
}
