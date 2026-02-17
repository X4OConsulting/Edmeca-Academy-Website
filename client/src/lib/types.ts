// Supabase Database types - Auto-generated or manually created
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
      }
      cohorts: {
        Row: {
          id: string
          name: string
          organization_id: string | null
          invite_code: string | null
          start_date: string | null
          end_date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          organization_id?: string | null
          invite_code?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string | null
          invite_code?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          role: 'entrepreneur' | 'participant' | 'programme_manager' | 'admin' | null
          organization_id: string | null
          cohort_id: string | null
          business_name: string | null
          business_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role?: 'entrepreneur' | 'participant' | 'programme_manager' | 'admin' | null
          organization_id?: string | null
          cohort_id?: string | null
          business_name?: string | null
          business_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'entrepreneur' | 'participant' | 'programme_manager' | 'admin' | null
          organization_id?: string | null
          cohort_id?: string | null
          business_name?: string | null
          business_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      artifacts: {
        Row: {
          id: string
          user_id: string
          tool_type: 'bmc' | 'swot_pestle' | 'value_proposition' | 'pitch_builder'
          title: string
          content: any
          status: 'draft' | 'in_progress' | 'complete' | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_type: 'bmc' | 'swot_pestle' | 'value_proposition' | 'pitch_builder'
          title: string
          content?: any
          status?: 'draft' | 'in_progress' | 'complete' | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tool_type?: 'bmc' | 'swot_pestle' | 'value_proposition' | 'pitch_builder'
          title?: string
          content?: any
          status?: 'draft' | 'in_progress' | 'complete' | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      progress_entries: {
        Row: {
          id: string
          user_id: string
          milestone: string
          completed_at: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          milestone: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          milestone?: string
          completed_at?: string | null
          notes?: string | null
          created_at?: string | null
        }
      }
      contact_submissions: {
        Row: {
          id: string
          name: string
          email: string
          company: string | null
          audience_type: string
          message: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          company?: string | null
          audience_type: string
          message: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          company?: string | null
          audience_type?: string
          message?: string
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      role: 'entrepreneur' | 'participant' | 'programme_manager' | 'admin'
      tool_type: 'bmc' | 'swot_pestle' | 'value_proposition' | 'pitch_builder'
      artifact_status: 'draft' | 'in_progress' | 'complete'
    }
  }
}