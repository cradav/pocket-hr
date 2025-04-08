import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";

export async function testSupabaseConnection() {
  try {
    if (!supabase) {
      return {
        success: false,
        message: "Connection service not initialized",
      };
    }

    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      logger.error("Connection test failed", error);
      return { success: false, message: "Connection test failed" };
    }

    logger.debug("Connection test successful");
    return { success: true, message: "Connection successful" };
  } catch (err) {
    logger.error("Connection test error", err);
    return {
      success: false,
      message: "Unable to test connection"
    };
  }
}
