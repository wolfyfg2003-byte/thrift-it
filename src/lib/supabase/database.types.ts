export type WaitlistRow = {
  id: string;
  email: string;
  phone: string | null;
  created_at: string;
};

export type WaitlistInsert = {
  id?: string;
  email: string;
  phone?: string | null;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      waitlist: {
        Row: WaitlistRow;
        Insert: WaitlistInsert;
        Update: Partial<WaitlistInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
