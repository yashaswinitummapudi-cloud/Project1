/**
 * supabaseClient.js
 * Frontend Supabase Client Integration.
 * Initializes Supabase using Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
 * Provides realtime case update subscriptions and connection status verification.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isPlaceholder = !supabaseUrl || 
  supabaseUrl.includes("your-project-id") || 
  !supabaseAnonKey || 
  supabaseAnonKey.includes("your-supabase");

export const isSupabaseConfigured = Boolean(!isPlaceholder && supabaseUrl.startsWith("https://"));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Test connectivity from browser to Supabase
 */
export async function testSupabaseConnection() {
  if (!supabase) {
    return {
      connected: false,
      mode: "LOCAL_IN_MEMORY",
      message: "Supabase credentials are placeholder in frontend/.env. Running with local simulated database."
    };
  }

  try {
    const { data, error } = await supabase
      .from("nexus_cases")
      .select("id")
      .limit(1);

    if (error) {
      return {
        connected: false,
        mode: "SUPABASE_ERROR",
        error: error.message
      };
    }

    return {
      connected: true,
      mode: "LIVE_SUPABASE_CLIENT",
      message: "Frontend directly connected to Supabase PostgreSQL."
    };
  } catch (err) {
    return {
      connected: false,
      mode: "NETWORK_ERROR",
      error: err.message
    };
  }
}

/**
 * Subscribe to realtime case changes (INSERT / UPDATE)
 */
export function subscribeToRealtimeCases(callback) {
  if (!supabase) return null;

  const channel = supabase
    .channel("public:nexus_cases")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "nexus_cases" },
      (payload) => {
        console.log("[Supabase Realtime] Case update received:", payload);
        if (callback) callback(payload);
      }
    )
    .subscribe();

  return channel;
}
