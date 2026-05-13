import { ArrowRight, Calendar, Heart, Box } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export default function Home() {
  const { settings } = useSettings();
  
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section 
        className="w-full relative py-20 lg:py-32 overflow-hidden flex flex-col items-center justify-center min-h-[80vh]"
      >
        {/* Banner Background with Dark Overlay for Maximum Readability */}
        {settings?.mosque_banner_url ? (
          <>
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${settings.mosque_banner_url})` }}
            />
            <div className="absolute inset-0 z-0 bg-black/45 dark:bg-black/60 backdrop-blur-[2px]" />
          </>
        ) : (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px]" />
            <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center space-y-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm border mb-4 animate-fade-in ${
            settings?.mosque_banner_url 
              ? 'bg-black/30 backdrop-blur-md text-emerald-300 border-white/20' 
              : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800/50'
          }`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistem Pengurusan Masjid Digital
          </div>
          
          <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] drop-shadow-sm ${
            settings?.mosque_banner_url ? 'text-white text-shadow' : 'text-slate-900 dark:text-white'
          }`}>
            Selamat Datang ke <br />
            <span className={settings?.mosque_banner_url ? 'text-emerald-300 drop-shadow' : 'text-gradient'}>
              {settings?.mosque_name || 'Masjid Unggun'}
            </span>
          </h1>
          
          <p className={`text-lg md:text-xl font-semibold max-w-2xl mx-auto leading-relaxed ${
            settings?.mosque_banner_url ? 'text-slate-100 text-shadow' : 'text-slate-700 dark:text-slate-200'
          }`}>
            Platform bersepadu untuk menyemak acara, mendaftar korban, dan menghulurkan sumbangan secara mudah dan selamat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/events" className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 group border border-emerald-600">
              Lihat Acara
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/donations" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-lg transition-all shadow-sm border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center">
              Sumbangan
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 py-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-6">
              <Calendar size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Acara & Program</h3>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
              Ikuti perkembangan kuliah, bengkel, dan aktiviti masjid terkini. Daftar kehadiran anda secara digital.
            </p>
            <Link to="/events" className="text-emerald-800 dark:text-emerald-400 font-bold inline-flex items-center gap-1 hover:gap-2 transition-all">
              Ketahui Lebih <ArrowRight size={16} />
            </Link>
          </div>

          <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-6">
              <Heart size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Sumbangan</h3>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
              Hulurkan sedekah jariah anda dengan mudah melalui perbankan dalam talian untuk pelbagai tabung masjid.
            </p>
            <Link to="/donations" className="text-emerald-800 dark:text-emerald-400 font-bold inline-flex items-center gap-1 hover:gap-2 transition-all">
              Menderma <ArrowRight size={16} />
            </Link>
          </div>

          <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-700 dark:text-orange-400 mb-6">
              <Box size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Ibadah Korban</h3>
            <p className="text-base font-medium text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
              Pendaftaran korban kini lebih sistematik. Tempah bahagian anda lebih awal secara dalam talian.
            </p>
            <Link to="/korban" className="text-orange-800 dark:text-orange-400 font-bold inline-flex items-center gap-1 hover:gap-2 transition-all">
              Daftar Sekarang <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
