
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use environment variables from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wnywlwahimhlfnxmwhsu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueXdsd2FoaW1obGZueG13aHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0OTU3ODQsImV4cCI6MjA1OTA3MTc4NH0._OMz-H4A_cILsKpuXD_ZjaI4yj1Q2LlZoBxspFwRovw';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndueXdsd2FoaW1obGZueG13aHN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzQ5NTc4NCwiZXhwIjoyMDU5MDcxNzg0fQ.C1mLVYK8QKzzbRjmit2ZfhtNLI_z1ZzUIeGYJ-KTMYc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string, metadata: { first_name: string, last_name: string, username: string, role: string }) => {
  return await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: metadata
    }
  });
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const resetPassword = async (email: string) => {
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
};

// Insert user data into users table with service role client
// This bypasses RLS and ensures the user is created even if policies would block it
export const insertUserData = async (userData: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: 'recruiter' | 'administrator';
}) => {
  return await supabaseAdmin
    .from('users')
    .insert([userData]);
};

// Get user count for auto-generating username
export const getUserCount = async () => {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  return count || 0;
};

// Generate username
export const generateUsername = async (firstName: string) => {
  const count = await getUserCount();
  const userNumber = (count + 1).toString().padStart(2, '0');
  return `Recruiter${userNumber}`;
};

// Get user profile data directly from auth.users to avoid RLS issues
export const getUserProfile = async (userId: string) => {
  try {
    // First try to get user from public.users
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userData) {
      return userData;
    }
    
    // If that fails, fallback to auth.user metadata
    const { data: authUser } = await supabase.auth.getUser();
    if (authUser && authUser.user) {
      // Create a user profile from auth data
      return {
        id: authUser.user.id,
        email: authUser.user.email || '',
        first_name: authUser.user.user_metadata.first_name || '',
        last_name: authUser.user.user_metadata.last_name || '',
        username: authUser.user.user_metadata.username || '',
        role: authUser.user.user_metadata.role || 'recruiter',
        created_at: authUser.user.created_at,
        updated_at: null,
        deleted_at: null
      };
    }
    
    throw new Error('User not found');
  } catch (err) {
    console.error('Error getting user profile:', err);
    throw err;
  }
};

// Update user profile with service role to bypass RLS
export const updateUserProfile = async (userId: string, updates: any) => {
  return await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId);
};
