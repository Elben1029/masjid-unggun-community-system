import { User, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Profile() {
  const { currentUser, userRole } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-md border-4 border-white dark:border-slate-800">
          <User size={48} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Profil Pengguna</h1>
        <div className="flex justify-center items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wider uppercase ${
            userRole === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
            userRole === 'guest' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          }`}>
            {userRole || 'Public'}
          </span>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">Maklumat Peribadi</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              Alamat Emel
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <Mail className="text-slate-400" size={20} />
              <span className="text-slate-800 dark:text-white">{currentUser?.email || 'Tiada maklumat emel (Tetamu)'}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
              ID Pengguna
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <ShieldAlert className="text-slate-400" size={20} />
              <span className="text-slate-800 dark:text-white font-mono text-sm">{currentUser?.id || 'Tetamu Tanpa Nama'}</span>
            </div>
          </div>
        </div>

        {userRole === 'guest' && (
          <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3">
            <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Akaun Tetamu</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Anda log masuk sebagai tetamu. Maklumat sumbangan dan interaksi anda mungkin tidak akan disimpan secara kekal untuk rujukan masa depan.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
