import { Info, Eye, Target, ArrowRight, ChevronLeft, Building, MapPin, Phone, Mail } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useSearchParams, Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function About() {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view');

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  if (view === 'chart') {
    return <OrgChartDetail view={view} setSearchParams={setSearchParams} settings={settings} />;
  }

  return <AboutOverview setSearchParams={setSearchParams} settings={settings} />;
}

function AboutOverview({ setSearchParams, settings }) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 2. INTRODUCTION HERO SECTION (50/50 SPLIT LAYOUT) */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT COLUMN: Dynamic image container */}
            <div className="relative group order-2 lg:order-1">
              <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2.5rem] blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500"></div>
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 transition-transform duration-500 group-hover:scale-[1.02]">
                {settings?.about_hero_image_url ? (
                  <img 
                    src={settings.about_hero_image_url} 
                    alt="Masjid Unggun" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Building size={64} className="text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Display editable content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold tracking-wide uppercase">
                  <Info size={16} />
                  <span>Kenali Kami</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight">
                  {settings?.about_hero_title || 'Tentang Kami'}
                </h1>
                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                  {settings?.about_hero_description || `Selamat datang ke ${settings?.mosque_name || 'Masjid Unggun'}. Kami komited dalam menyediakan perkhidmatan terbaik untuk komuniti dan jemaah kami.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VISI & MISI SECTION (CARD DESIGN) */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Visi Card */}
            <div className="glass-card group p-8 sm:p-10 rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                <Eye size={32} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                {settings?.visi_title || 'Visi'}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {settings?.visi_description || 'Menjadi pusat kecemerlangan ibadah dan pembangunan insan yang unggul berteraskan Al-Quran dan As-Sunnah.'}
              </p>
            </div>

            {/* Misi Card */}
            <div className="glass-card group p-8 sm:p-10 rounded-[2.5rem] transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 rounded-2xl bg-teal-500 text-white flex items-center justify-center mb-8 shadow-lg shadow-teal-500/20 group-hover:scale-110 transition-transform duration-300">
                <Target size={32} />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                {settings?.misi_title || 'Misi'}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                {settings?.misi_description || 'Memperkasakan pengurusan masjid secara profesional dan dinamik bagi melahirkan jemaah yang bertaqwa dan harmoni.'}
              </p>
            </div>
          </div>

          {/* 4. CTA NAVIGATION BUTTON */}
          <div className="mt-16 text-center">
            <button 
              onClick={() => setSearchParams({ view: 'chart' })}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-900 dark:bg-emerald-600 text-white font-bold text-lg shadow-2xl hover:bg-emerald-700 dark:hover:bg-emerald-500 hover:scale-105 transition-all duration-300 group"
            >
              <span>{settings?.cta_text || 'Lihat Carta Organisasi'}</span>
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Info Section - Additional context */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass-card rounded-[3rem] p-8 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:divide-x divide-slate-100 dark:divide-slate-800">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <MapPin size={24} />
                  <h3 className="font-bold text-xl">Lokasi Kami</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {settings?.address || 'Masjid Unggun,\nKota Kinabalu, Sabah'}
                </p>
              </div>
              <div className="lg:pl-12 space-y-4">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <Phone size={24} />
                  <h3 className="font-bold text-xl">Hubungi Kami</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {settings?.phone || '+60 88-xxx xxx'}
                </p>
              </div>
              <div className="lg:pl-12 space-y-4">
                <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                  <Mail size={24} />
                  <h3 className="font-bold text-xl">Emel Rasmi</h3>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {settings?.email || 'admin@masjidunggun.com'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function OrgChartDetail({ setSearchParams, settings }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button 
          onClick={() => setSearchParams({})}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold mb-8 transition-colors group"
        >
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
          <span>Kembali</span>
        </button>

        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Carta Organisasi</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Struktur pengurusan {settings?.mosque_name || 'Masjid Unggun'}.
          </p>
        </div>

        {/* CENTRAL ORGANIZATIONAL CHART CONTAINER */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden p-4 sm:p-8 lg:p-12 min-h-[60vh] flex items-center justify-center">
          {(settings?.org_chart_url || settings?.organization_chart_url) ? (
            <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm bg-white p-2 sm:p-4">
              <img 
                src={settings.org_chart_url || settings.organization_chart_url} 
                alt="Carta Organisasi" 
                className="w-full h-auto object-contain cursor-zoom-in"
                onClick={() => window.open(settings.org_chart_url || settings.organization_chart_url, '_blank')}
              />
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                <Building size={40} className="text-slate-300 dark:text-slate-700" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Carta organisasi belum dimuat naik oleh pentadbir.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
