
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jgjkyzguoksbsawfxcmn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnamt5emd1b2tzYnNhd2Z4Y21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMzc3NTcsImV4cCI6MjA1ODgxMzc1N30.3HN0McaIVIM0uXDFYnoRBtvCobOMGNBR_nt-YZV-rnw';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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

// Insert user data into users table
export const insertUserData = async (userData: {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  role: 'recruiter' | 'administrator';
}) => {
  return await supabase
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

// Get user profile data
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: any) => {
  return await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
};
