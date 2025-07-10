'use server';

import { createClient } from '../utils/supabase/server';

export async function signInwithGoogle(redirectTo: string) {
  const supabase = await createClient();
  const redirectURL = `http://localhost:3000/auth/callback?next=${redirectTo}`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectURL,
    },
  });

  if (error) {
    console.error('Error signing in with Google:', error);
    throw new Error('Failed to sign in with Google');
  }

  return data;
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw new Error('Failed to sign out');
  }

  return { success: true };
}
