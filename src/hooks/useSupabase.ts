import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      console.error(
        "Supabase client not initialized. Check your environment variables.",
      );
      return {
        error: new Error(
          "Supabase client not initialized. Check your environment variables.",
        ),
      };
    }
    try {
      console.log(`Attempting login with: ${email} (from useSupabase hook)`);
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        console.error("Login error from Supabase:", response.error);
      } else {
        console.log("Login successful", response.data.user);
      }

      return response;
    } catch (err) {
      console.error("Error during sign in:", err);
      return {
        error:
          err instanceof Error
            ? err
            : new Error("Unknown error during sign in"),
      };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    if (!supabase) {
      console.error(
        "Supabase client not initialized. Check your environment variables.",
      );
      return {
        error: new Error(
          "Supabase client not initialized. Check your environment variables.",
        ),
      };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      return { error };
    } catch (err) {
      console.error("Error during sign up:", err);
      return {
        error:
          err instanceof Error
            ? err
            : new Error("Unknown error during sign up"),
      };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error("Supabase client not initialized") };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signInWithLinkedIn = async () => {
    if (!supabase) {
      return { error: new Error("Supabase client not initialized") };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) {
      return { error: new Error("Supabase client not initialized") };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error("Supabase client not initialized") };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err) {
      console.error("Error during password reset:", err);
      return {
        error:
          err instanceof Error
            ? err
            : new Error("Unknown error during password reset"),
      };
    }
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithLinkedIn,
    signOut,
    resetPassword,
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: false,
    profileVisibility: false,
    documentAccess: false,
    analyticsConsent: false,
    marketingConsent: false,
  });
  const { user } = useAuth();

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);

        // Extract first name from profile data
        if (data) {
          // Try to get first name from various possible fields
          const name = data.first_name || data.name || data.full_name || "";
          // If we have a full name, extract just the first name
          const firstName = name.split(" ")[0];
          setFirstName(firstName);

          // Load privacy settings if they exist
          if (data.privacy_settings) {
            try {
              // If privacy_settings is stored as a JSON string, parse it
              const settings =
                typeof data.privacy_settings === "string"
                  ? JSON.parse(data.privacy_settings)
                  : data.privacy_settings;

              setPrivacySettings({
                dataSharing: settings.dataSharing ?? false,
                profileVisibility: settings.profileVisibility ?? false,
                documentAccess: settings.documentAccess ?? false,
                analyticsConsent: settings.analyticsConsent ?? false,
                marketingConsent: settings.marketingConsent ?? false,
              });
            } catch (e) {
              console.error("Error parsing privacy settings:", e);
            }
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const updateProfile = async (updates: any) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { data: null, error };
    }
  };

  const updatePrivacySettings = async (settings: any) => {
    if (!user) return { error: new Error("No user logged in") };

    try {
      // Update local state first for immediate UI feedback
      setPrivacySettings((prev) => ({ ...prev, ...settings }));

      // Prepare the update with all current settings
      const updatedSettings = { ...privacySettings, ...settings };

      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Update the privacy_settings field in the users table
      const { data, error } = await supabase
        .from("users")
        .update({ privacy_settings: updatedSettings })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      return { data: null, error };
    }
  };

  return {
    profile,
    firstName,
    loading,
    privacySettings,
    updateProfile,
    updatePrivacySettings,
  };
}

export function useWordCredits() {
  const [credits, setCredits] = useState({ remaining: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadCredits() {
      if (!user) {
        setCredits({ remaining: 0, total: 0 });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const { data, error } = await supabase
          .from("users")
          .select("word_credits_remaining, word_credits_total")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setCredits({
          remaining: data.word_credits_remaining,
          total: data.word_credits_total,
        });
      } catch (error) {
        console.error("Error loading word credits:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCredits();
  }, [user]);

  const updateWordCredits = async (wordsUsed: number) => {
    if (!user) return false;

    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      const newRemaining = Math.max(0, credits.remaining - wordsUsed);
      const { error } = await supabase
        .from("users")
        .update({ word_credits_remaining: newRemaining })
        .eq("id", user.id);

      if (error) throw error;
      setCredits((prev) => ({ ...prev, remaining: newRemaining }));
      return true;
    } catch (error) {
      console.error("Error updating word credits:", error);
      return false;
    }
  };

  return {
    credits,
    loading,
    updateWordCredits,
  };
}
