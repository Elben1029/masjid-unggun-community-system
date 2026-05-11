import { Check, Info, Box } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

const packages = [
  {
    id: 'p1',
    name: '1 Bahagian Lembu',
    price: 850,
    available: 12,
    total: 35
  },
  {
    id: 'p2',
    name: '1 Ekor Lembu (7 Bahagian)',
    price: 5950,
    available: 2,
    total: 5
  },
  {
    id: 'p3',
    name: '1 Ekor Kambing',
    price: 1100,
    available: 8,
    total: 20
  }
];

export default function Korban() {
  const { settings } = useSettings();
  const [selectedPkg, setSelectedPkg] = useState(null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 mb-6 shadow-sm">
          <Box size={32} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Pendaftaran Ibadah Korban</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Laksanakan ibadah korban anda bersama {settings?.mosque_name || 'Masjid Unggun'} bagi tahun 1447H. 
          Pendaftaran ditutup pada 10 Zulhijjah.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800">
        
        {/* Package Selection */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm">1</span>
            Pilih Pakej
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div 
                key={pkg.id}
                onClick={() => pkg.available > 0 && setSelectedPkg(pkg.id)}
                className={`relative border-2 rounded-2xl p-5 transition-all duration-200 ${
                  pkg.available === 0 
                    ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                    : selectedPkg === pkg.id
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-900/10 cursor-pointer shadow-md'
                      : 'border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 cursor-pointer hover:border-orange-300'
                }`}
              >
                {selectedPkg === pkg.id && (
                  <div className="absolute top-3 right-3 text-orange-500">
                    <Check size={20} />
                  </div>
                )}
                <h3 className="font-bold text-slate-800 dark:text-white pr-6">{pkg.name}</h3>
                <p className="text-2xl font-black text-orange-600 dark:text-orange-400 my-2">RM {pkg.price}</p>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-md">
                  <span className={pkg.available < 5 ? 'text-red-500' : 'text-emerald-500'}>
                    {pkg.available} baki
                  </span>
                  <span>/ {pkg.total}</span>
                </div>
                {pkg.available === 0 && (
                  <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
                    <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Penuh</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Participant Details */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm">2</span>
            Maklumat Peserta
          </h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex gap-3 mb-6">
            <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              Sila pastikan ejaan nama peserta adalah tepat bagi tujuan akad dan penyediaan sijil penyertaan.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nama Penuh Peserta (Untuk Akad)
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                placeholder="cth: Muhammad Ali bin Abu Bakar"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombor Telefon
                </label>
                <input
                  type="tel"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                  placeholder="012-3456789"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Emel
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
                  placeholder="anda@contoh.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm text-slate-500 dark:text-slate-400">Jumlah Bayaran</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              RM {selectedPkg ? packages.find(p => p.id === selectedPkg).price : '0'}
            </p>
          </div>
          <button 
            disabled={!selectedPkg}
            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            Teruskan Pembayaran
          </button>
        </div>

      </div>
    </div>
  );
}
