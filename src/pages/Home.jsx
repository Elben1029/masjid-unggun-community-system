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
        {/* Banner Background */}
        {settings?.mosque_banner_url && (
          <div 
            className="absolute inset-0 z-0 opacity-20 dark:opacity-30 bg-cover bg-center"
            style={{ backgroundImage: `url(${settings.mosque_banner_url})` }}
          />
        )}
        
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px]" />
          <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium text-sm border border-emerald-100 dark:border-emerald-800/50 mb-4 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Sistem Pengurusan Masjid Digital
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Selamat Datang ke <br />
            <span className="text-gradient">{settings?.mosque_name || 'Masjid Unggun'}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Platform bersepadu untuk menyemak acara, mendaftar korban, dan menghulurkan sumbangan secara mudah dan selamat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/events" className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-lg transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 group">
              Lihat Acara
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/donations" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-lg transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center">
              Sumbangan
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 py-16 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
              <Calendar size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Acara & Program</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Ikuti perkembangan kuliah, bengkel, dan aktiviti masjid terkini. Daftar kehadiran anda secara digital.
            </p>
            <Link to="/events" className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
              Ketahui Lebih <ArrowRight size={16} />
            </Link>
          </div>

          <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6">
              <Heart size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Sumbangan</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Hulurkan sedekah jariah anda dengan mudah melalui perbankan dalam talian untuk pelbagai tabung masjid.
            </p>
            <Link to="/donations" className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
              Menderma <ArrowRight size={16} />
            </Link>
          </div>

          <div className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-6">
              <Box size={28} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Ibadah Korban</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
              Pendaftaran korban kini lebih sistematik. Tempah bahagian anda lebih awal secara dalam talian.
            </p>
            <Link to="/korban" className="text-orange-600 dark:text-orange-400 font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all">
              Daftar Sekarang <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>
    </div>
  );
}
