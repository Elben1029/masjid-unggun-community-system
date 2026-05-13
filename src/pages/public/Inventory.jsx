import { Box, HeartHandshake, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';

export default function Inventory() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, needed, available

  useEffect(() => {
    async function fetchInventory() {
      try {
        const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } catch (err) {
        console.error("Error fetching inventory", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const handleContribute = (item) => {
    navigate('/donations', { state: { selectedTab: 'asset', prefilledItem: item.item, inventoryId: item.id } });
  };

  const filteredItems = items.filter(item => {
    if (filter === 'needed') return item.is_needed || item.waqf_enabled;
    if (filter === 'available') return item.quantity > 0 && !item.is_needed;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-emerald-900 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/islamic-art.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/50 to-emerald-950"></div>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <Box size={16} />
            <span>KEMUDAHAN & KEPERLUAN KOMUNITI</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 animate-in fade-in slide-in-from-top-8 duration-700 delay-100">
            Aset & Fasiliti <span className="text-emerald-400">Masjid</span>
          </h1>
          <p className="text-xl text-emerald-100/80 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-top-12 duration-700 delay-200">
            Telusuri senarai kemudahan yang tersedia di {settings?.mosque_name || 'Masjid Unggun'} dan lihat bagaimana anda boleh membantu meningkatkan kualiti fasiliti untuk keselesaan kariah kita.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-16 pb-24 relative z-10">
        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-[32px] p-4 shadow-xl border border-slate-200/50 dark:border-slate-800/50 mb-12 flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'all' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Semua Aset
            </button>
            <button 
              onClick={() => setFilter('needed')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'needed' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Keperluan Wakaf
            </button>
            <button 
              onClick={() => setFilter('available')}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${filter === 'available' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Fasiliti Sedia Ada
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Tersedia
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              Diperlukan
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[40px] p-20 text-center shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Box className="text-slate-300 dark:text-slate-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Tiada Item Di Temui</h3>
            <p className="text-slate-500 mt-2 max-w-md mx-auto text-lg">Maaf, kami tidak menemui sebarang aset atau keperluan dalam kategori yang dipilih buat masa ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map(item => {
              const isNeeded = item.is_needed || item.waqf_enabled;
              const progress = isNeeded ? Math.min(100, Math.round((item.received_quantity / item.needed_quantity) * 100)) : 0;
              
              return (
                <div key={item.id} className="group bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col">
                  {/* Image/Status Header */}
                  <div className="aspect-[4/3] relative bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.item} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:bg-slate-800">
                        <Box size={64} strokeWidth={1} />
                      </div>
                    )}
                    
                    {/* Status Overlays */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${
                        isNeeded 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {isNeeded ? 'Keperluan Wakaf' : 'Aset Masjid'}
                      </span>
                      {item.urgency_level === 'Urgent' && (
                        <span className="px-4 py-1.5 bg-rose-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg animate-pulse">
                          Kecemasan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mb-2">
                        <span>{item.category || 'Aset Am'}</span>
                        <span className="w-1 h-1 rounded-full bg-emerald-300 dark:bg-emerald-700"></span>
                        <span>Kondisi: {item.item_condition}</span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white line-clamp-2 leading-tight">{item.item}</h3>
                    </div>

                    <div className="space-y-6 mt-auto">
                      {isNeeded ? (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100/50 dark:border-emerald-900/30">
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <p className="text-xs font-bold text-emerald-800/60 dark:text-emerald-400/60 uppercase tracking-wider mb-1">Status Sumbangan</p>
                              <p className="text-lg font-black text-emerald-900 dark:text-emerald-300">{item.received_quantity} <span className="text-sm font-normal">daripada</span> {item.needed_quantity} <span className="text-xs">Unit</span></p>
                            </div>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{progress}%</span>
                          </div>
                          <div className="w-full bg-emerald-200/50 dark:bg-emerald-800/50 rounded-full h-3 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between py-4 border-t border-slate-50 dark:border-slate-800">
                          <div className="flex items-center gap-2 text-slate-500 font-medium italic">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            Tersedia untuk kegunaan
                          </div>
                          <span className="font-bold text-slate-800 dark:text-white">{item.quantity} Unit</span>
                        </div>
                      )}

                      {isNeeded ? (
                        <button 
                          onClick={() => handleContribute(item)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20 group/btn active:scale-95"
                        >
                          <HeartHandshake size={20} className="group-hover/btn:scale-125 transition-transform" />
                          Contribute Item
                        </button>
                      ) : (
                        <Link 
                          to="/about"
                          className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group/btn"
                        >
                          Lihat Butiran Lanjut
                          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-20 bg-emerald-900 rounded-[40px] p-10 md:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left max-w-xl">
              <h2 className="text-3xl font-bold text-white mb-4">Adakah anda ingin mewakafkan aset yang tidak tersenarai?</h2>
              <p className="text-emerald-100/70 text-lg">Sekiranya anda mempunyai barangan atau aset lain yang ingin disumbangkan kepada masjid, sila hubungi pihak pengurusan kami untuk perbincangan lanjut.</p>
            </div>
            <Link to="/about#contact" className="px-10 py-5 bg-white text-emerald-900 font-black rounded-2xl hover:bg-emerald-50 transition-all shadow-xl whitespace-nowrap active:scale-95">
              Hubungi Kami
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
