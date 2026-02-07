export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      academies: {
        Row: {
          id: string
          name: string
          address: string
          address_road: string | null
          lat: number
          lng: number
          subjects: string[]
          age_group: string[] | null
          created_at: string
          image_url: string | null
        }
        Insert: Omit<Database['public']['Tables']['academies']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['academies']['Insert']>
      }
      comments: {
        Row: {
          id: string
          academy_id: string
          user_id: string
          content: string
          is_hidden: boolean
          created_at: string
          nickname: string | null
          tag_keys: string[] | null
        }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
      }
      favorites: {
        Row: {
          user_id: string
          academy_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['favorites']['Insert']>
      }
      academy_experience_tags: {
        Row: {
          user_id: string
          academy_id: string
          tag_key: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['academy_experience_tags']['Row'], 'created_at'> & { created_at?: string }
        Update: Partial<Database['public']['Tables']['academy_experience_tags']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
