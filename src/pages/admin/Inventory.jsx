import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Image as ImageIcon, Box, HeartHandshake, AlertCircle, CheckCircle2, MoreVertical, LayoutGrid, List as ListIcon, Filter, Info, Package, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Inventory() {
  const [activeSection, setActiveSection] = useState('assets'); // 'assets' or 'needed'
  const [viewType, setViewType] = useState('grid');
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('asset'); // 'asset' or 'needed'
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [currentId, setCurrentId] = useState(null);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Lain-lain');
  const [quantity, setQuantity] = useState(0);
  const [itemCondition, setItemCondition] = useState('Baik');
  const [status, setStatus] = useState('Available');
  const [urgencyLevel, setUrgencyLevel] = useState('Biasa'); // Biasa, Penting, Sangat Diperlukan
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Needed Item Specifics
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
    setCategory('Lain-lain');
    setQuantity(0);
    setItemCondition('Baik');
    setStatus('Available');
    setUrgencyLevel('Biasa');
    setNeededQuantity(0);
    setImageFile(null);
    setImagePreview(null);
    setNotes('');
  };

  const handleOpenModal = (mode, invItem = null) => {
    setModalMode(mode);
    if (invItem) {
      setCurrentId(invItem.id);
      setItem(invItem.item || '');
      setCategory(invItem.category || 'Lain-lain');
      setQuantity(invItem.quantity || 0);
      setItemCondition(invItem.item_condition || 'Baik');
      setStatus(invItem.status || 'Available');
      setUrgencyLevel(invItem.urgency_level || 'Biasa');
      setNeededQuantity(invItem.needed_quantity || 0);
      setNotes(invItem.location || ''); // Using location field for notes/description
      setImagePreview(invItem.image_url || null);
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
        image_url: imageUrl,
        location: notes, // Store notes in location field
        updated_at: new Date().toISOString()
      };

      if (modalMode === 'asset') {
        invData.quantity = Number(quantity);
        invData.item_condition = itemCondition;
        invData.is_needed = false;
        invData.waqf_enabled = false;
        invData.status = itemCondition === 'Rosak' ? 'Needs Replacement' : 'Available';
      } else {
        invData.is_needed = true;
        invData.waqf_enabled = true;
        invData.needed_quantity = Number(neededQuantity);
        invData.urgency_level = urgencyLevel;
        invData.status = 'Needed for Donation';
      }

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
      alert("Gagal menyimpan data. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Adakah anda pasti mahu memadam item ini?')) {
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

  const filteredInventory = inventory.filter(inv => 
    inv.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assets = filteredInventory.filter(inv => !inv.is_needed);
  const neededItems = filteredInventory.filter(inv => inv.is_needed);

  const displayItems = activeSection === 'assets' ? assets : neededItems;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Package className="text-emerald-600" size={36} />
            Pengurusan Inventori
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Urus aset sedia ada dan keperluan sumbangan masjid dengan mudah.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => handleOpenModal('asset')}
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-800 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:border-emerald-500 transition-all active:scale-95 shadow-sm"
          >
            <Plus size={20} className="text-emerald-600" />
            Tambah Aset Masjid
          </button>
          <button 
            onClick={() => handleOpenModal('needed')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <HeartHandshake size={20} />
            Tambah Barang Diperlukan
          </button>
        </div>
      </div>

      {/* Section Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px] inline-flex gap-1 shadow-inner border border-slate-200/50 dark:border-slate-700/30">
          <button 
            onClick={() => setActiveSection('assets')} 
            className={`flex items-center gap-2 px-8 py-3 rounded-[20px] font-black transition-all duration-300 ${activeSection === 'assets' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Box size={20} /> 
            Senarai Aset Masjid
          </button>
          <button 
            onClick={() => setActiveSection('needed')} 
            className={`flex items-center gap-2 px-8 py-3 rounded-[20px] font-black transition-all duration-300 ${activeSection === 'needed' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <Sparkles size={20} /> 
            Barang Diperlukan (Wakaf)
          </button>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute inset-y-0 left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari item..."
              className="w-full pl-12 pr-4 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 transition-all outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/30">
            <button onClick={() => setViewType('grid')} className={`p-2.5 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewType('table')} className={`p-2.5 rounded-lg transition-all ${viewType === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400'}`}><ListIcon size={20} /></button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {loading && !inventory.length ? (
        <div className="flex justify-center py-32">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[40px] p-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Box className="text-slate-300 dark:text-slate-700" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Tiada Item Dijumpai</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">Sila tambah item baru ke dalam kategori ini.</p>
        </div>
      ) : viewType === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {displayItems.map((inv) => {
            const progress = inv.is_needed ? Math.min(100, Math.round((inv.received_quantity / inv.needed_quantity) * 100)) : 0;
            return (
              <div key={inv.id} className="group bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col">
                <div className="aspect-[4/3] relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {inv.image_url ? (
                    <img src={inv.image_url} alt={inv.item} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                      <Box size={48} strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {activeSection === 'assets' ? (
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${
                        inv.item_condition === 'Baik' ? 'bg-emerald-500 text-white' : 
                        inv.item_condition === 'Rosak' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {inv.item_condition}
                      </span>
                    ) : (
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${
                        inv.urgency_level === 'Sangat Diperlukan' ? 'bg-rose-600 text-white animate-pulse' : 
                        inv.urgency_level === 'Penting' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {inv.urgency_level}
                      </span>
                    )}
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(activeSection === 'assets' ? 'asset' : 'needed', inv)} className="p-3 bg-white/95 dark:bg-slate-900/95 rounded-full shadow-xl text-emerald-600 hover:scale-110 transition-all">
                      <Edit2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-white line-clamp-1 leading-tight group-hover:text-emerald-600 transition-colors">{inv.item}</h3>
                    {inv.location && <p className="text-xs text-slate-400 mt-2 line-clamp-2 italic">{inv.location}</p>}
                  </div>

                  <div className="space-y-4 mt-auto">
                    {activeSection === 'assets' ? (
                      <div className="flex justify-between items-center py-3 border-t border-slate-50 dark:border-slate-800">
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Kuantiti:</span>
                        <span className="font-black text-xl text-slate-900 dark:text-white">{inv.quantity} <span className="text-sm font-normal">Unit</span></span>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status Sumbangan</p>
                            <p className="font-black text-lg text-emerald-600">{inv.received_quantity} / {inv.needed_quantity} <span className="text-xs text-slate-400 font-normal">Unit</span></p>
                          </div>
                          <span className="text-xl font-black text-slate-900 dark:text-white">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                          <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
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
        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-8 py-6">Item</th>
                <th className="px-8 py-6">{activeSection === 'assets' ? 'Keadaan' : 'Tahap Urgensi'}</th>
                <th className="px-8 py-6">{activeSection === 'assets' ? 'Kuantiti' : 'Progress'}</th>
                <th className="px-8 py-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {displayItems.map((inv) => {
                const progress = inv.is_needed ? Math.min(100, Math.round((inv.received_quantity / inv.needed_quantity) * 100)) : 0;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                          {inv.image_url ? <img src={inv.image_url} className="w-full h-full object-cover" /> : <Box className="w-full h-full p-3 text-slate-300" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-base">{inv.item}</p>
                          {inv.location && <p className="text-[10px] text-slate-400 line-clamp-1 italic">{inv.location}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {activeSection === 'assets' ? (
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          inv.item_condition === 'Baik' ? 'bg-emerald-50 text-emerald-700' : 
                          inv.item_condition === 'Rosak' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>{inv.item_condition}</span>
                      ) : (
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          inv.urgency_level === 'Sangat Diperlukan' ? 'bg-rose-50 text-rose-700' : 
                          inv.urgency_level === 'Penting' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                        }`}>{inv.urgency_level}</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      {activeSection === 'assets' ? (
                        <span className="font-black text-slate-900 dark:text-white">{inv.quantity} <span className="font-normal text-slate-400">Unit</span></span>
                      ) : (
                        <div className="w-40">
                          <div className="flex justify-between text-[10px] mb-1 font-bold">
                            <span className="text-emerald-600">{inv.received_quantity}/{inv.needed_quantity}</span>
                            <span className="text-slate-400">{progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 shadow-inner">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(activeSection === 'assets' ? 'asset' : 'needed', inv)} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"><Edit2 size={18} /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-2.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Simplified Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md overflow-y-auto pt-24 pb-12">
          <div className="bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center px-10 py-8 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentId ? 'Kemaskini Data' : (modalMode === 'asset' ? 'Tambah Aset Masjid' : 'Tambah Keperluan')}
                </h2>
                <p className="text-slate-500 mt-1 font-medium">Sila isi butiran ringkas di bawah.</p>
              </div>
              <button onClick={handleCloseModal} className="p-3 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                <X size={28} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              {/* Image Upload Area */}
              <div className="flex gap-6 items-center bg-slate-50 dark:bg-slate-950 p-6 rounded-[32px] border border-slate-200/50 dark:border-slate-800/50">
                <div className="w-32 h-32 rounded-[24px] overflow-hidden bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-center relative group">
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="text-slate-300" size={40} />
                  )}
                  <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all">
                    <Upload className="text-white" size={24} />
                    <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-1">Gambar Item</h4>
                  <p className="text-xs text-slate-500">Muat naik gambar item untuk memudahkan pengecaman komuniti.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Nama Item</label>
                  <input 
                    type="text" 
                    required
                    value={item}
                    onChange={(e) => setItem(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" 
                    placeholder="Contoh: Kipas Berdiri / Sejadah" 
                  />
                </div>

                {modalMode === 'asset' ? (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kuantiti</label>
                      <input 
                        type="number" 
                        min="0"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Keadaan Item</label>
                      <select 
                        value={itemCondition}
                        onChange={(e) => setItemCondition(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm"
                      >
                        <option value="Baik">Baik</option>
                        <option value="Sederhana">Sederhana</option>
                        <option value="Perlu Diganti">Perlu Diganti</option>
                        <option value="Rosak">Rosak</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Kuantiti Diperlukan</label>
                      <input 
                        type="number" 
                        min="1"
                        required
                        value={neededQuantity}
                        onChange={(e) => setNeededQuantity(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Tahap Keutamaan</label>
                      <select 
                        value={urgencyLevel}
                        onChange={(e) => setUrgencyLevel(e.target.value)}
                        className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-sm"
                      >
                        <option value="Biasa">Biasa</option>
                        <option value="Penting">Penting</option>
                        <option value="Sangat Diperlukan">Sangat Diperlukan</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Keterangan / Nota Ringkas</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:border-emerald-500 outline-none transition-all shadow-sm h-32 resize-none" 
                    placeholder="Masukkan maklumat tambahan jika perlu..."
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-10 py-5 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[20px] transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-[20px] font-black transition-all shadow-xl shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'Sila Tunggu...' : (currentId ? 'Simpan Perubahan' : 'Hantar Data')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
