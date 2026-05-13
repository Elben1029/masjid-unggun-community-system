import { useState, useEffect } from 'react';
import { 
  User, Mail, ShieldAlert, Phone, Lock, CheckCircle2, 
  AlertCircle, Save, LogOut, Edit3, Calendar, Clock, 
  ExternalLink, Tag, DollarSign, CheckCircle, XCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

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

  // User's Registrations State
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loadingRegs, setLoadingRegs] = useState(true);

  // Initialize fields when profile data loads
  useEffect(() => {
    if (currentUserProfile) {
      setFullName(currentUserProfile.full_name || '');
      setUsername(currentUserProfile.username || '');
      setPhoneNumber(currentUserProfile.phone_number || currentUserProfile.phone || '');
    }
    if (currentUser) {
      setEmail(currentUser.email || '');
      fetchMyRegistrations();
    }
  }, [currentUser, currentUserProfile]);

  async function fetchMyRegistrations() {
    if (!currentUser) return;
    setLoadingRegs(true);
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, events(*)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching my registrations:", error);
    } else {
      setMyRegistrations(data || []);
    }
    setLoadingRegs(false);
  }

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 animate-fadeIn">
      {/* Header Banner */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-700 dark:text-emerald-400 mb-4 shadow-xl border-4 border-white dark:border-slate-800 relative">
          <User size={56} />
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute bottom-0 right-0 p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"
            title="Sunting Profil"
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

      <div className="space-y-8">
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

            {/* Form Button Triggers */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMsg('');
                  }}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  <Save size={16} />
                  <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Section 3: Registered Events & Programs Overview */}
        <div className="glass-card rounded-3xl p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80 transition-all">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Calendar className="text-emerald-600 dark:text-emerald-400" size={20} />
              <span>3. Rekod Pendaftaran Acara Saya</span>
            </h2>
            <Link 
              to="/events" 
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              + Jelajah Acara
            </Link>
          </div>

          {loadingRegs ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Memuatkan rekod penyertaan acara anda...
            </div>
          ) : myRegistrations.length === 0 ? (
            <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Anda belum menyertai sebarang acara rasmi masjid.</p>
              <Link to="/events" className="inline-block mt-2 text-xs font-bold text-emerald-600 hover:underline">Sertai Program Sekarang</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myRegistrations.map((reg) => {
                const eventObj = reg.events || {};
                const isPaid = eventObj.event_type === 'paid';
                return (
                  <div key={reg.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs hover:border-emerald-200 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {eventObj.title || 'Acara Telah Tamat/Dipadam'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase ${
                          isPaid ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {isPaid ? `Bayaran RM${eventObj.event_fee || 0}` : 'Percuma'}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-400">
                        Didaftarkan atas nama: <span className="font-bold text-slate-700 dark:text-slate-300">{reg.participant_name || 'Tanpa Nama'}</span> ({reg.phone_number || 'Tiada Tel'})
                      </p>

                      {reg.payment_proof_url && (
                        <a 
                          href={reg.payment_proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold pt-1"
                        >
                          <ExternalLink size={11} />
                          Lihat Resit Transaksi Dihantar
                        </a>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-xs ${
                        reg.registration_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                        reg.registration_status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                      }`}>
                        {reg.registration_status === 'confirmed' && <CheckCircle size={12} />}
                        {reg.registration_status === 'rejected' && <XCircle size={12} />}
                        {reg.registration_status === 'pending' && <Clock size={12} />}
                        {reg.registration_status === 'confirmed' ? 'Penyertaan Sah' : reg.registration_status === 'rejected' ? 'Ditolak' : 'Menunggu Pengesahan'}
                      </span>
                      
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(reg.created_at).toLocaleDateString('ms-MY')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 4: Account Actions Container */}
        <div className="glass-card rounded-3xl p-8 shadow-sm border border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Pengurusan Sesi & Peranan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Akses panel pentadbiran atau tamatkan log masuk.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            {userRole === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-all"
              >
                <ShieldAlert size={16} />
                <span>Admin Panel</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white transition-all"
            >
              <LogOut size={16} />
              <span>Log Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
