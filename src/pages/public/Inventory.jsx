import { Box, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';

export default function Inventory() {
  const { settings } = useSettings();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <Box size={32} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Inventori Masjid</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Senarai aset dan kelengkapan {settings?.mosque_name || 'Masjid Unggun'} yang boleh dipinjam atau digunakan oleh kariah.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-8 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Box className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Tiada Inventori</h3>
            <p className="text-slate-500 mt-1">Senarai inventori kosong buat masa ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.item} className="w-full h-full object-cover" />
                  ) : (
                    <Box size={40} className="text-slate-300 dark:text-slate-600" />
                  )}
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-1">{item.item}</h3>
                <p className="text-sm text-slate-500 mb-3">{item.category || 'Tiada Kategori'}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-700 dark:text-slate-300">
                    Kuantiti: {item.quantity}
                  </span>
                  <span className={`px-3 py-1 rounded-full ${item.condition === 'Baik' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {item.condition}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
