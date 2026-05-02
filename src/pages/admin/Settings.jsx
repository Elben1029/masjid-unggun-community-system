import { useState, useEffect } from 'react';
import { Save, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Settings State
  const [mosqueName, setMosqueName] = useState('Masjid Unggun');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // Bank Details
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // Org Chart Link
  const [orgChartUrl, setOrgChartUrl] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'global')
          .single();
        
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for no rows found

        if (data) {
          if (data.mosque_name) setMosqueName(data.mosque_name);
          if (data.address) setAddress(data.address);
          if (data.phone) setPhone(data.phone);
          if (data.bank_name) setBankName(data.bank_name);
          if (data.account_number) setAccountNumber(data.account_number);
          if (data.account_name) setAccountName(data.account_name);
          if (data.org_chart_url) setOrgChartUrl(data.org_chart_url);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setFetching(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          id: 'global',
          mosque_name: mosqueName,
          address,
          phone,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          org_chart_url: orgChartUrl,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      alert("Tetapan berjaya disimpan.");
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Gagal menyimpan tetapan.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-10">Memuatkan tetapan...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Tetapan Sistem</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Urus maklumat rasmi masjid yang akan dipaparkan kepada umum.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Hubungi Masjid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Maklumat Hubungan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Masjid</label>
              <input 
                type="text" 
                value={mosqueName}
                onChange={(e) => setMosqueName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alamat Penuh</label>
              <textarea 
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                placeholder="Cth: Kampung Unggun, Menggatal, Sabah"
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombor Telefon Pejabat</label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                placeholder="Cth: 088-123456"
              />
            </div>
          </div>
        </div>

        {/* Maklumat Bank */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Akaun Bank Rasmi (Sumbangan)</h2>
            <Info size={20} className="text-teal-500" title="Maklumat ini akan dipaparkan di halaman Derma" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Bank</label>
              <input 
                type="text" 
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                placeholder="Cth: Bank Islam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombor Akaun</label>
              <input 
                type="text" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                placeholder="100XXXXXXXXXX"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Pemilik Akaun</label>
              <input 
                type="text" 
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                placeholder="Cth: MAJLIS AGAMA ISLAM (MASJID UNGGUN)"
              />
            </div>
          </div>
        </div>

        {/* Carta Organisasi */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Carta Organisasi</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pautan Imej Carta Organisasi (URL)</label>
            <input 
              type="url" 
              value={orgChartUrl}
              onChange={(e) => setOrgChartUrl(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
              placeholder="https://contoh.com/imej-carta.jpg"
            />
            <p className="mt-2 text-xs text-slate-500">Boleh menggunakan pautan Google Drive atau Firebase Storage untuk memaparkan AJK Masjid.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Menyimpan...' : 'Simpan Tetapan'}
          </button>
        </div>
      </form>
    </div>
  );
}
