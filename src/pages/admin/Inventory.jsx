import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Image as ImageIcon, Box, HeartHandshake, AlertCircle, CheckCircle2, MoreVertical, LayoutGrid, List as ListIcon, Filter } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' or 'needed'
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [currentId, setCurrentId] = useState(null);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Kelengkapan Solat');
  const [quantity, setQuantity] = useState(0);
  const [itemCondition, setItemCondition] = useState('Baik');
  const [status, setStatus] = useState('Available');
  const [urgencyLevel, setUrgencyLevel] = useState('Normal');
  const [waqfEnabled, setWaqfEnabled] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Waqf Fields
  const [isNeeded, setIsNeeded] = useState(false);
  const [neededQuantity, setNeededQuantity] = useState(0);

  useEffect(() => {
    fetchInventory();

    const subscription = supabase
      .channel('inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => {
        fetchInventory();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchInventory() {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventory(data || []);
    }
  }

  const resetForm = () => {
    setCurrentId(null);
    setItem('');
    setCategory('Kelengkapan Solat');
    setQuantity(0);
    setItemCondition('Baik');
    setStatus('Available');
    setUrgencyLevel('Normal');
    setWaqfEnabled(false);
    setIsNeeded(false);
    setNeededQuantity(0);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleOpenModal = (invItem = null) => {
    if (invItem) {
      setCurrentId(invItem.id);
      setItem(invItem.item || '');
      setCategory(invItem.category || 'Kelengkapan Solat');
      setQuantity(invItem.quantity || 0);
      setItemCondition(invItem.item_condition || 'Baik');
      setStatus(invItem.status || 'Available');
      setUrgencyLevel(invItem.urgency_level || 'Normal');
      setWaqfEnabled(invItem.waqf_enabled || false);
      setIsNeeded(invItem.is_needed || false);
      setNeededQuantity(invItem.needed_quantity || 0);
      setImagePreview(invItem.image_url || null);
      setImageFile(null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = imagePreview;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('inventory')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('inventory')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const invData = { 
        item, 
        category, 
        quantity: Number(quantity), 
        item_condition: itemCondition,
        status,
        urgency_level: urgencyLevel,
        waqf_enabled: waqfEnabled,
        is_needed: isNeeded || waqfEnabled,
        needed_quantity: Number(neededQuantity),
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };
      
      if (currentId) {
        const { error } = await supabase
          .from('inventory')
          .update(invData)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([invData]);
        if (error) throw error;
      }

      handleCloseModal();
    } catch (err) {
      console.error("Error saving inventory: ", err);
      alert("Gagal menyimpan inventori. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Adakah anda pasti mahu memadam item ini secara kekal?')) {
      try {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Error deleting item: ", err);
        alert("Gagal memadam item.");
      }
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Available': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase">Tersedia</span>;
      case 'Low Stock': return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-[10px] font-bold uppercase">Stok Rendah</span>;
      case 'Needs Replacement': return <span className="px-2 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-full text-[10px] font-bold uppercase">Perlu Ganti</span>;
      case 'Under Maintenance': return <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase">Penyelenggaraan</span>;
      case 'Needed for Donation': return <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-[10px] font-bold uppercase">Perlu Sumbangan</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-[10px] font-bold uppercase">{status}</span>;
    }
  };

  const getUrgencyBadge = (level) => {
    switch(level) {
      case 'Urgent': return <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold text-xs"><AlertCircle size={14} /> Kecemasan</span>;
      case 'Needed': return <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs"><AlertCircle size={14} /> Diperlukan</span>;
      case 'Replacement Required': return <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold text-xs"><AlertCircle size={14} /> Perlu Ganti</span>;
      default: return null;
    }
  };

  const filteredInventory = inventory.filter(inv => 
    inv.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assets = filteredInventory.filter(inv => !inv.is_needed || inv.quantity > 0);
  const needed = filteredInventory.filter(inv => inv.is_needed || inv.waqf_enabled);

  const displayItems = activeTab === 'assets' ? assets : needed;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pengurusan Aset & Wakaf</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Urus inventori fizikal dan keperluan sumbangan masjid secara berpusat.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          <Plus size={20} />
          Tambah Aset Baru
        </button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl inline-flex gap-1 shadow-inner">
          <button 
            onClick={() => setActiveTab('assets')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'assets' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Box size={18} /> 
            Inventori Fizikal
          </button>
          <button 
            onClick={() => setActiveTab('needed')} 
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'needed' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <HeartHandshake size={18} /> 
            Keperluan Sumbangan
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute inset-y-0 left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari item atau kategori..."
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setViewType('grid')} className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewType('table')} className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400'}`}><ListIcon size={20} /></button>
          </div>
        </div>
      </div>

      {loading && !inventory.length ? (
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Box className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tiada Item Dijumpai</h3>
          <p className="text-slate-500 mt-2">Mula menambah item ke dalam sistem pengurusan aset anda.</p>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {displayItems.map((inv) => {
            const progress = inv.is_needed ? Math.min(100, Math.round((inv.received_quantity / inv.needed_quantity) * 100)) : 0;
            return (
              <div key={inv.id} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {inv.image_url ? (
                    <img src={inv.image_url} alt={inv.item} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                      <Box size={48} />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {getStatusBadge(inv.status)}
                    {inv.urgency_level !== 'Normal' && (
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                        inv.urgency_level === 'Urgent' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {inv.urgency_level}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(inv)} className="p-2 bg-white/90 dark:bg-slate-900/90 rounded-full shadow-lg text-emerald-600 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{inv.category}</span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 mt-0.5">{inv.item}</h3>
                  </div>

                  <div className="space-y-3 mt-auto">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 dark:text-slate-400">Stok Semasa:</span>
                      <span className="font-bold text-slate-800 dark:text-white">{inv.quantity} Unit</span>
                    </div>

                    {inv.is_needed && (
                      <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex justify-between text-[10px] font-bold mb-1">
                          <span className="text-emerald-600 dark:text-emerald-400">Wakaf: {inv.received_quantity} / {inv.needed_quantity}</span>
                          <span className="text-slate-400">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Item & Kategori</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Kuantiti</th>
                <th className="px-6 py-4">Keadaan</th>
                <th className="px-6 py-4">Wakaf Progress</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayItems.map((inv) => {
                const progress = inv.is_needed ? Math.min(100, Math.round((inv.received_quantity / inv.needed_quantity) * 100)) : 0;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                          {inv.image_url ? <img src={inv.image_url} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-2 text-slate-300" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{inv.item}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-medium">{inv.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{inv.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        inv.item_condition === 'Baik' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>{inv.item_condition}</span>
                    </td>
                    <td className="px-6 py-4">
                      {inv.is_needed ? (
                        <div className="w-32">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-bold text-emerald-600">{inv.received_quantity}/{inv.needed_quantity}</span>
                            <span className="text-slate-400">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      ) : <span className="text-slate-300 text-xs">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleOpenModal(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {currentId ? 'Kemaskini Maklumat Aset' : 'Tambah Aset Baharu'}
                </h2>
                <p className="text-sm text-slate-500 mt-1">Lengkapkan butiran aset atau keperluan sumbangan di bawah.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Item</label>
                  <input 
                    type="text" 
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="w-full px-5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                    placeholder="Contoh: Sajadah Karpet Panjang" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Kelengkapan Solat">Kelengkapan Solat</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Perabot">Perabot</option>
                    <option value="Kitab">Kitab</option>
                    <option value="Pembersihan">Pembersihan</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Stok Sedia Ada (Unit)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Keadaan Item</label>
                  <select 
                    value={itemCondition}
                    onChange={(e) => setItemCondition(e.target.value)}
                    className="w-full px-5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Sederhana">Sederhana</option>
                    <option value="Perlu Dibaiki">Perlu Dibaiki</option>
                    <option value="Rosak">Rosak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Status Inventori</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-5 py-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  >
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Needs Replacement">Needs Replacement</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Needed for Donation">Needed for Donation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50/50 dark:bg-emerald-950/10 p-6 rounded-[24px] border border-emerald-100 dark:border-emerald-900/30">
                <div className="md:col-span-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 rounded-xl">
                      <HeartHandshake size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-800 dark:text-emerald-400">Aktifkan Sebagai Wakaf Aset</h4>
                      <p className="text-xs text-emerald-600/70">Item akan dipaparkan dalam senarai sumbangan awam.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={waqfEnabled} onChange={(e) => setWaqfEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                
                {waqfEnabled && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-emerald-800/60 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Kuantiti Sasaran</label>
                      <input 
                        type="number" 
                        min="1"
                        required={waqfEnabled}
                        value={neededQuantity}
                        onChange={(e) => setNeededQuantity(e.target.value)}
                        className="w-full px-5 py-4 border border-emerald-200 dark:border-emerald-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-800/60 dark:text-emerald-400 uppercase tracking-widest mb-2 ml-1">Tahap Urgensi</label>
                      <select 
                        value={urgencyLevel}
                        onChange={(e) => setUrgencyLevel(e.target.value)}
                        className="w-full px-5 py-4 border border-emerald-200 dark:border-emerald-800 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      >
                        <option value="Normal">Normal</option>
                        <option value="Needed">Needed</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Replacement Required">Replacement Required</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Gambar Aset (PNG / JPG)</label>
                <div className="flex gap-4 items-start">
                  {imagePreview && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm relative group">
                      <img src={imagePreview} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => {setImageFile(null); setImagePreview(null);}} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Trash2 size={16} /></button>
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all group">
                      <Upload className="text-slate-400 group-hover:text-emerald-500 transition-colors" size={24} />
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Muat Naik Gambar Baru</div>
                      <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-8 py-4 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Sila Tunggu...' : (currentId ? 'Kemaskini Aset' : 'Simpan Aset')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
