// Supabase Edge Function to list failed migrations

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase credentials from environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    // Log credential availability for debugging
    console.log(`Supabase URL available: ${!!supabaseUrl}`);
    console.log(`Supabase Service Key available: ${!!supabaseServiceKey}`);

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not found");
    }

    // Create Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client created successfully");

    // Query the migrations table to find failed migrations
    const { data, error } = await supabase.rpc("list_failed_migrations");

    if (error) {
      // If the RPC function doesn't exist, try a direct SQL query
      console.log("RPC failed, trying direct query");

      // Execute a raw SQL query to get failed migrations
      const { data: sqlData, error: sqlError } = await supabase
        .from("supabase_migrations.migrations")
        .select("*")
        .not("status", "eq", "applied");

      if (sqlError) {
        throw new Error(`Error querying migrations: ${sqlError.message}`);
      }

      return new Response(
        JSON.stringify({
          message: "Failed migrations retrieved via direct query",
          migrations: sqlData || [],
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Failed migrations retrieved",
        migrations: data || [],
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error listing failed migrations:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
