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
      console.log("Fetching role for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
      
      console.log("Profile data fetched:", data);
      const role = data?.role || 'public';
      setUserRole(role);
      return role;
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole('public');
      return 'public';
    }
  }

  function login(email, password) {
    return supabase.auth.signInWithPassword({ 
      email, 
      password,
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  function register(email, password) {
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        redirectTo: window.location.origin
      }
    });
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
    async function initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        setCurrentUser(user);
        
        if (user) {
          console.log("Session found:", user.email);
          await fetchUserRole(user.id);
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state change event:", _event);
      const user = session?.user ?? null;
      setCurrentUser(user);
      
      if (user) {
        console.log("User logged in:", user.email);
        await fetchUserRole(user.id);
      } else {
        console.log("User logged out");
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    register,
    loginWithGoogle,
    loginWithPhone,
    verifyPhoneOtp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium italic">Memulakan sistem...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
