import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role || 'public');
      return data?.role || 'public';
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole('public');
      return 'public';
    }
  }

  function login(email, password) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  function register(email, password) {
    return supabase.auth.signUp({ email, password });
  }

  function loginWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  function loginWithPhone(phoneNumber) {
    // Supabase Phone Auth usually sends an OTP
    return supabase.auth.signInWithOtp({
      phone: phoneNumber
    });
  }

  async function verifyPhoneOtp(phone, token) {
    return supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
  }

  function logout() {
    return supabase.auth.signOut();
  }

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);
      if (user) {
        await fetchUserRole(user.id);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    login,
    register,
    loginWithGoogle,
    loginWithPhone,
    verifyPhoneOtp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
