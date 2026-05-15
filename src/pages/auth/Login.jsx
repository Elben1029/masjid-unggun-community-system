import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/ui/BackButton';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      const { data, error } = await login(identifier, password);
      
      if (error) throw error;
      
      // The user is redirected to home, and if they are admin they can access /admin
      navigate('/');
    } catch (err) {
      setError('Log masuk gagal. Sila pastikan kredential pentadbir anda betul.');
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800">
            <ShieldCheck className="text-white" size={40} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Log Masuk Pentadbir
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Akses ke panel kawalan sistem Masjid Unggun.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-card py-10 px-6 sm:px-10 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-6 bg-rose-50 dark:bg-rose-900/20 border-l-4 border-rose-500 p-4 flex gap-3 rounded-lg animate-shake">
              <AlertCircle className="text-rose-500 shrink-0" size={20} />
              <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Nama Pengguna / Emel</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm font-medium"
                  placeholder="admin_id"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">Kata Laluan</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Mengesahkan...</span>
                  </div>
                ) : 'Log Masuk Pentadbir'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
              Sistem Pengurusan Masjid Unggun
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
