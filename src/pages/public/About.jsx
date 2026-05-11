import { Info, MapPin, Phone, Building, Mail } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function About() {
  const { settings } = useSettings();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-6 shadow-sm">
          <Info size={32} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Tentang Kami</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Mengenali sejarah dan pengurusan {settings?.mosque_name || 'Masjid Unggun'}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Maklumat Masjid</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 mt-1">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Nama Masjid</h3>
                <p className="text-slate-600 dark:text-slate-400">{settings?.mosque_name || 'Masjid Unggun'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 mt-1">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Alamat</h3>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-line">{settings?.address || 'Kota Kinabalu, Sabah'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 mt-1">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-lg">No. Telefon (Pejabat)</h3>
                <p className="text-slate-600 dark:text-slate-400">{settings?.phone || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl text-emerald-600 dark:text-emerald-400 mt-1">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white text-lg">Emel Rasmi</h3>
                <p className="text-slate-600 dark:text-slate-400">{settings?.email || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Carta Organisasi</h2>
          {(settings?.org_chart_url || settings?.organization_chart_url) ? (
            <img src={settings.org_chart_url || settings.organization_chart_url} alt="Carta Organisasi" className="rounded-xl shadow-md max-w-full" />
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-2xl w-full">
              <p className="text-slate-500">Carta organisasi belum dimuat naik.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
