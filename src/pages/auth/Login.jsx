import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, AlertCircle, Phone, KeyRound } from 'lucide-react';

export default function Login() {
  const [authMode, setAuthMode] = useState('email'); // 'email', 'phone', 'otp'
  
  // Email states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone states
  const [phoneNumber, setPhoneNumber] = useState('+60');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginWithGoogle, loginAsGuest, loginWithPhone, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();

  async function handleGuestLogin() {
    try {
      setError('');
      setLoading(true);
      const { error } = await loginAsGuest();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError('Gagal log masuk sebagai tetamu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { error } = await login(email, password);
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError('Gagal log masuk. Sila semak emel dan kata laluan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      const { error } = await loginWithGoogle();
      if (error) throw error;
      // Note: Supabase OAuth might redirect, so navigate('/') might not be needed here
    } catch (err) {
      setError('Gagal log masuk melalui Google.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { error } = await loginWithPhone(phoneNumber);
      if (error) throw error;
      setAuthMode('otp');
    } catch (err) {
      setError('Gagal menghantar kod SMS. Sila pastikan format nombor telefon betul (contoh: +60123456789).');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { error } = await verifyPhoneOtp(phoneNumber, otp);
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError('Kod SMS tidak sah atau telah tamat tempoh. Sila cuba lagi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-8 left-4 md:left-8">
        <BackButton to="/" label="Kembali ke Laman Utama" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          {authMode === 'otp' ? 'Sahkan Kod SMS' : 'Log Masuk'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Atau{' '}
          <Link to="/register" className="font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400">
            daftar akaun baharu
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 flex gap-3 rounded-md">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Email Authentication Form */}
          {authMode === 'email' && (
            <form className="space-y-6" onSubmit={handleEmailSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Emel atau Nama Pengguna</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="anda@contoh.com atau namapengguna"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kata Laluan</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Log Masuk...' : 'Log Masuk'}
                </button>
              </div>
            </form>
          )}

          {/* Phone Authentication Form (Step 1) */}
          {authMode === 'phone' && (
            <form className="space-y-6" onSubmit={handlePhoneSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nombor Telefon (Termasuk kod negara)</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="+60123456789"
                  />
                </div>
              </div>
              <div id="recaptcha-container"></div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Menghantar...' : 'Hantar Kod SMS'}
                </button>
              </div>
            </form>
          )}

          {/* Phone Authentication Form (Step 2: OTP) */}
          {authMode === 'otp' && (
            <form className="space-y-6" onSubmit={handleOtpSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kod 6-digit SMS</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="appearance-none block w-full pl-10 px-3 py-3 text-center tracking-widest text-lg border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    placeholder="123456"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all"
                >
                  {loading ? 'Mengesahkan...' : 'Sahkan & Log Masuk'}
                </button>
              </div>
            </form>
          )}

          {/* Alternate Login Methods */}
          {authMode !== 'otp' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Atau teruskan dengan</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Teruskan sebagai Tetamu
                </button>

                {authMode === 'email' ? (
                  <button
                    type="button"
                    onClick={() => setAuthMode('phone')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <Phone className="w-4 h-4 mr-2" /> Nombor Telefon
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthMode('email')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                  >
                    <Mail className="w-4 h-4 mr-2" /> Log Masuk Emel / ID
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
