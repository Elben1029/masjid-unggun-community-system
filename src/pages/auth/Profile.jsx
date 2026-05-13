import { useState, useEffect } from 'react';
import { User, Mail, ShieldAlert, Phone, Lock, CheckCircle2, AlertCircle, Save, LogOut, Edit3 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Profile() {
  const { currentUser, currentUserProfile, userRole, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Initialize fields when profile data loads
  useEffect(() => {
    if (currentUserProfile) {
      setFullName(currentUserProfile.full_name || '');
      setUsername(currentUserProfile.username || '');
      setPhoneNumber(currentUserProfile.phone_number || currentUserProfile.phone || '');
    }
    if (currentUser) {
      setEmail(currentUser.email || '');
    }
  }, [currentUser, currentUserProfile]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validation rules
    if (password && password.length < 6) {
      return setErrorMsg('Kata laluan baharu mestilah sekurang-kurangnya 6 aksara.');
    }
    if (password && password !== confirmPassword) {
      return setErrorMsg('Pengesahan kata laluan tidak sepadan.');
    }

    try {
      setLoading(true);
      const updates = {
        full_name: fullName,
        username,
        email,
        phone_number: phoneNumber
      };

      if (password) {
        updates.password = password;
      }

      await updateUserProfile(updates);
      setSuccessMsg('Profil anda telah dikemas kini dengan berjaya.');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Gagal mengemas kini profil.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
      {/* Header Banner */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-400 mb-4 shadow-xl border-4 border-white dark:border-slate-800 relative">
          <User size={56} />
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
            title="Suntin Profil"
          >
            <Edit3 size={16} />
          </button>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
          {fullName || currentUserProfile?.full_name || 'Profil Pengguna'}
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
          @{username || currentUserProfile?.username || 'namapengguna'}
        </p>
        <div className="flex justify-center items-center gap-2">
          <span className={`px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm ${
            userRole === 'admin' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50' :
            userRole === 'guest' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200' :
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
          }`}>
            {userRole || 'Public'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-8 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fadeIn">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 shrink-0" size={24} />
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{successMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-8 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fadeIn">
          <AlertCircle className="text-rose-600 dark:text-rose-400 shrink-0" size={24} />
          <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Personal Information */}
        <div className="glass-card rounded-3xl p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80 transition-all">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="text-emerald-600 dark:text-emerald-400" size={20} />
              <span>1. Maklumat Peribadi</span>
            </h2>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Edit3 size={12} /> Kemas Kini
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Nama Penuh
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="text-slate-400" size={18} />
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-500 transition-all"
                  placeholder="Sila masukkan nama penuh"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Nombor Telefon
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="text-slate-400" size={18} />
                </div>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-500 transition-all"
                  placeholder="Contoh: 0123456789"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Login & Security */}
        <div className="glass-card rounded-3xl p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80 transition-all">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Lock className="text-emerald-600 dark:text-emerald-400" size={20} />
              <span>2. Log Masuk & Keselamatan</span>
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Nama Pengguna (Unik)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-500 transition-all font-mono"
                    placeholder="namapengguna"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Digunakan untuk log masuk pantas tanpa emel.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Alamat Emel
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="text-slate-400" size={18} />
                  </div>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-50 dark:disabled:bg-slate-900/40 disabled:text-slate-500 transition-all"
                    placeholder="anda@contoh.com"
                  />
                </div>
              </div>
            </div>

            {/* Password Update Options */}
            {isEditing && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 mt-6">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4">
                  Tukar Kata Laluan (Pilihan)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Kata Laluan Baharu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="text-slate-400" size={18} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Biarkan kosong jika tiada perubahan"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Sahkan Kata Laluan Baharu
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="text-slate-400" size={18} />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        placeholder="Ulang kata laluan baharu"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Account Actions */}
        <div className="glass-card rounded-3xl p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Tindakan Akaun</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Urus status sesi log masuk atau peranan anda.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {userRole === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-all"
              >
                <ShieldAlert size={18} />
                <span>Admin Panel</span>
              </Link>
            )}

            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                  }}
                  className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  <Save size={18} />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/20 transition-all"
              >
                <Edit3 size={18} />
                <span>Kemas Kini Profil</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all"
            >
              <LogOut size={18} />
              <span>Log Keluar</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
