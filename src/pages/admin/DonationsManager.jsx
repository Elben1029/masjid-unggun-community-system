import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Landmark, Utensils, Box, Edit2, Trash2, Calendar as CalendarIcon, CheckCircle2, MoreVertical } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DonationsManager() {
  const [activeTab, setActiveTab] = useState('cash'); // 'cash', 'food', 'asset'
  const [cashDonations, setCashDonations] = useState([]);
  const [foodDonations, setFoodDonations] = useState([]);
  const [assetDonations, setAssetDonations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit Food Modal
  const [editFood, setEditFood] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    await Promise.all([
      fetchCashDonations(),
      fetchFoodDonations(),
      fetchAssetDonations(),
      fetchInventory()
    ]);
    setLoading(false);
  }

  async function fetchCashDonations() {
    const { data, error } = await supabase
      .from('cash_donations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setCashDonations(data || []);
  }

  async function fetchFoodDonations() {
    const { data, error } = await supabase
      .from('food_donations')
      .select('*')
      .order('date', { ascending: true });
    if (!error) setFoodDonations(data || []);
  }

  async function fetchAssetDonations() {
    const { data, error } = await supabase
      .from('asset_waqf_donations')
      .select('*, inventory(item)')
      .order('created_at', { ascending: false });
    if (!error) setAssetDonations(data || []);
  }

  async function fetchInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*');
    if (!error) setInventory(data || []);
  }

  // Common status update handler
  const handleUpdateStatus = async (table, id, status) => {
    if (!window.confirm(`Sahkan pertukaran status kepada ${status}?`)) return;
    const { error } = await supabase.from(table).update({ status }).eq('id', id);
    if (error) {
      alert("Gagal mengemaskini status.");
    } else {
      fetchData();
    }
  };

  const handleFoodDelete = async (id) => {
    if (!window.confirm(`Adakah anda pasti mahu memadam rekod ini secara kekal?`)) return;
    await supabase.from('food_donations').delete().eq('id', id);
    fetchFoodDonations();
  };

  const handleFoodEditSave = async (e) => {
    e.preventDefault();
    await supabase.from('food_donations').update({
      date: editFood.date,
      donor_name: editFood.donor_name,
      food_type: editFood.food_type,
      contact_number: editFood.contact_number,
      notes: editFood.notes
    }).eq('id', editFood.id);
    setEditFood(null);
    fetchFoodDonations();
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'approved' || s === 'completed' || s === 'verified') 
      return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded-full">Selesai</span>;
    if (s === 'pending') 
      return <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full">Baru</span>;
    if (s === 'rejected' || s === 'cancelled') 
      return <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold uppercase rounded-full">Batal</span>;
    return <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-full">{status}</span>;
  };

  // Calculate stats
  const stats = {
    totalCash: cashDonations
      .filter(d => d.status === 'approved' && new Date(d.created_at).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + Number(curr.amount), 0),
    foodSponsorships: foodDonations.filter(d => new Date(d.date) >= new Date()).length,
    pendingWaqf: assetDonations.filter(d => d.status === 'pending').length
  };

  const statsCards = [
    { 
      title: 'Kutipan Tunai (Bulan Ini)', 
      value: `RM ${stats.totalCash.toLocaleString()}`, 
      icon: <Landmark className="text-emerald-600" />,
      color: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    { 
      title: 'Tajaan Makanan Mendatang', 
      value: `${stats.foodSponsorships} Slot`, 
      icon: <Utensils className="text-blue-600" />,
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    { 
      title: 'Permohonan Wakaf Baru', 
      value: `${stats.pendingWaqf} Menunggu`, 
      icon: <Box className="text-amber-600" />,
      color: 'bg-amber-50 dark:bg-amber-900/20'
    }
  ];

  const filteredCash = cashDonations.filter(d => d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredFood = foodDonations.filter(d => d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredAsset = assetDonations.filter(d => d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pengurusan Sumbangan</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Pantau dan urus semua jenis sumbangan dari komuniti.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {statsCards.map((card, idx) => (
          <div key={idx} className={`${card.color} p-8 rounded-[32px] border border-white/10 shadow-sm flex items-center gap-6 group hover:scale-[1.02] transition-all`}>
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{card.title}</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl inline-flex gap-1 mb-8 shadow-inner">
        <button 
          onClick={() => setActiveTab('cash')} 
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'cash' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          <Landmark size={18} /> Tunai
        </button>
        <button 
          onClick={() => setActiveTab('food')} 
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'food' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          <Utensils size={18} /> Makanan
        </button>
        <button 
          onClick={() => setActiveTab('asset')} 
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'asset' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        >
          <Box size={18} /> Wakaf Aset
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden min-h-[500px]">
        {/* Search Header */}
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="relative max-w-md">
            <Search className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama penyumbang..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'cash' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Tarikh</th>
                  <th className="px-8 py-5">Penyumbang</th>
                  <th className="px-8 py-5">Jumlah/Kaedah</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredCash.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400">Tiada sumbangan tunai dijumpai.</td></tr>
                ) : filteredCash.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-5 text-slate-400 text-xs font-medium">{new Date(d.created_at).toLocaleDateString('ms-MY')}</td>
                    <td className="px-8 py-5 font-bold text-slate-800 dark:text-white">{d.donor_name}</td>
                    <td className="px-8 py-5">
                      <div className="text-emerald-600 font-black">RM {d.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{d.payment_method}</div>
                    </td>
                    <td className="px-8 py-5">{getStatusBadge(d.status)}</td>
                    <td className="px-8 py-5 text-right">
                      {d.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleUpdateStatus('cash_donations', d.id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Sahkan"><CheckCircle2 size={18} /></button>
                          <button onClick={() => handleUpdateStatus('cash_donations', d.id, 'rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Tolak"><XCircle size={18} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'food' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Tarikh Tajaan</th>
                  <th className="px-8 py-5">Penaja</th>
                  <th className="px-8 py-5">Menu / Nota</th>
                  <th className="px-8 py-5">Hubungi</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredFood.length === 0 ? (
                  <tr><td colSpan="6" className="px-8 py-20 text-center text-slate-400">Tiada tajaan makanan dijumpai.</td></tr>
                ) : filteredFood.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-emerald-600 font-black">
                        <CalendarIcon size={14} />
                        {new Date(d.date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-800 dark:text-white">{d.donor_name}</td>
                    <td className="px-8 py-5 max-w-xs">
                      <div className="text-slate-900 dark:text-slate-200 font-bold truncate">{d.food_type || 'Menu Am'}</div>
                      <div className="text-[11px] text-slate-400 italic line-clamp-1">{d.notes}</div>
                    </td>
                    <td className="px-8 py-5 text-slate-500 font-mono text-xs">{d.contact_number}</td>
                    <td className="px-8 py-5">{getStatusBadge(d.status)}</td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        {d.status === 'pending' && <button onClick={() => handleUpdateStatus('food_donations', d.id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Sahkan"><CheckCircle2 size={18} /></button>}
                        <button onClick={() => setEditFood(d)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="Kemaskini"><Edit2 size={18} /></button>
                        <button onClick={() => handleFoodDelete(d.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Padam"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'asset' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-8 py-5">Tarikh</th>
                  <th className="px-8 py-5">Pewakaf</th>
                  <th className="px-8 py-5">Aset Diwakafkan</th>
                  <th className="px-8 py-5">Kuantiti</th>
                  <th className="px-8 py-5">Progress Item</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredAsset.length === 0 ? (
                  <tr><td colSpan="7" className="px-8 py-20 text-center text-slate-400">Tiada rekod wakaf aset dijumpai.</td></tr>
                ) : filteredAsset.map(d => {
                  const item = inventory.find(i => i.id === d.inventory_id);
                  const progress = item ? Math.min(100, Math.round((item.received_quantity / item.needed_quantity) * 100)) : 0;
                  return (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-8 py-5 text-slate-400 text-xs font-medium">{new Date(d.created_at).toLocaleDateString('ms-MY')}</td>
                      <td className="px-8 py-5 font-bold text-slate-800 dark:text-white">{d.donor_name}</td>
                      <td className="px-8 py-5 font-bold text-emerald-600">{item?.item || 'Aset Masjid'}</td>
                      <td className="px-8 py-5 font-black text-slate-900 dark:text-white">{d.quantity} Unit</td>
                      <td className="px-8 py-5">
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span className="text-emerald-600">{item?.received_quantity}/{item?.needed_quantity}</span>
                            <span className="text-slate-400">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">{getStatusBadge(d.status)}</td>
                      <td className="px-8 py-5 text-right">
                        {d.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleUpdateStatus('asset_waqf_donations', d.id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Terima"><CheckCircle2 size={18} /></button>
                            <button onClick={() => handleUpdateStatus('asset_waqf_donations', d.id, 'rejected')} className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Tolak"><XCircle size={18} /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white tracking-tight">Kemaskini Penajaan Makanan</h2>
              <button onClick={() => setEditFood(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <XCircle size={24} />
              </button>
            </div>
            
            <form onSubmit={handleFoodEditSave} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Tarikh Penajaan</label>
                  <input type="date" value={editFood.date} onChange={e => setEditFood({...editFood, date: e.target.value})} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Penaja / Kumpulan</label>
                  <input type="text" value={editFood.donor_name} onChange={e => setEditFood({...editFood, donor_name: e.target.value})} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Menu Makanan</label>
                  <input type="text" value={editFood.food_type || ''} onChange={e => setEditFood({...editFood, food_type: e.target.value})} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" placeholder="Cth: Nasi Lemak" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">No. Telefon</label>
                  <input type="text" value={editFood.contact_number} onChange={e => setEditFood({...editFood, contact_number: e.target.value})} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nota / Hajat</label>
                  <textarea value={editFood.notes || ''} onChange={e => setEditFood({...editFood, notes: e.target.value})} className="w-full px-4 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none" placeholder="Masukkan nota tambahan..."></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditFood(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all">Batal</button>
                <button type="submit" className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 active:scale-95">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
