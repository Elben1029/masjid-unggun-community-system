import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleVersion, setRoleVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  async function syncRole(session) {
    if (!session) return;
    try {
      console.log("🔄 Syncing role with Edge Function...");
      const { data, error } = await supabase.functions.invoke('sync-role', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (error) throw error;
      
      if (data) {
        console.log("✅ Sync Role Data:", data);
        setRoleVersion(prevVersion => {
          if (prevVersion !== null && prevVersion !== data.role_version) {
            console.log("🔄 Role version mismatch, refreshing session...");
            supabase.auth.refreshSession();
          }
          return data.role_version;
        });
        // Update role in memory
        setUserRole(data.role);
      }
    } catch (err) {
      console.error("❌ Error syncing role:", err);
    }
  }

  async function fetchUserRole(userId) {
    try {
      console.log("🔍 Fetching profile for user UID:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log("ℹ️ No profile found in 'profiles' table, defaulting to 'public'");
          setUserRole('public');
          setCurrentUserProfile(null);
          return 'public';
        }
        console.error("❌ Profile fetch error:", error);
        throw error;
      }
      
      setCurrentUserProfile(data);
      // Normalize role: trim and lowercase to avoid comparison issues
      const rawRole = data?.role || 'public';
      const normalizedRole = String(rawRole).trim().toLowerCase();
      
      console.log("✅ Profile data:", data);
      console.log("🏷️ Normalized Role:", normalizedRole);
      
      setUserRole(normalizedRole);
      return normalizedRole;
    } catch (error) {
      console.error("⚠️ Fallback to 'public' role:", error);
      setUserRole('public');
      setCurrentUserProfile(null);
      return 'public';
    }
  }

  async function login(identifier, password) {
    let emailToUse = identifier;
    if (identifier && !identifier.includes('@')) {
      // It's a username, lookup the email
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier)
        .maybeSingle();
        
      if (error || !data?.email) {
        throw new Error('Nama pengguna tidak wujud atau tidak sah.');
      }
      emailToUse = data.email;
    }
    
    return supabase.auth.signInWithPassword({ 
      email: emailToUse, 
      password,
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  async function register(email, password, userData = {}) {
    if (userData.username) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', userData.username)
        .maybeSingle();
        
      if (data) {
        throw new Error('Nama pengguna sudah digunakan. Sila pilih yang lain.');
      }
    }
    
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          full_name: userData.full_name || '',
          username: userData.username || '',
          phone: userData.phone || ''
        },
        redirectTo: window.location.origin
      }
    });
  }

  async function updateUserProfile(updates) {
    if (!currentUser) throw new Error('Tiada sesi pengguna aktif.');
    
    // If username is changing, ensure uniqueness
    if (updates.username) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', currentUser.id)
        .maybeSingle();
        
      if (data) {
        throw new Error('Nama pengguna sudah digunakan oleh pengguna lain.');
      }
    }

    // Prepare auth updates (email, password)
    const authUpdates = {};
    if (updates.email && updates.email !== currentUser.email) {
      authUpdates.email = updates.email;
    }
    if (updates.password) {
      authUpdates.password = updates.password;
    }
    
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.updateUser(authUpdates);
      if (authError) throw authError;
    }

    // Update profiles table
    const profileData = {
      updated_at: new Date().toISOString()
    };
    if (updates.full_name !== undefined) profileData.full_name = updates.full_name;
    if (updates.username !== undefined) profileData.username = updates.username;
    if (updates.phone_number !== undefined) {
      profileData.phone_number = updates.phone_number;
      profileData.phone = updates.phone_number;
    }
    if (updates.password !== undefined && updates.password) {
      profileData.password_hash = btoa(updates.password); 
    }

    const { data: updatedProfile, error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', currentUser.id)
      .select()
      .single();

    if (profileError) throw profileError;
    
    setCurrentUserProfile(updatedProfile);
    return updatedProfile;
  }

  function loginWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }

  function loginAsGuest() {
    return supabase.auth.signInAnonymously();
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
          console.log("👤 Auth User Object:", user);
          console.log("📧 User Email:", user.email);
          
          // STEP 5: Prepare structure for future JWT usage
          // Check if role exists in app_metadata, but keep profiles.role as source of truth for now.
          const jwtRole = user.app_metadata?.role;
          if (jwtRole) {
            console.log("🔮 Future JWT Role detected:", jwtRole);
          }

          await fetchUserRole(user.id);
          
          // Sync role on initial load to reflect changes after refresh automatically
          if (event === "INITIAL" || event === "INITIAL_SESSION") {
            await syncRole(session);
          }
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
      
      // STEP 4: After SIGNED_IN event, call Edge Function
      if (event === "SIGNED_IN") {
        syncRole(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    currentUserProfile,
    userRole,
    loading,
    login,
    register,
    updateUserProfile,
    loginWithGoogle,
    loginAsGuest,
    loginWithPhone,
    verifyPhoneOtp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-600 dark:text-slate-400 font-medium italic">Memulakan sistem...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
