import { ArrowRight, Info, Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const { settings } = useSettings();
  const [latestEvent, setLatestEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  useEffect(() => {
    async function fetchLatestEvent() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('status', 'Akan Datang')
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        setLatestEvent(data);
      } catch (err) {
        console.error("Error fetching latest event:", err);
      } finally {
        setLoadingEvent(false);
      }
    }
    fetchLatestEvent();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      
      {/* 2. HERO / BANNER SECTION (MIDDLE TIER) */}
      <section className="relative w-full min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          {settings?.mosque_banner_url ? (
            <img 
              src={settings.mosque_banner_url} 
              alt="Banner" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-emerald-900" />
          )}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <p className="text-emerald-400 font-bold tracking-[0.2em] uppercase text-sm sm:text-base animate-fade-in">
            {settings?.home_welcome_text || 'Selamat Datang'}
          </p>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white leading-tight tracking-tight text-shadow-md">
            {settings?.mosque_name || 'Masjid Unggun'}
          </h1>
          <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mx-auto font-medium text-shadow">
            {settings?.home_tagline || 'Pusat ibadah, ilmu, dan pembangunan komuniti bertaqwa.'}
          </p>

        </div>
      </section>

      {/* 3. CONTENT DASHBOARD SECTION (BOTTOM TIER) */}
      <section className="w-full max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
          
          {/* LEFT COLUMN — INFO PENTING */}
          <div className="glass-card rounded-[2.5rem] p-8 sm:p-10 flex flex-col h-full shadow-2xl border-emerald-100/20 dark:border-slate-800 transition-all duration-500 hover:shadow-emerald-500/10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Info size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                {settings?.home_info_title || 'Maklumat Penting'}
              </h2>
            </div>
            
            <div className="flex-grow space-y-6">
              {settings?.home_info_image_url && (
                <div className="rounded-3xl overflow-hidden aspect-video shadow-md">
                  <img src={settings.home_info_image_url} alt="Info" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {settings?.home_info_description || 'Selamat datang ke laman web rasmi Masjid Unggun. Laman ini memudahkan jemaah untuk menyemak jadual acara, membuat sumbangan, dan mendaftar ibadah korban secara dalam talian.'}
                </p>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
              <Link to="/about" className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:gap-3 transition-all">
                Ketahui lebih lanjut <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN — PROGRAM TERKINI */}
          <div className="flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">Program Terkini</h2>
              </div>
              <Link to="/events" className="text-sm font-bold text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Lihat Semua
              </Link>
            </div>

            {loadingEvent ? (
              <div className="glass-card rounded-[2.5rem] p-12 flex items-center justify-center animate-pulse">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : latestEvent ? (
              <Link to={`/events`} className="glass-card rounded-[2.5rem] overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500 flex-grow flex flex-col hover:-translate-y-2 border-slate-100/50 dark:border-slate-800">
                <div className="relative aspect-[16/9] overflow-hidden">
                  {latestEvent.image_url ? (
                    <img 
                      src={latestEvent.image_url} 
                      alt={latestEvent.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Calendar size={64} className="text-slate-300 dark:text-slate-700" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                      {latestEvent.category || 'Program'}
                    </span>
                  </div>
                </div>
                
                <div className="p-8 space-y-4 flex-grow flex flex-col">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {latestEvent.title}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <Calendar size={16} className="text-emerald-500" />
                      <span>{new Date(latestEvent.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <Clock size={16} className="text-emerald-500" />
                      <span>{latestEvent.start_time || 'Sila rujuk detail'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm col-span-2">
                      <MapPin size={16} className="text-emerald-500" />
                      <span className="truncate">{latestEvent.location || 'Masjid Unggun'}</span>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 pt-4 flex-grow">
                    {latestEvent.description}
                  </p>
                  
                  <div className="pt-6 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold group/btn">
                    <span>Lihat Butiran</span>
                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ) : (
              <div className="glass-card rounded-[2.5rem] p-12 text-center space-y-4 flex-grow flex flex-col items-center justify-center border-dashed border-2">
                <Calendar size={48} className="text-slate-300 mx-auto" />
                <p className="text-slate-500">Tiada program akan datang buat masa ini.</p>
              </div>
            )}
          </div>

        </div>
      </section>
    </div>
  );
}
