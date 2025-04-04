import { supabase } from "@/lib/supabase";

export async function testSupabaseConnection() {
  try {
    if (!supabase) {
      return {
        success: false,
        message:
          "Supabase client not initialized. Please check your environment variables.",
      };
    }

    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Supabase connection test failed:", error.message);
      return { success: false, message: error.message };
    }

    console.log("Supabase connection successful");
    return { success: true, message: "Connection successful" };
  } catch (err) {
    console.error("Supabase connection test error:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
