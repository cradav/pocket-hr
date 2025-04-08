import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Use environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing environment variables"
  );
}

// Create the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Override console.error to prevent sensitive information from being logged
const originalConsoleError = console.error;
console.error = function(...args) {
  // Convert arguments to string to check content
  const errorString = args.join(' ');
  
  // Check if the error message contains sensitive information
  if (errorString.includes(supabaseUrl) || 
      errorString.includes('supabase') || 
      errorString.includes('grant_type') ||
      errorString.includes('subscription')) {
    // Replace with generic message
    originalConsoleError('An authentication error occurred');
    return;
  }
  
  // Pass through other error messages
  originalConsoleError.apply(console, args);
};
