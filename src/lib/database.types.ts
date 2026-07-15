// ──────────────────────────────────────────────
//  BloodLink — Supabase Database Types
//  Hand-written to match supabase/schema.sql.
//  If you add columns, update this file too.
// ──────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      hospitals: {
        Row: {
          id:         string;
          name:       string;
          address:    string;
          city:       string;
          lat:        number;
          lng:        number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['hospitals']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['hospitals']['Insert']>;
      };

      donors: {
        Row: {
          id:           string;
          name:         string;
          blood_type:   string;
          phone:        string;
          city:         string;
          distance_km:  number;
          tier:         number;
          created_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['donors']['Row'], 'created_at'> & { created_at?: string };
        Update: Partial<Database['public']['Tables']['donors']['Insert']>;
      };

      blood_requests: {
        Row: {
          id:                   string;
          hospital_id:          string;
          hospital_name:        string;
          blood_type:           string;
          urgency:              string;
          units_needed:         number;
          patient_condition:    string;
          location:             string;
          state:                string;
          escalation_timer_ms:  number;
          tier_escalated_at:    string | null;
          matched_donor_id:     string | null;
          notes:                string | null;
          created_at:           string;
          updated_at:           string;
        };
        Insert: Omit<
          Database['public']['Tables']['blood_requests']['Row'],
          'created_at' | 'updated_at'
        > & { created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['blood_requests']['Insert']>;
      };

      notified_donors: {
        Row: {
          id:              string;
          request_id:      string;
          donor_id:        string;
          response_status: string;
          tier:            number;
          notified_at:     string;
          responded_at:    string | null;
        };
        Insert: Omit<Database['public']['Tables']['notified_donors']['Row'], 'id' | 'notified_at'> & {
          id?:          string;
          notified_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notified_donors']['Insert']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
