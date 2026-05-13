import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff, Edit, RefreshCw, UserCheck, UserX, User, Mail, Phone, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Edit modal states
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();

    const subscription = supabase
      .channel('profiles_admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data || []);
    }
  }

  const handleToggleRole = async (user) => {
    if (user.id === currentUser?.id) {
      alert("Anda tidak boleh menukar peranan anda sendiri.");
      return;
    }

    const newRole = user.role === 'admin' ? 'public' : 'admin';
    if (window.confirm(`Adakah anda pasti mahu menukar peranan pengguna ini kepada ${newRole === 'admin' ? 'Admin' : 'Awam'}?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Error updating role:", err);
        alert("Gagal menukar peranan pengguna.");
      }
    }
  };

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      alert("Anda tidak boleh menyahaktifkan akaun anda sendiri.");
      return;
    }

    const newStatus = user.status === 'inactive' ? 'active' : 'inactive';
    if (window.confirm(`Adakah anda pasti mahu ${newStatus === 'active' ? 'mengaktifkan' : 'menyahaktifkan'} pengguna ini?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Error toggling status:", err);
        alert("Gagal mengemaskini status pengguna.");
      }
    }
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditFullName(user.full_name || '');
    setEditUsername(user.username || '');
    setEditPhoneNumber(user.phone_number || user.phone || '');
    setEditPassword('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    // Check username uniqueness if modified
    if (editUsername && editUsername !== selectedUser.username) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', editUsername)
        .neq('id', selectedUser.id)
        .maybeSingle();
        
      if (data) {
        alert('Nama pengguna sudah wujud dalam sistem.');
        return;
      }
    }

    try {
      setSaving(true);
      const updates = {
        full_name: editFullName,
        username: editUsername,
        phone_number: editPhoneNumber,
        phone: editPhoneNumber,
        updated_at: new Date().toISOString()
      };

      if (editPassword) {
        updates.password_hash = btoa(editPassword); // Record plain representation/mock hash setup
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      alert('Maklumat pengguna berjaya dikemaskini.');
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan kemas kini pengguna.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (user) => {
    const newPass = prompt(`Sila masukkan kata laluan baharu untuk pengguna ${user.email || user.username || 'ini'}:`);
    if (!newPass) return;
    if (newPass.length < 6) {
      alert('Kata laluan mesti melebihi 5 aksara.');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          password_hash: btoa(newPass),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      alert(`Kata laluan pengguna berjaya di tetapkan semula ke pangkalan data profil.`);
    } catch (err) {
      console.error(err);
      alert('Gagal menetapkan semula kata laluan.');
    }
  };

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase();
    return (u.email?.toLowerCase().includes(term) || 
            u.username?.toLowerCase().includes(term) || 
            u.full_name?.toLowerCase().includes(term) || 
            u.phone?.toLowerCase().includes(term) ||
            u.phone_number?.toLowerCase().includes(term));
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Pengurusan Pengguna Sistem</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Lihat, tapis, dan urus peranan serta status akaun komuniti.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40">
          <div className="relative flex-1 max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari Nama Penuh, Emel, Username, atau No Telefon..."
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="text-xs font-semibold text-slate-400 shrink-0 hidden sm:block">
            {filteredUsers.length} Pengguna
          </span>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Nama Penuh</th>
                <th className="px-6 py-4">Username</th>
                <th className="px-6 py-4">Emel</th>
                <th className="px-6 py-4">No Telefon</th>
                <th className="px-6 py-4">Peranan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    Tiada profil pengguna dijumpai yang sepadan dengan carian.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <span>{user.full_name || '-'}</span>
                      {user.id === currentUser?.id && (
                        <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full tracking-wider uppercase">
                          Anda
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {user.username ? `@${user.username}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                    {user.email || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {user.phone_number || user.phone || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      user.role === 'admin' 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40' 
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Awam'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-transform hover:scale-105 ${
                        user.status === 'inactive'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                      }`}
                      title="Klik untuk ubah status"
                    >
                      {user.status === 'inactive' ? <><UserX size={12} /> Tidak Aktif</> : <><UserCheck size={12} /> Aktif</>}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Sunting Pengguna"
                    >
                      <Edit size={14} />
                    </button>
                    
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-600 dark:text-amber-400 transition-colors"
                      title="Tetapkan Semula Kata Laluan"
                    >
                      <RefreshCw size={14} />
                    </button>

                    {user.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleToggleRole(user)}
                        className={`p-2 rounded-xl transition-colors ${
                          user.role === 'admin' 
                            ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400' 
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                        }`}
                        title={user.role === 'admin' ? "Demote ke Awam" : "Promote ke Admin"}
                      >
                        {user.role === 'admin' ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit className="text-emerald-600 dark:text-emerald-400" size={18} />
                <span>Sunting Profil: {selectedUser.email || selectedUser.username || 'Pengguna'}</span>
              </h3>
              <button 
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Nama Penuh
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-slate-400" size={16} />
                  </div>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-emerald-500"
                    placeholder="Nama penuh pengguna"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Username (Unik)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="text-slate-400" size={16} />
                  </div>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-emerald-500 font-mono"
                    placeholder="namapengguna"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Nombor Telefon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="text-slate-400" size={16} />
                  </div>
                  <input
                    type="tel"
                    value={editPhoneNumber}
                    onChange={(e) => setEditPhoneNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-emerald-500"
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Tukar Kata Laluan Hash (Pilihan)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="text-slate-400" size={16} />
                  </div>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-emerald-500"
                    placeholder="Biarkan kosong jika tiada pertukaran"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kemas Kini'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
