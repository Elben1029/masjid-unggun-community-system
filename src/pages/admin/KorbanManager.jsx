import { 
  ClipboardList, Users, UserPlus, Check, X, Edit, Trash2, Box, 
  MapPin, Plus, Save, History, ChevronRight, Filter, Search, 
  Settings, UserCheck, UserMinus, AlertCircle, RefreshCcw 
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function KorbanManager() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'donors', 'parts', 'receivers', 'logs'
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [parts, setParts] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total_donors: 0, total_shares: 0, pending_approval: 0 });

  // Modal/Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'add_part', 'add_receiver'
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'pending' || activeTab === 'donors') {
        const { data, error } = await supabase
          .from('korban_donors')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRegistrations(data || []);
        
        // Update stats
        const pending = data.filter(d => d.status === 'pending').length;
        const total = data.length;
        const shares = data.reduce((acc, curr) => acc + (curr.shares || 0), 0);
        setStats({ total_donors: total, total_shares: shares, pending_approval: pending });
      } else if (activeTab === 'parts') {
        const { data, error } = await supabase
          .from('korban_parts')
          .select(`
            *,
            receiver:korban_receivers(full_name),
            assignments:korban_assignments(
              donor:korban_donors(full_name, status)
            )
          `)
          .order('part_number', { ascending: true });
        if (error) throw error;
        setParts(data || []);
      } else if (activeTab === 'receivers') {
        const { data, error } = await supabase.from('korban_receivers').select('*').order('full_name');
        if (error) throw error;
        setReceivers(data || []);
      } else if (activeTab === 'logs') {
        const { data, error } = await supabase
          .from('korban_logs')
          .select('*, admin:profiles(full_name)')
          .order('timestamp', { ascending: false });
        if (error) throw error;
        setLogs(data || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const { error } = await supabase
        .from('korban_donors')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      await logAction(`Update Donor Status`, `Changed donor ${id} status to ${status}`);
      fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  }

  async function logAction(type, description) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('korban_logs').insert([{
        admin_id: user.id,
        action_type: type,
        action_description: description
      }]);
    } catch (err) {
      console.error("Error logging action:", err);
    }
  }

  async function removeDonor(id) {
    if (!confirm("Adakah anda pasti mahu memadam rekod ini?")) return;
    try {
      const { error } = await supabase.from('korban_donors').delete().eq('id', id);
      if (error) throw error;
      await logAction(`Delete Donor`, `Deleted donor ${id}`);
      fetchData();
    } catch (err) {
      console.error("Error deleting donor:", err);
    }
  }

  const openAddModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Box className="text-emerald-600" size={32} />
            Pengurusan Korban
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Sistem Pengurusan Ibadah Korban Masjid Unggun</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'parts' && (
            <button 
              onClick={() => openAddModal('add_part')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
              <Plus size={20} /> Tambah Bahagian
            </button>
          )}
          {activeTab === 'receivers' && (
            <button 
              onClick={() => openAddModal('add_receiver')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all">
              <Plus size={20} /> Tambah Penerima
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Menunggu Kelulusan</p>
          <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400">{stats.pending_approval}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Peserta</p>
          <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.total_donors}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Bahagian</p>
          <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stats.total_shares}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {[
          { id: 'pending', label: 'Kelulusan', icon: UserCheck },
          { id: 'donors', label: 'Senarai Donors', icon: Users },
          { id: 'parts', label: 'Bahagian & Agihan', icon: Box },
          { id: 'receivers', label: 'Penerima', icon: MapPin },
          { id: 'logs', label: 'Log Aktiviti', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-xl' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Memuatkan data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'pending' || activeTab === 'donors' ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Nama Peserta</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Pakej</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Status</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Tarikh</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === 'pending' ? registrations.filter(r => r.status === 'pending') : registrations).map(reg => (
                    <tr key={reg.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-5">
                        <div className="font-bold text-slate-900 dark:text-white">{reg.full_name}</div>
                        <div className="text-xs text-slate-500">{reg.phone}</div>
                      </td>
                      <td className="p-5">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{reg.package_type} ({reg.shares})</span>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          reg.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-5 text-sm text-slate-500">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-right space-x-2">
                        {reg.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => updateStatus(reg.id, 'approved')}
                              className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors" title="Lulus">
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => updateStatus(reg.id, 'rejected')}
                              className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors" title="Tolak">
                              <X size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => removeDonor(reg.id)}
                          className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors" title="Padam">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {((activeTab === 'pending' ? registrations.filter(r => r.status === 'pending') : registrations).length === 0) && (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 font-medium">Tiada pendaftaran dijumpai.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeTab === 'parts' ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parts.map(part => (
                  <div key={part.id} className="border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bahagian {part.part_number}</h3>
                        <p className="text-xs text-slate-500">{part.animal_type}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-600">{part.current_shares}/{part.max_shares}</span>
                        <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${(part.current_shares / part.max_shares) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Penerima</p>
                      <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <MapPin size={14} className="text-slate-400" />
                        {part.receiver?.full_name || 'Belum Ditetapkan'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peserta</p>
                      {part.assignments?.length > 0 ? (
                        <div className="space-y-1">
                          {part.assignments.map((asgn, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                              <span className="font-medium">{asgn.donor.full_name}</span>
                              <button className="text-red-500 hover:text-red-600"><UserMinus size={12} /></button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Belum ada agihan</p>
                      )}
                    </div>

                    <button className="w-full mt-4 py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1">
                      <Plus size={14} /> Tambah Peserta
                    </button>
                  </div>
                ))}
              </div>
            ) : activeTab === 'receivers' ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Nama Penerima</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Lokasi</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Hubungan</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {receivers.map(rec => (
                    <tr key={rec.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-5 font-bold text-slate-900 dark:text-white">{rec.full_name}</td>
                      <td className="p-5 text-sm text-slate-600 dark:text-slate-400">{rec.village_location}</td>
                      <td className="p-5 text-sm text-slate-600 dark:text-slate-400">{rec.contact_info}</td>
                      <td className="p-5 text-right space-x-2">
                        <button className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg"><Edit size={16} /></button>
                        <button className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeTab === 'logs' ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Admin</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Tindakan</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Deskripsi</th>
                    <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Masa</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-5 text-sm font-bold text-slate-900 dark:text-white">{log.admin?.full_name || 'Admin'}</td>
                      <td className="p-5">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold uppercase">{log.action_type}</span>
                      </td>
                      <td className="p-5 text-sm text-slate-500">{log.action_description}</td>
                      <td className="p-5 text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        )}
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {modalType === 'add_part' ? <Box className="text-emerald-500" /> : <MapPin className="text-emerald-500" />}
                {modalType === 'add_part' ? 'Tambah Bahagian Korban' : 'Tambah Penerima Agihan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              
              setLoading(true);
              try {
                const table = modalType === 'add_part' ? 'korban_parts' : 'korban_receivers';
                const { error } = await supabase.from(table).insert([data]);
                if (error) throw error;
                
                await logAction(`Add ${modalType}`, `Added new ${modalType.split('_')[1]}`);
                setIsModalOpen(false);
                fetchData();
              } catch (err) {
                console.error("Error saving:", err);
                alert("Ralat semasa menyimpan. Sila cuba lagi.");
              } finally {
                setLoading(false);
              }
            }} className="p-8 space-y-6">
              {modalType === 'add_part' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">No. Bahagian (cth: B01)</label>
                    <input name="part_number" required className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jenis Haiwan</label>
                      <select name="animal_type" className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white">
                        <option value="Lembu">Lembu</option>
                        <option value="Kambing">Kambing</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Max Bahagian</label>
                      <input name="max_shares" type="number" defaultValue="7" className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Penerima</label>
                    <select name="receiver_id" className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white">
                      <option value="">Pilih Penerima (Opsional)</option>
                      {receivers.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Penuh Penerima</label>
                    <input name="full_name" required className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Lokasi/Kampung</label>
                    <input name="village_location" className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Maklumat Hubungan</label>
                    <input name="contact_info" className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-2 ring-emerald-500/20 focus:border-emerald-500 transition-all dark:text-white" />
                  </div>
                </>
              )}
              
              <div className="pt-6 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Rekod'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
