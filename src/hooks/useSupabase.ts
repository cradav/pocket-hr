import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { logger } from "@/utils/logger";

// Generic error messages
const ERROR_MESSAGES = {
  AUTH: "Authentication error",
  DATABASE: "Error accessing user data",
  NETWORK: "Connection error",
  UNKNOWN: "An unexpected error occurred",
  NOT_AUTHENTICATED: "No user logged in",
  VALIDATION: "User validation error",
  INVALID_CREDENTIALS: "Invalid email or password",
};

export function useSupabase() {
  return { supabase };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const validateUser = async (session: Session | null) => {
      if (!session?.user) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const { data: dbUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error || !dbUser) {
          logger.error(ERROR_MESSAGES.VALIDATION);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          navigate("/login");
        } else {
          setSession(session);
          setUser(session.user);
        }
      } catch (err) {
        logger.error(ERROR_MESSAGES.DATABASE, err);
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        navigate("/login");
      }
      setLoading(false);
    };

    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      validateUser(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      validateUser(session);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      logger.error(ERROR_MESSAGES.NETWORK);
      return { error: new Error(ERROR_MESSAGES.NETWORK) };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Log the error in a safe way
        logger.error(ERROR_MESSAGES.INVALID_CREDENTIALS);
        return { data, error: new Error(ERROR_MESSAGES.INVALID_CREDENTIALS) };
      }

      return { data, error: null };
    } catch (err) {
      logger.error(ERROR_MESSAGES.AUTH);
      return {
        data: null,
        error: new Error(ERROR_MESSAGES.AUTH),
      };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    if (!supabase) {
      return { data: null, error: new Error(ERROR_MESSAGES.NETWORK) };
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (authError) return { data: null, error: authError };

      if (authData.user) {
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: authData.user.email,
          name: userData.name,
          company: userData.company || null,
          role: "user",
          is_active: true,
          word_credits_remaining: 1000,
          word_credits_total: 1000,
        });

        if (profileError) {
          logger.error(ERROR_MESSAGES.DATABASE, profileError);
          return { data: null, error: new Error(ERROR_MESSAGES.DATABASE) };
        }
      }

      return { data: authData, error: null };
    } catch (err) {
      logger.error(ERROR_MESSAGES.UNKNOWN, err);
      return { data: null, error: new Error(ERROR_MESSAGES.UNKNOWN) };
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error(ERROR_MESSAGES.NETWORK) };
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
      return { error: new Error(ERROR_MESSAGES.NETWORK) };
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
      return { error: new Error(ERROR_MESSAGES.NETWORK) };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error(ERROR_MESSAGES.NETWORK) };
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (err) {
      logger.error(ERROR_MESSAGES.AUTH, err);
      return {
        error: new Error(ERROR_MESSAGES.AUTH),
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

      // Log the update attempt and data being sent
      console.log("Updating profile with data:", updates);

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Supabase update error:", error);
        throw error;
      }

      // If no data is returned but also no error, try to fetch the updated profile
      if (!data || data.length === 0) {
        const { data: refreshedData, error: refreshError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (refreshError) {
          console.error("Error fetching updated profile:", refreshError);
          throw refreshError;
        }

        setProfile(refreshedData);
        return { data: refreshedData, error: null };
      }

      // Update the local profile state with the returned data
      const updatedProfile = Array.isArray(data) ? data[0] : data;
      setProfile(updatedProfile);
      console.log("Profile updated successfully:", updatedProfile);
      return { data: updatedProfile, error: null };
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

      console.log("Updating privacy settings with:", updatedSettings);

      // Update the privacy_settings field in the users table
      const { data, error } = await supabase
        .from("users")
        .update({ privacy_settings: updatedSettings })
        .eq("id", user.id)
        .select();

      if (error) {
        console.error("Error updating privacy settings in Supabase:", error);
        throw error;
      }

      // If data is returned, update the profile state
      if (data && data.length > 0) {
        setProfile(data[0]);
      }

      console.log("Privacy settings updated successfully");
      return { data: data ? data[0] : null, error: null };
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
