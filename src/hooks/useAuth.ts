import { useState, useEffect, useCallback, useRef } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/lib/types';

export interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isDemo: boolean;
  error: string | null;
}

// Demo user credentials - sandboxed with RLS and is_demo_account flag
const DEMO_EMAIL = 'demo@amps.app';
const DEMO_PASSWORD = 'demo123456';

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    session: null,
    isLoading: true,
    isDemo: false,
    error: null,
  });

  // Client-side rate limiting state (per email)
  const loginAttemptsRef = useRef<Map<string, LoginAttempt>>(new Map());

  // Check if login is rate limited
  const checkRateLimit = useCallback((email: string): { allowed: boolean; waitTime?: number } => {
    const attempts = loginAttemptsRef.current.get(email);
    const now = Date.now();

    if (!attempts) {
      return { allowed: true };
    }

    // Check if locked out
    if (attempts.lockedUntil && attempts.lockedUntil > now) {
      return { allowed: false, waitTime: Math.ceil((attempts.lockedUntil - now) / 1000) };
    }

    // Reset if outside attempt window
    if (now - attempts.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      loginAttemptsRef.current.delete(email);
      return { allowed: true };
    }

    // Check if max attempts exceeded
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = now + LOCKOUT_DURATION_MS;
      loginAttemptsRef.current.set(email, { ...attempts, lockedUntil });
      return { allowed: false, waitTime: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
    }

    return { allowed: true };
  }, []);

  // Record a failed login attempt
  const recordFailedAttempt = useCallback((email: string) => {
    const attempts = loginAttemptsRef.current.get(email);
    const now = Date.now();

    if (!attempts || now - attempts.firstAttemptAt > ATTEMPT_WINDOW_MS) {
      loginAttemptsRef.current.set(email, { count: 1, firstAttemptAt: now, lockedUntil: null });
    } else {
      loginAttemptsRef.current.set(email, { 
        ...attempts, 
        count: attempts.count + 1,
        lockedUntil: attempts.count + 1 >= MAX_LOGIN_ATTEMPTS ? now + LOCKOUT_DURATION_MS : null
      });
    }
  }, []);

  // Clear login attempts on successful login
  const clearLoginAttempts = useCallback((email: string) => {
    loginAttemptsRef.current.delete(email);
  }, []);

  // Convert Supabase profile to app User type
  const profileToUser = useCallback((profile: any, supabaseUser: SupabaseUser): User => {
    return {
      id: profile.id,
      email: profile.email || supabaseUser.email || '',
      createdAt: profile.created_at || new Date().toISOString(),
      profile: {
        name: profile.name || supabaseUser.email?.split('@')[0] || 'User',
        age: profile.age || 25,
        bio: profile.bio || '',
        occupation: profile.occupation || '',
        company: profile.company || '',
        location: profile.location || 'Windhoek, Namibia',
        gender: profile.gender || '',
        interests: profile.interests || [],
        profilePhoto: profile.profile_photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.email}`,
        phone: profile.phone || '',
      },
      subscription: {
        tier: (profile.subscription_tier as 'free' | 'pro' | 'max') || 'free',
        expiresAt: profile.subscription_expires_at || null,
      },
      settings: profile.settings || {
        theme: 'dark',
        currency: 'NAD',
        notifications: { matches: true, messages: true, events: true, profileViews: true },
        privacy: { searchable: true, showDistance: true, showOnline: true, messageFrom: 'everyone' },
      },
      blockedUsers: profile.blocked_users || [],
      bookmarkedEvents: profile.bookmarked_events || [],
      createdEvents: profile.created_events || [],
      likesRemaining: profile.likes_remaining ?? 25,
      lastLikeReset: profile.last_like_reset || new Date().toISOString(),
      isDemo: profile.is_demo_account || false,
    };
  }, []);

  // Fetch user profile from database - only select needed columns for own profile
  const fetchProfile = useCallback(async (userId: string): Promise<any> => {
    // Select only the columns needed for the user's own profile
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, email, name, age, bio, occupation, company, location, gender, 
        interests, profile_photo, phone, subscription_tier, subscription_expires_at,
        settings, blocked_users, bookmarked_events, created_events, 
        likes_remaining, last_like_reset, is_demo_account, created_at, updated_at
      `)
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data;
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState(prev => ({
          ...prev,
          session,
          supabaseUser: session?.user ?? null,
        }));

        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            const profile = await fetchProfile(session.user.id);
            if (profile) {
              setState(prev => ({
                ...prev,
                user: profileToUser(profile, session.user),
                isDemo: profile.is_demo_account || false,
                isLoading: false,
              }));
            } else {
              setState(prev => ({ ...prev, isLoading: false }));
            }
          }, 0);
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            isDemo: false,
            isLoading: false,
          }));
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({
          session,
          supabaseUser: session.user,
          user: profile ? profileToUser(profile, session.user) : null,
          isDemo: profile?.is_demo_account || false,
          isLoading: false,
          error: null,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, profileToUser]);

  // Sign up with email and password
  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    age: number = 25
  ): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { name, age },
        },
      });

      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // Profile will be created automatically by trigger
      return { success: true };
    } catch (error: any) {
      const message = error?.message || 'Sign up failed';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  // Sign in with email and password - with rate limiting
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Check rate limit before attempting login
    const rateLimitCheck = checkRateLimit(email);
    if (!rateLimitCheck.allowed) {
      const errorMsg = `Too many login attempts. Please wait ${rateLimitCheck.waitTime} seconds.`;
      setState(prev => ({ ...prev, error: errorMsg }));
      return { success: false, error: errorMsg };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        recordFailedAttempt(email);
        setState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      // Clear attempts on successful login
      clearLoginAttempts(email);
      return { success: true };
    } catch (error: any) {
      recordFailedAttempt(email);
      const message = error?.message || 'Login failed';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, [checkRateLimit, recordFailedAttempt, clearLoginAttempts]);

  // Sign in with Google
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      const message = error?.message || 'Google login failed';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  // Login to demo mode
  const loginDemo = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Try to sign in with demo account
      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (error) {
        // If demo account doesn't exist, create it
        if (error.message.includes('Invalid login credentials')) {
          const { data: signupData, error: signupError } = await supabase.auth.signUp({
            email: DEMO_EMAIL,
            password: DEMO_PASSWORD,
            options: {
              data: { name: 'Demo User', is_demo: true },
            },
          });

          if (signupError) {
            setState(prev => ({ ...prev, isLoading: false, error: signupError.message }));
            return { success: false, error: signupError.message };
          }

          // Mark the profile as demo
          if (signupData.user) {
            await supabase.from('profiles').update({
              is_demo_account: true,
              name: 'Demo User',
              subscription_tier: 'pro',
            }).eq('id', signupData.user.id);
          }

          return { success: true };
        }

        setState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      const message = error?.message || 'Demo login failed';
      setState(prev => ({ ...prev, isLoading: false, error: message }));
      return { success: false, error: message };
    }
  }, []);

  // Sign out
  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    setState({
      user: null,
      supabaseUser: null,
      session: null,
      isLoading: false,
      isDemo: false,
      error: null,
    });
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User['profile']>): Promise<boolean> => {
    if (!state.user) return false;

    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.age !== undefined) dbUpdates.age = updates.age;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.occupation !== undefined) dbUpdates.occupation = updates.occupation;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.interests !== undefined) dbUpdates.interests = updates.interests;
    if (updates.profilePhoto !== undefined) dbUpdates.profile_photo = updates.profilePhoto;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', state.user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return false;
    }

    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        profile: { ...prev.user.profile, ...updates },
      } : null,
    }));

    return true;
  }, [state.user]);

  return {
    ...state,
    isAuthenticated: !!state.user,
    signup,
    login,
    loginWithGoogle,
    loginDemo,
    logout,
    updateProfile,
  };
}
