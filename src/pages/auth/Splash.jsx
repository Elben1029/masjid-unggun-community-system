import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Splash() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate loading time, then go to Home or Login
    const timer = setTimeout(() => {
      navigate('/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/20 blur-[100px]" />
      </div>

      <div className={`relative z-10 flex flex-col items-center transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8 animate-bounce-slow">
          <span className="text-white font-bold text-5xl">M</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white mb-2">
          Masjid <span className="text-emerald-600 dark:text-emerald-400">Unggun</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Sistem Pengurusan Komprehensif
        </p>

        <div className="mt-12 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
}
