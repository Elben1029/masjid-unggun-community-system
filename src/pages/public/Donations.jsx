import { Heart, Landmark, HandHeart, UploadCloud, Utensils, Box } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';



export default function Donations() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState('cash'); // 'cash', 'food', 'asset'
  const [selectedFund, setSelectedFund] = useState('');

  const funds = [
    {
      id: 'f1',
      title: 'Tabung Pengurusan Masjid',
      icon: Landmark,
      description: `Untuk bil utiliti, penyelenggaraan, dan pengurusan harian ${settings?.mosque_name || 'Masjid Unggun'}.`,
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      id: 'f2',
      title: 'Tabung Kebajikan Anak Yatim',
      icon: Heart,
      description: `Sumbangan khusus untuk anak-anak yatim dan asnaf di kariah ${settings?.mosque_name || 'Masjid Unggun'}.`,
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <Heart size={32} className="animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Kempen Sumbangan</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          "Perumpamaan orang yang menafkahkan hartanya di jalan Allah adalah serupa dengan sebutir benih yang menumbuhkan tujuh bulir, pada tiap-tiap bulir seratus biji."
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl inline-flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setActiveTab('cash')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'cash' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Landmark size={18} />
            Wang Ringgit
          </button>
          <button 
            onClick={() => setActiveTab('food')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'food' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Utensils size={18} />
            Tajaan Makanan
          </button>
          <button 
            onClick={() => setActiveTab('asset')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'asset' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
          >
            <Box size={18} />
            Wakaf Aset
          </button>
        </div>
      </div>

      {activeTab === 'cash' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-md transform -translate-y-1' 
                      : 'border-transparent glass-card hover:border-emerald-200 dark:hover:border-emerald-800'
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
                { (settings?.qr_image_url || settings?.qr_code_url) ? (
                  <img src={settings.qr_image_url || settings.qr_code_url} alt="DuitNow QR" className="w-24 h-24 rounded-lg bg-white p-2 shadow-sm object-contain" />
                ) : (
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${settings?.account_number || '10052010123456'}`} alt="DuitNow QR" className="w-24 h-24 rounded-lg bg-white p-2 shadow-sm" />
                )}
              </div>
            </div>
          </div>

          {/* Upload Form */}
          <div className="lg:col-span-5">
            <div className="glass-card rounded-3xl p-8 sticky top-28 border border-slate-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Maklumkan Sumbangan</h2>
              <form className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nama Penyumbang (Pilihan)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
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
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Resit Transaksi
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                      <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                        <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500">
                          Muat naik fail
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">PNG, JPG, PDF sehingga 5MB</p>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!selectedFund}
                  className="w-full py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
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
      )}

      {activeTab === 'food' && (
        <div className="glass-card rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <Utensils className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Kalendar Tajaan Makanan</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
            Modul ini membolehkan anda menempah slot untuk menaja makanan untuk jemaah masjid pada hari Jumaat atau majlis-majlis tertentu.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 inline-block">
            <p className="text-amber-800 dark:text-amber-300 font-medium">Modul sedang diselenggara. Akan datang tidak lama lagi.</p>
          </div>
        </div>
      )}

      {activeTab === 'asset' && (
        <div className="glass-card rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <Box className="mx-auto h-16 w-16 text-emerald-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Senarai Keperluan Wakaf Aset</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto mb-8">
            Berikut adalah senarai barangan atau aset yang diperlukan oleh masjid. Anda boleh memilih untuk mewakafkan aset tersebut.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 inline-block">
            <p className="text-amber-800 dark:text-amber-300 font-medium">Tiada senarai aset diperlukan buat masa ini.</p>
          </div>
        </div>
      )}
    </div>
  );
}
