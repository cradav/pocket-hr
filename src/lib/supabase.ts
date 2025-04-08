import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

// Use default values for development if environment variables are not set
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Validate URL before creating client
const isValidUrl = supabaseUrl && supabaseUrl.startsWith("https://");

if (!isValidUrl || !supabaseAnonKey) {
  console.warn(
    "Missing or invalid Supabase credentials. Please set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.",
  );
}

// Create a mock client for development if credentials are missing
const createMockClient = () => {
  console.warn("Using mock Supabase client with temporary admin account.");

  // Temporary admin user for testing
  const tempAdminUser = {
    id: "temp-admin-id",
    email: "craig@craig.com",
    user_metadata: {
      name: "Craig Admin",
      role: "admin",
    },
    app_metadata: {
      role: "admin",
    },
  };

  // Mock session for the admin user
  const tempAdminSession = {
    user: tempAdminUser,
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_at: Date.now() + 3600000, // 1 hour from now
  };

  // Track if user is logged in - default to logged in for storyboards
  let currentSession = tempAdminSession;
  let authChangeCallbacks = [];

  return {
    auth: {
      signInWithPassword: ({ email, password }) => {
        // Check if credentials match our temporary admin
        const normalizedEmail = email.toLowerCase();
        console.log(
          `Mock Supabase login attempt: ${normalizedEmail} / ${password}`,
        );
        console.log(`Comparing with: "craig@craig.com" / "12345678"`);

        // Fix: Use case-insensitive comparison and trim any whitespace
        const isEmailMatch = normalizedEmail.trim() === "craig@craig.com";
        const isPasswordMatch = password === "12345678";
        console.log(
          `Email match: ${isEmailMatch}, Password match: ${isPasswordMatch}`,
        );

        if (isEmailMatch && isPasswordMatch) {
          currentSession = tempAdminSession;

          // Notify listeners of auth change
          authChangeCallbacks.forEach((callback) => {
            callback("SIGNED_IN", tempAdminSession);
          });

          return Promise.resolve({
            data: { session: tempAdminSession, user: tempAdminUser },
            error: null,
          });
        }

        return Promise.resolve({
          data: { session: null, user: null },
          error: new Error("Invalid login credentials"),
        });
      },
      signUp: () =>
        Promise.resolve({
          error: new Error("Supabase client not initialized"),
        }),
      signInWithOAuth: () =>
        Promise.resolve({
          error: new Error("Supabase client not initialized"),
        }),
      signOut: () => {
        currentSession = null;

        // Notify listeners of auth change
        authChangeCallbacks.forEach((callback) => {
          callback("SIGNED_OUT", null);
        });

        return Promise.resolve({
          error: null,
        });
      },
      getSession: () =>
        Promise.resolve({
          data: { session: currentSession || tempAdminSession },
        }),
      onAuthStateChange: (callback) => {
        authChangeCallbacks.push(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authChangeCallbacks = authChangeCallbacks.filter(
                  (cb) => cb !== callback,
                );
              },
            },
          },
        };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: new Error("Supabase client not initialized"),
            }),
          select: () =>
            Promise.resolve({
              data: null,
              error: new Error("Supabase client not initialized"),
            }),
        }),
        update: () => ({
          eq: () => ({
            select: () =>
              Promise.resolve({
                data: null,
                error: new Error("Supabase client not initialized"),
              }),
            single: () =>
              Promise.resolve({
                data: null,
                error: new Error("Supabase client not initialized"),
              }),
          }),
        }),
      }),
    }),
  };
};

// Create the client with valid credentials or use a mock client
export const supabase = isValidUrl
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      storageUrl: "https://dwhnysvvlrffwnhololy.supabase.co/storage/v1/s3",
    })
  : (createMockClient() as any);
