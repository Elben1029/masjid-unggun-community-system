import { Heart, Landmark, HandHeart, UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const funds = [
  {
    id: 'f1',
    title: 'Tabung Pengurusan Masjid',
    icon: Landmark,
    description: 'Untuk bil utiliti, penyelenggaraan, dan pengurusan harian Masjid Unggun.',
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    id: 'f2',
    title: 'Tabung Kebajikan Anak Yatim',
    icon: Heart,
    description: 'Sumbangan khusus untuk anak-anak yatim dan asnaf di kariah Masjid Unggun.',
    color: 'from-rose-400 to-red-500',
    iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    iconColor: 'text-rose-600 dark:text-rose-400'
  },
  {
    id: 'f3',
    title: 'Tabung Pembangunan',
    icon: HandHeart,
    description: 'Bagi tujuan pembesaran dan naik taraf fasiliti masjid pada masa akan datang.',
    color: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400'
  }
];

export default function Donations() {
  const [selectedFund, setSelectedFund] = useState('');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'global')
        .single();
      if (data) setSettings(data);
    }
    fetchSettings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <Heart size={32} className="animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Kempen Sumbangan</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          "Perumpamaan orang yang menafkahkan hartanya di jalan Allah adalah serupa dengan sebutir benih yang menumbuhkan tujuh bulir, pada tiap-tiap bulir seratus biji." (Al-Baqarah: 261)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Funds List */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Pilih Tabung</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {funds.map((fund) => (
              <div 
                key={fund.id}
                onClick={() => setSelectedFund(fund.id)}
                className={`cursor-pointer rounded-2xl border-2 transition-all duration-300 p-6 ${
                  selectedFund === fund.id 
                    ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10 shadow-md transform -translate-y-1' 
                    : 'border-transparent glass-card hover:border-teal-200 dark:hover:border-teal-800'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl ${fund.iconBg} flex items-center justify-center ${fund.iconColor} mb-4`}>
                  <fund.icon size={24} />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-2">{fund.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{fund.description}</p>
              </div>
            ))}
          </div>

          <div className="glass p-6 rounded-2xl mt-8">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Maklumat Akaun Bank Rasmi</h3>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{settings?.bank_name || 'Bank Islam Malaysia Berhad'}</p>
                <p className="font-mono text-xl font-bold text-slate-800 dark:text-white tracking-wider">{settings?.account_number || '1005 2010 1234 56'}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">{settings?.account_name || 'Masjid Unggun Kota Kinabalu'}</p>
              </div>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${settings?.account_number || '10052010123456'}`} alt="DuitNow QR" className="w-24 h-24 rounded-lg bg-white p-2 shadow-sm" />
            </div>
          </div>
        </div>

        {/* Upload Form */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-3xl p-8 sticky top-28">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Maklumkan Sumbangan</h2>
            <form className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nama Penyumbang (Pilihan)
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-teal-500 focus:border-teal-500 dark:text-white"
                  placeholder="Hamba Allah"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Jumlah (RM)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-teal-500 focus:border-teal-500 dark:text-white"
                  placeholder="50.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Resit Transaksi
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-teal-500 transition-colors" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                      <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                        Muat naik fail
                      </span>
                      <p className="pl-1">atau seret dan lepas</p>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, PDF sehingga 5MB</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!selectedFund}
                className="w-full py-4 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
              >
                Hantar Makluman
              </button>
              {!selectedFund && (
                <p className="text-xs text-center text-rose-500 mt-2">Sila pilih tabung terlebih dahulu.</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
