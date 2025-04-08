export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          company: string | null;
          role: string;
          is_active: boolean;
          plan_id: string | null;
          created_at: string;
          last_sign_in_at: string | null;
          word_credits_remaining: number;
          word_credits_total: number;
        };
      };
      // Add other tables as needed
    };
  };
};

