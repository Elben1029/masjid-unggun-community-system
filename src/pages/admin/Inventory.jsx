import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Upload, Image as ImageIcon, Box, HeartHandshake } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Inventory() {
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' or 'needed'
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [currentId, setCurrentId] = useState(null);
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Kelengkapan Solat');
  const [quantity, setQuantity] = useState(1);
  const [itemCondition, setItemCondition] = useState('Baik');
  const [imageFile, setImageFile] = useState(null);
  
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
    setQuantity(1);
    setCondition('Baik');
    setImageFile(null);
    setIsNeeded(false);
    setNeededQuantity(0);
  };

  const handleOpenModal = (invItem = null) => {
    if (invItem) {
      setCurrentId(invItem.id);
      setItem(invItem.item || '');
      setCategory(invItem.category || 'Kelengkapan Solat');
      setQuantity(invItem.quantity || 1);
      setItemCondition(invItem.item_condition || 'Baik');
      setIsNeeded(invItem.is_needed || false);
      setNeededQuantity(invItem.needed_quantity || 0);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

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
        is_needed: isNeeded,
        needed_quantity: Number(neededQuantity)
      };
      
      if (imageUrl) invData.image_url = imageUrl;

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

  const existingAssets = filteredInventory.filter(inv => !inv.is_needed || inv.quantity > 0);
  const neededAssets = filteredInventory.filter(inv => inv.is_needed);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pengurusan Inventori & Aset</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Tambah Item Baru
        </button>
      </div>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('assets')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'assets' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'}`}>
          <Box size={18} /> Aset Sedia Ada
        </button>
        <button onClick={() => setActiveTab('needed')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${activeTab === 'needed' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300'}`}>
          <HeartHandshake size={18} /> Keperluan Aset (Wakaf)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari item..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'assets' && (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                <tr>
                  <th className="px-6 py-4 w-16">Gambar</th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Nama Item</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Kuantiti</th>
                  <th className="px-6 py-4">Keadaan</th>
                  <th className="px-6 py-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {existingAssets.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Tiada item dijumpai.</td></tr>
                ) : existingAssets.map((inv, index) => (
                  <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      {inv.image_url ? (
                        <img src={inv.image_url} alt={inv.item} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          <ImageIcon size={20} className="text-slate-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-500">INV-{(index + 1).toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.item}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                        {inv.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{inv.quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 ${inv.item_condition === 'Baik' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${inv.item_condition === 'Baik' ? 'bg-emerald-500' : 'bg-orange-500'}`}></span>
                        {inv.item_condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleOpenModal(inv)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 mr-2">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'needed' && (
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                <tr>
                  <th className="px-6 py-4 w-16">Gambar</th>
                  <th className="px-6 py-4">Nama Item</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Kuantiti Diperlukan</th>
                  <th className="px-6 py-4">Progres Wakaf</th>
                  <th className="px-6 py-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {neededAssets.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Tiada aset diperlukan dijumpai.</td></tr>
                ) : neededAssets.map((inv) => {
                  const percent = Math.min(100, Math.round((inv.received_quantity / inv.needed_quantity) * 100)) || 0;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        {inv.image_url ? (
                          <img src={inv.image_url} alt={inv.item} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            <ImageIcon size={20} className="text-slate-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{inv.item}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {inv.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-amber-600">{inv.needed_quantity} Unit</td>
                      <td className="px-6 py-4">
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-emerald-600 dark:text-emerald-400">{inv.received_quantity} Unit</span>
                          <span className="text-slate-500">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleOpenModal(inv)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 mr-2">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto pt-24 pb-12">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative z-10">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {currentId ? 'Edit Item' : 'Tambah Item Baru'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Item</label>
                <input 
                  type="text" 
                  required
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                  placeholder="Cth: Sajadah Karpet Panjang" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kuantiti (Aset Kini)</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Keadaan</label>
                <select 
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="Baik">Baik</option>
                  <option value="Sederhana">Sederhana</option>
                  <option value="Perlu Dibaiki">Perlu Dibaiki</option>
                  <option value="Rosak">Rosak</option>
                </select>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input 
                    type="checkbox" 
                    checked={isNeeded} 
                    onChange={(e) => setIsNeeded(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-white border-emerald-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Jadikan Keperluan Wakaf</span>
                </label>
                
                {isNeeded && (
                  <div>
                    <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Kuantiti Diperlukan (Target)</label>
                    <input 
                      type="number" 
                      min="1"
                      required={isNeeded}
                      value={neededQuantity}
                      onChange={(e) => setNeededQuantity(e.target.value)}
                      className="w-full px-4 py-2 border border-emerald-300 dark:border-emerald-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-emerald-500 focus:border-emerald-500" 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gambar Item (Pilihan)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                      <label className="relative cursor-pointer rounded-md bg-transparent font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2">
                        <span>Pilih gambar</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                      </label>
                      <p className="pl-1">atau seret ke sini</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {imageFile ? imageFile.name : 'PNG, JPG sehingga 5MB'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-5 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
