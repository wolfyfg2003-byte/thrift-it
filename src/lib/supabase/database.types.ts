export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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

export type TastePreferencesRow = {
  sizes: string[];
  brands: Record<string, number>;
  categories: Record<string, number>;
};

export type ShippingAddressRow = {
  emirate: string;
  community: string;
  street: string;
  unit: string;
  mobile: string;
  building?: string;
  lat?: number | null;
  lng?: number | null;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  community: string | null;
  taste_preferences: TastePreferencesRow;
  shipping_address: ShippingAddressRow | null;
  created_at: string;
};

export type SwipeRow = {
  id: string;
  user_id: string;
  listing_id: string;
  direction: "like" | "pass";
  created_at: string;
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
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<Omit<ProfileRow, "id">>;
        Relationships: [];
      };
      swipes: {
        Row: SwipeRow;
        Insert: Omit<SwipeRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SwipeRow, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
