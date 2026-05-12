import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle, Landmark, Utensils, Box, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DonationsManager() {
  const [activeTab, setActiveTab] = useState('cash'); // 'cash', 'food', 'asset'
  const [cashDonations, setCashDonations] = useState([]);
  const [foodDonations, setFoodDonations] = useState([]);
  const [assetDonations, setAssetDonations] = useState([]);
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
      fetchAssetDonations()
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

  // Cash Donation Actions
  const handleCashStatus = async (id, status) => {
    if (!window.confirm(`Sahkan pertukaran status kepada ${status}?`)) return;
    await supabase.from('cash_donations').update({ status }).eq('id', id);
    fetchCashDonations();
  };

  // Asset Waqf Actions
  const handleAssetStatus = async (id, status) => {
    if (!window.confirm(`Sahkan pertukaran status kepada ${status}?`)) return;
    await supabase.from('asset_waqf_donations').update({ status }).eq('id', id);
    fetchAssetDonations();
  };

  // Food Donation Actions
  const handleFoodStatus = async (id, status) => {
    if (!window.confirm(`Sahkan pertukaran status kepada ${status}?`)) return;
    await supabase.from('food_donations').update({ status }).eq('id', id);
    fetchFoodDonations();
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
      slot: editFood.slot,
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
      return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-full">Disahkan</span>;
    if (s === 'pending') 
      return <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">Menunggu</span>;
    if (s === 'cancelled' || s === 'rejected') 
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Batal/Ditolak</span>;
    return <span className="px-2 py-1 bg-slate-100 text-slate-800 text-xs rounded-full">{status}</span>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pengurusan Sumbangan & Wakaf</h1>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('cash')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'cash' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'}`}>
          <Landmark size={18} /> Wang Ringgit
        </button>
        <button onClick={() => setActiveTab('food')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'food' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'}`}>
          <Utensils size={18} /> Jadual Sumbangan Makanan
        </button>
        <button onClick={() => setActiveTab('asset')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'asset' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'}`}>
          <Box size={18} /> Wakaf Aset
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute inset-y-0 left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama penyumbang..."
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'cash' && (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4">Tarikh</th>
                  <th className="px-6 py-4">Penyumbang</th>
                  <th className="px-6 py-4">Jumlah/Kaedah</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {cashDonations.filter(d => d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(d => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="px-6 py-4">{new Date(d.created_at).toLocaleDateString('ms-MY')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{d.donor_name}</td>
                    <td className="px-6 py-4">
                      <div className="text-emerald-600 font-bold">RM {d.amount}</div>
                      <div className="text-xs text-slate-500 uppercase">{d.payment_method}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {d.receipt_url && <a href={d.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 mr-2"><Eye size={18} className="inline"/></a>}
                      {d.status === 'pending' && (
                        <>
                          <button onClick={() => handleCashStatus(d.id, 'approved')} className="text-emerald-600 mr-2"><CheckCircle size={18} className="inline"/></button>
                          <button onClick={() => handleCashStatus(d.id, 'rejected')} className="text-red-600"><XCircle size={18} className="inline"/></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'food' && (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4">Tarikh & Slot</th>
                  <th className="px-6 py-4">Penaja</th>
                  <th className="px-6 py-4">Jenis Makanan</th>
                  <th className="px-6 py-4">Nota / Telefon</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {foodDonations.filter(d => d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(d => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="font-bold text-emerald-600">{new Date(d.date).toLocaleDateString('ms-MY')}</div>
                      <div className="text-xs text-slate-500 uppercase font-medium mt-0.5">{d.slot === 'breakfast' ? 'Sarapan' : d.slot === 'lunch' ? 'Makan Tengah Hari' : d.slot === 'dinner' ? 'Makan Malam' : d.slot}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{d.donor_name}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-300">{d.food_type || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="text-xs">{d.contact_number}</div>
                      <div className="text-xs text-slate-500">{d.notes}</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'pending' && <button onClick={() => handleFoodStatus(d.id, 'approved')} className="text-emerald-600 mr-2" title="Sahkan"><CheckCircle size={18} className="inline"/></button>}
                      <button onClick={() => setEditFood(d)} className="text-blue-600 mr-2" title="Kemaskini"><Edit2 size={18} className="inline"/></button>
                      <button onClick={() => handleFoodDelete(d.id)} className="text-red-600" title="Padam"><Trash2 size={18} className="inline"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'asset' && (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-4">Tarikh</th>
                  <th className="px-6 py-4">Pewakaf</th>
                  <th className="px-6 py-4">Aset Diwakafkan</th>
                  <th className="px-6 py-4">Kuantiti</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {assetDonations.filter(d => d.donor_name?.toLowerCase().includes(searchTerm.toLowerCase())).map(d => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="px-6 py-4">{new Date(d.created_at).toLocaleDateString('ms-MY')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{d.donor_name}</td>
                    <td className="px-6 py-4">{d.inventory?.item || 'Aset Tidak Diketahui'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{d.quantity} Unit</td>
                    <td className="px-6 py-4">{getStatusBadge(d.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {d.status === 'pending' && (
                        <>
                          <button onClick={() => handleAssetStatus(d.id, 'approved')} className="text-emerald-600 mr-2"><CheckCircle size={18} className="inline"/></button>
                          <button onClick={() => handleAssetStatus(d.id, 'rejected')} className="text-red-600"><XCircle size={18} className="inline"/></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {editFood && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Kemaskini Jadual Sumbangan Makanan</h2>
            <form onSubmit={handleFoodEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tarikh Slot</label>
                <input type="date" value={editFood.date} onChange={e => setEditFood({...editFood, date: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Pilih Slot</label>
                <select value={editFood.slot} onChange={e => setEditFood({...editFood, slot: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" required>
                  <option value="breakfast">Sarapan</option>
                  <option value="lunch">Makan Tengah Hari</option>
                  <option value="dinner">Makan Malam</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nama Penaja</label>
                <input type="text" value={editFood.donor_name} onChange={e => setEditFood({...editFood, donor_name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Jenis Makanan</label>
                <input type="text" value={editFood.food_type || ''} onChange={e => setEditFood({...editFood, food_type: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">No. Telefon</label>
                <input type="text" value={editFood.contact_number} onChange={e => setEditFood({...editFood, contact_number: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nota</label>
                <textarea value={editFood.notes || ''} onChange={e => setEditFood({...editFood, notes: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setEditFood(null)} className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
