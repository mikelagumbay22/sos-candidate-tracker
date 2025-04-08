import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Use environment variables from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single auth instance with shared storage
const authOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
    storage: window.localStorage
  }
};

// Create a single instance of the Supabase client
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, authOptions);

// Create admin client with the same auth options but different storage key
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  ...authOptions,
  auth: {
    ...authOptions.auth,
    storageKey: 'supabase.admin.auth.token'
  }
});

export { supabase, supabaseAdmin };

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateUserProfile = async (userId: string, updates: any) => {
  return await supabaseAdmin
    .from('users')
    .update(updates)
    .eq('id', userId);
};
