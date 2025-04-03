export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: "recruiter" | "administrator";
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  linkedin_profile?: string;
  author?: {
    first_name: string;
    last_name: string;
    username: string;
  };
  
}

export interface Applicant {
  id: string;
  author_id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  cv_link?: string;
  linkedin_profile?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  author?: {
    first_name: string;
    last_name: string;
    username: string;
  };
  joborder_applicant?: Array<{ count: number }>;
}

export interface JobOrder {
  id: string;
  job_title: string;
  client_id: string;
  author_id: string;
  created_at: string;
  updated_at?: string | null;
  schedule?: string;
  status:
    | "kickoff"
    | "Sourcing"
    | "Internal Interview"
    | "Internal Assessment"
    | "Client Endorsement"
    | "Client Assessment"
    | "Client Interview"
    | "Offer"
    | "Hire"
    | "On-hold"
    | "Canceled";
  job_description?: string;
  client_budget?: string;
  // Additional properties for UI
  applicant_count?: number;
  clients?: {
    first_name: string;
    last_name: string;
    company: string;
    position: string;
    email: string;
    phone?: string;
    location?: string;
    sourcing_preference?:
      | "LATAM"
      | "Philippines"
      | "India"
      | "Europe"
      | "South Africa"
      | "Malaysia"
      | "Global";
  };
}

export interface JobOrderApplicant {
  id: string;
  joborder_id: string;
  job_title: string;
  client_id: string;
  author_id: string;
  created_at: string;
  updated_at?: string | null;
  interview_notes?: string;
  asking_salary?: number;
  application_stage:
    | "Sourced"
    | "Interview"
    | "Assessment"
    | "Client Endorsement"
    | "Client Interview"
    | "Offer"
    | "Hired";
  application_status: "Pending" | "Pass" | "Fail";
  client_feedback?: string;
  applicant_id?: string;
  applicant?: Applicant;
  author?: {
    first_name: string;
    last_name: string;
    username: string;
  };
  joborder?: {
    id: string;
    job_title: string;
    status: string;
  };
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  position: string;
  email: string;
  phone: string;
  location: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  author_id: string;
  author: {
    first_name: string;
    last_name: string;
  };
  joborder?: Array<{ count: number }>;
}

export interface DashboardStats {
  totalJobOrders: number;
  totalApplicants: number;
  pendingEndorsements: number;
}

export interface JobOrderStatus {
  status: string;
  count: number;
  color: string; // Added color property to fix type error
}

export interface ApplicantsPerJobOrder {
  job_title: string;
  applicants_count: number;
}

export interface UserAverageCompletion {
  user_name: string;
  average_days: number;
}

export interface AuthFormData {
  first_name?: string;
  last_name?: string;
  email: string;
  password: string;
  confirm_password?: string;
}

export interface ApplicantWithDetails extends JobOrderApplicant {
  applicant: Applicant;
  author: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

export interface JobOrderWithClient {
  id: string;
  job_title: string;
  client_id: string;
  author_id: string;
  status: string;
  job_description: string | null;
  schedule: string | null;
  client_budget: string | null;
  sourcing_preference: string[] | null;
  created_at: string;
  updated_at: string | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    company: string;
  };
  author: {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}
