import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Use environment variables from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get admin client when needed
export const getAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key');
  }
  return createClient<Database>(supabaseUrl, supabaseServiceKey);
};

// Helper functions for authentication
export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string, metadata: { first_name: string, last_name: string, username: string, role: string }) => {
  console.log("Attempting signup with:", { email, metadata });
  try {
    const result = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });
    
    console.log("Signup response:", result);
    
    if (result.error) {
      console.error("Signup error:", result.error);
      throw result.error;
    }
    
    // Only try to insert user if signup was successful and we have a user
    if (result.data && result.data.user) {
      // No need to manually insert into users table - the trigger will handle this
      return result;
    } else {
      console.error("Signup failed: No user data returned");
      throw new Error("Signup failed: No user data returned");
    }
  } catch (error) {
    console.error("Signup failed:", error);
    throw error;
  }
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

// Get user count for auto-generating username
export const getUserCount = async () => {
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  
  return count || 0;
};

// Generate username
export const generateUsername = async (firstName: string) => {
  const baseUsername = firstName.toLowerCase().replace(/\s+/g, '');
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (error || !data) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;
  }
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
export const updateUserProfile = async (userId: string, updates: Partial<Database['public']['Tables']['users']['Update']>) => {
  return await getAdminClient()
    .from('users')
    .update(updates)
    .eq('id', userId);
};
