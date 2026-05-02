import { useState, useEffect } from 'react';
import { Search, Shield, ShieldOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();

    const subscription = supabase
      .channel('profiles_changes')
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
    if (window.confirm(`Adakah anda pasti mahu menukar peranan pengguna ini kepada ${newRole}?`)) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', user.id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Error updating role:", err);
        alert("Gagal menukar peranan pengguna.");
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pengurusan Pengguna</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari emel atau nombor telefon..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Peranan</th>
                <th className="px-6 py-4">Tarikh Daftar</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Tiada pengguna dijumpai.</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {user.email || user.phone || 'Tiada Maklumat'}
                    {user.id === currentUser?.id && <span className="ml-2 text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Anda</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'Awam'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentUser?.id && (
                      <button 
                        onClick={() => handleToggleRole(user)}
                        className={`p-1.5 rounded-lg flex items-center gap-1.5 ml-auto text-xs font-medium transition-colors ${
                          user.role === 'admin' 
                            ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40' 
                            : 'text-teal-600 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40'
                        }`}
                        title="Tukar Peranan"
                      >
                        {user.role === 'admin' ? <><ShieldOff size={14} /> Demote to Public</> : <><Shield size={14} /> Promote to Admin</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
