import { useState, useEffect, useCallback } from "react";
import { getWordCredits, updateWordCredits } from "@/services/supabaseService";

interface UseCreditsReturn {
  credits: {
    remaining: number;
    total: number;
  };
  loading: boolean;
  error: string | null;
  useCredits: (amount: number) => Promise<boolean>;
  refreshCredits: () => Promise<void>;
}

/**
 * Hook for managing AI word credits
 */
export function useCredits(): UseCreditsReturn {
  const [credits, setCredits] = useState<{ remaining: number; total: number }>({
    remaining: 0,
    total: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch credits on mount
  useEffect(() => {
    refreshCredits();
  }, []);

  // Refresh credits from the database
  const refreshCredits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const creditsData = await getWordCredits();
      setCredits(creditsData);
    } catch (err) {
      console.error("Error fetching credits:", err);
      setError("Failed to load credits. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Use credits and update the database
  const useCredits = useCallback(
    async (amount: number): Promise<boolean> => {
      if (amount <= 0) {
        console.warn("Cannot use zero or negative credits");
        return true; // No credits used, so operation can proceed
      }

      if (credits.remaining < amount) {
        setError("Insufficient credits for this operation");
        return false; // Not enough credits
      }

      try {
        setLoading(true);
        const success = await updateWordCredits(amount);

        if (success) {
          // Update local state optimistically
          setCredits((prev) => ({
            ...prev,
            remaining: Math.max(0, prev.remaining - amount),
          }));
          return true;
        } else {
          setError("Failed to update credits. Please try again.");
          return false;
        }
      } catch (err) {
        console.error("Error using credits:", err);
        setError("Failed to update credits. Please try again.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [credits.remaining],
  );

  return {
    credits,
    loading,
    error,
    useCredits,
    refreshCredits,
  };
}
