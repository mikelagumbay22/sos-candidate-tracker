
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
      users: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          password: string | null
          username: string
          role: string
          created_at: string
          updated_at: string | null
          deleted_at: string | null
          linkedin_profile: string | null
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          password?: string | null
          username: string
          role: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          linkedin_profile?: string | null
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          password?: string | null
          username?: string
          role?: string
          created_at?: string
          updated_at?: string | null
          deleted_at?: string | null
          linkedin_profile?: string | null
        }
      }
      applicants: {
        Row: {
          id: string
          author_id: string
          created_at: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          location: string | null
          cv_link: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          created_at?: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          location?: string | null
          cv_link?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          location?: string | null
          cv_link?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
      joborder_applicant: {
        Row: {
          id: string
          joborder_id: string
          client_id: string
          author_id: string
          created_at: string
          updated_at: string | null
          interview_notes: string | null
          asking_salary: number | null
          application_stage: string
          application_status: string
          client_feedback: string | null
        }
        Insert: {
          id?: string
          joborder_id: string
          client_id: string
          author_id: string
          created_at?: string
          updated_at?: string | null
          interview_notes?: string | null
          asking_salary?: number | null
          application_stage: string
          application_status: string
          client_feedback?: string | null
        }
        Update: {
          id?: string
          joborder_id?: string
          client_id?: string
          author_id?: string
          created_at?: string
          updated_at?: string | null
          interview_notes?: string | null
          asking_salary?: number | null
          application_stage?: string
          application_status?: string
          client_feedback?: string | null
        }
      }
      joborder: {
        Row: {
          id: string
          job_title: string
          client_id: string
          author_id: string
          created_at: string
          updated_at: string | null
          schedule: string | null
          status: string
          responsibilities_requirements: string | null
          client_budget: string | null
        }
        Insert: {
          id?: string
          job_title: string
          client_id: string
          author_id: string
          created_at?: string
          updated_at?: string | null
          schedule?: string | null
          status: string
          responsibilities_requirements?: string | null
          client_budget?: string | null
        }
        Update: {
          id?: string
          job_title?: string
          client_id?: string
          author_id?: string
          created_at?: string
          updated_at?: string | null
          schedule?: string | null
          status?: string
          responsibilities_requirements?: string | null
          client_budget?: string | null
        }
      }
      clients: {
        Row: {
          id: string
          author_id: string
          created_at: string
          first_name: string
          last_name: string
          position: string
          email: string
          phone: string | null
          location: string | null
          company: string
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          created_at?: string
          first_name: string
          last_name: string
          position: string
          email: string
          phone?: string | null
          location?: string | null
          company: string
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          position?: string
          email?: string
          phone?: string | null
          location?: string | null
          company?: string
          updated_at?: string | null
          deleted_at?: string | null
        }
      }
    }
  }
}
