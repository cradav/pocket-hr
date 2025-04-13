import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type CacheContextType = {
  userProfile: Database['public']['Tables']['users']['Row'] | null;
  documents: Database['public']['Tables']['documents']['Row'][] | null;
  refreshUserProfile: () => Promise<void>;
  refreshDocuments: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const CacheContext = createContext<CacheContextType | undefined>(undefined);

export const CacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<Database['public']['Tables']['users']['Row'] | null>(null);
  const [documents, setDocuments] = useState<Database['public']['Tables']['documents']['Row'][] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setUserProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error('Error refreshing user profile:', err);
      setError('Failed to refresh user profile');
    }
  };

  const refreshDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDocuments([]);
        return;
      }

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data);
    } catch (err) {
      console.error('Error refreshing documents:', err);
      setError('Failed to refresh documents');
    }
  };

  // Initial data fetch
  useEffect(() => {
    const initializeCache = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          refreshUserProfile(),
          refreshDocuments()
        ]);
      } catch (err) {
        console.error('Error initializing cache:', err);
        setError('Failed to initialize cache');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCache();
  }, []);

  return (
    <CacheContext.Provider value={{
      userProfile,
      documents,
      refreshUserProfile,
      refreshDocuments,
      isLoading,
      error
    }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
}; 