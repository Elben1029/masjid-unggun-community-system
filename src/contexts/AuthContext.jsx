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
      console.log("🔍 Fetching role for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log("ℹ️ No profile found, defaulting to 'public'");
          setUserRole('public');
          return 'public';
        }
        console.error("❌ Profile fetch error:", error);
        throw error;
      }
      
      console.log("✅ Profile data fetched:", data);
      const role = data?.role || 'public';
      setUserRole(role);
      return role;
    } catch (error) {
      console.error("⚠️ Error fetching user role, fallback to public:", error);
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
    let mounted = true;

    async function handleAuthStateChange(event, session) {
      try {
        console.log("🔄 Auth Event:", event);
        const user = session?.user ?? null;
        
        if (mounted) setCurrentUser(user);

        if (user) {
          console.log("👤 User authenticated:", user.email);
          await fetchUserRole(user.id);
        } else {
          console.log("👻 No active session");
          if (mounted) setUserRole(null);
        }
      } catch (err) {
        console.error("💥 Auth initialization error:", err);
      } finally {
        if (mounted) {
          console.log("🏁 Auth loading finished");
          setLoading(false);
        }
      }
    }

    // Initialize with getSession then set up listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) handleAuthStateChange("INITIAL", session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Avoid double processing on initial session if event is INITIAL_SESSION
      if (event !== "INITIAL_SESSION") {
        handleAuthStateChange(event, session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
