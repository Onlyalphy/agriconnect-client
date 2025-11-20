import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { supabase } from '../supaBaseClient';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const processedSessionRef = useRef(null);
  const isFetchingRef = useRef(false);

  // ULTRA FAST: Fetch user profile with aggressive timeout
  const fetchUserProfile = useCallback(async (currentSession) => {
    if (!currentSession) {
      console.log('❌ No session, skipping profile fetch');
      setMongoUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) {
      console.log('⏭️ Profile fetch already in progress, skipping...');
      return;
    }

    isFetchingRef.current = true;
    const fetchStart = Date.now();

    try {
      console.log('🔄 Starting profile fetch...');
      console.log('📧 User email:', currentSession.user.email);
      
      setError(null);
      
      // REDUCED TO 3 SECONDS - Backend MUST be fast
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Backend timeout (3s)')), 3000)
      );
      
      const profilePromise = getMe();
      const response = await Promise.race([profilePromise, timeoutPromise]);
      
      const duration = Date.now() - fetchStart;
      console.log(`✅ Profile fetched in ${duration}ms:`, response.data);
      
      setMongoUser(response.data);
      setError(null);
      
    } catch (err) {
      const duration = Date.now() - fetchStart;
      console.error(`❌ Profile fetch failed after ${duration}ms:`, err.message);
      
      // IMMEDIATE FALLBACK - No time wasted
      console.warn('⚠️ Using session fallback (backend too slow)');
      const fallbackProfile = {
        _id: currentSession.user.id, // Use Supabase ID as fallback
        email: currentSession.user.email,
        supabaseUserId: currentSession.user.id,
        role: currentSession.user.user_metadata?.role || 'BUYER',
        profile: {
          name: currentSession.user.user_metadata?.full_name || currentSession.user.email.split('@')[0]
        },
        transactionVolume: 0,
        verifiedReserveValue: 0,
        _fallback: true,
        _error: 'Backend slow - using cached data'
      };
      
      setMongoUser(fallbackProfile);
      setError('Using cached profile (backend slow)');
      
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Manual refetch
  const refetchUser = useCallback(() => {
    console.log('🔄 Manual refetch triggered');
    setLoading(true);
    setError(null);
    isFetchingRef.current = false;
    fetchUserProfile(session);
  }, [session, fetchUserProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');
      setLoading(true);
      
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session fetch error:', sessionError);
          setError('Failed to get authentication session');
          setLoading(false);
          return;
        }

        if (!mounted) return;

        console.log('✅ Session retrieved. Session exists:', !!initialSession);
        setSession(initialSession);
        
        if (initialSession) {
          processedSessionRef.current = initialSession.user.id;
          await fetchUserProfile(initialSession);
        } else {
          console.log('ℹ️ No active session');
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('❌ Auth initialization error:', err);
        setError('Failed to initialize authentication');
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log('🔐 Auth event:', event, '| Session:', !!newSession);
        
        if (event === 'SIGNED_IN' && newSession && processedSessionRef.current === newSession.user.id) {
          console.log('⏭️ Skipping duplicate SIGNED_IN event');
          return;
        }

        setSession(newSession);

        if (event === 'SIGNED_IN' && newSession) {
          console.log('✅ User signed in, fetching profile...');
          processedSessionRef.current = newSession.user.id;
          setLoading(true);
          await fetchUserProfile(newSession);
        } else if (event === 'TOKEN_REFRESHED' && newSession) {
          console.log('🔄 Token refreshed');
          if (!mongoUser) {
            await fetchUserProfile(newSession);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          processedSessionRef.current = null;
          setMongoUser(null);
          setError(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user: session?.user,
    mongoUser,
    loading,
    error,
    refetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};