import { useState, useEffect } from 'react';
import { Package, HeartHandshake, Info, Box, Search, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Inventory() {
  const [activeSection, setActiveSection] = useState('needed'); // Default to needed to encourage donations
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  async function fetchInventory() {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setInventory(data || []);
    }
    setLoading(false);
  }

  const handleContribute = (item) => {
    navigate('/donations', { 
      state: { 
        selectedTab: 'asset',
        inventoryId: item.id,
        prefilledItem: item.item 
      } 
    });
  };

  const filteredInventory = inventory.filter(inv => 
    inv.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assets = filteredInventory.filter(inv => !inv.is_needed);
  const neededItems = filteredInventory.filter(inv => inv.is_needed);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-emerald-900 py-24 mb-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-800/50 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-700/50 text-emerald-200 text-sm font-bold mb-8 animate-bounce">
            <Sparkles size={16} />
            Bantu Masjid Unggun Membangun
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">Aset & Fasiliti Masjid</h1>
          <p className="text-emerald-100/80 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Semak aset sedia ada kami atau bantu penuhi keperluan fasiliti melalui sumbangan wakaf barangan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-8">
          <div className="bg-white dark:bg-slate-900 p-1.5 rounded-[28px] inline-flex gap-1 shadow-xl border border-slate-200/50 dark:border-slate-800/50">
            <button 
              onClick={() => setActiveSection('needed')} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black transition-all duration-500 ${activeSection === 'needed' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <HeartHandshake size={20} />
              Barang Diperlukan
              {neededItems.length > 0 && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{neededItems.length}</span>}
            </button>
            <button 
              onClick={() => setActiveSection('assets')} 
              className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black transition-all duration-500 ${activeSection === 'assets' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <Package size={20} />
              Senarai Aset Masjid
            </button>
          </div>

          <div className="relative w-full lg:w-96 group">
            <Search className="absolute inset-y-0 left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Cari item atau keperluan..."
              className="w-full pl-14 pr-6 py-4.5 border-2 border-slate-200 dark:border-slate-800 rounded-[28px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold focus:border-emerald-500 outline-none transition-all shadow-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold animate-pulse tracking-widest uppercase text-xs">Memuatkan Data...</p>
          </div>
        ) : activeSection === 'needed' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {neededItems.length === 0 ? (
              <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Box className="text-emerald-300" size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Tiada Keperluan Mendesak</h3>
                <p className="text-slate-500 font-medium">Alhamdulillah, setakat ini semua keperluan fasiliti telah dipenuhi.</p>
              </div>
            ) : neededItems.map((inv) => {
              const progress = Math.min(100, Math.round((inv.received_quantity / inv.needed_quantity) * 100));
              const isUrgent = inv.urgency_level === 'Sangat Diperlukan';
              
              return (
                <div key={inv.id} className="group bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full">
                  <div className="aspect-[16/10] relative bg-slate-100 dark:bg-slate-800">
                    {inv.image_url ? (
                      <img src={inv.image_url} alt={inv.item} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Box size={64} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-6 left-6">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 ${
                        isUrgent ? 'bg-rose-600 text-white animate-pulse' : 
                        inv.urgency_level === 'Penting' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isUrgent ? 'Sangat Diperlukan' : inv.urgency_level}
                      </span>
                    </div>
                  </div>

                  <div className="p-10 flex-1 flex flex-col">
                    <div className="mb-8">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 leading-tight group-hover:text-emerald-600 transition-colors">{inv.item}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed font-medium">
                        {inv.location || 'Bantuan sumbangan amat dialu-alukan bagi meningkatkan keselesaan jemaah masjid.'}
                      </p>
                    </div>

                    <div className="space-y-6 mt-auto">
                      <div className="space-y-3">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kemajuan Sumbangan</p>
                            <p className="text-2xl font-black text-emerald-600 tracking-tight">{inv.received_quantity} / {inv.needed_quantity} <span className="text-xs text-slate-400 font-normal">Unit</span></p>
                          </div>
                          <span className="text-3xl font-black text-slate-900 dark:text-white">{progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden shadow-inner border border-slate-200/50 dark:border-slate-700/30">
                          <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${progress}%` }}>
                            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]"></div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleContribute(inv)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-600/20 active:scale-95 group/btn"
                      >
                        Sedekah Barang
                        <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {assets.length === 0 ? (
              <div className="col-span-full py-32 text-center text-slate-400 font-bold">Tiada maklumat aset buat masa ini.</div>
            ) : assets.map((inv) => (
              <div key={inv.id} className="group bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-md hover:shadow-xl transition-all duration-500 flex flex-col">
                <div className="aspect-square relative bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
                  {inv.image_url ? (
                    <img src={inv.image_url} alt={inv.item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-200">
                      <Box size={48} strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                      inv.item_condition === 'Baik' ? 'bg-emerald-500 text-white' : 
                      inv.item_condition === 'Rosak' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {inv.item_condition}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white mb-4 line-clamp-1 group-hover:text-emerald-600 transition-colors">{inv.item}</h4>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kuantiti</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{inv.quantity} <span className="text-xs font-medium opacity-50">Unit</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[32px] flex items-center justify-center shrink-0 border border-white/30 rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <Info size={40} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-3xl font-black mb-3">Ada Persoalan Mengenai Sumbangan?</h3>
              <p className="text-emerald-100/90 text-lg font-medium leading-relaxed max-w-2xl">
                Sekiranya anda mempunyai sebarang pertanyaan atau ingin menyumbang barangan yang tidak disenaraikan, sila hubungi pihak pengurusan Masjid Unggun secara terus.
              </p>
            </div>
            <button 
              onClick={() => navigate('/contact')}
              className="bg-white text-emerald-900 px-10 py-5 rounded-[24px] font-black text-lg hover:shadow-2xl hover:-translate-y-1 transition-all active:scale-95 shrink-0"
            >
              Hubungi Kami
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
