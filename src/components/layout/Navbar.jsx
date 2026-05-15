import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function Navbar() {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Utama', path: '/' },
    { name: 'Tentang Kami', path: '/about' },
    { name: 'Acara', path: '/events' },
    { name: 'Korban', path: '/korban' },
    { name: 'Sumbangan', path: '/donations' },
    { name: 'Inventori', path: '/inventory' },
  ];

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 dark:border-slate-800/50 py-3' 
          : 'bg-white/40 dark:bg-slate-950/40 backdrop-blur-md py-5 border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8">
          
          {/* 1. BRANDING (Logo + Title) */}
          <Link to="/" className="flex items-center gap-4 group shrink-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 overflow-hidden ${
              scrolled ? 'bg-emerald-600 scale-90' : 'bg-slate-900 scale-100'
            }`}>
              {settings?.mosque_logo_url ? (
                <img src={settings.mosque_logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-2xl">M</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className={`font-black text-lg sm:text-xl leading-none tracking-tight transition-colors duration-500 ${
                scrolled ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'
              }`}>
                {settings?.mosque_name || 'Masjid Unggun'}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mt-1 transition-colors duration-500 ${
                scrolled ? 'text-emerald-700' : 'text-emerald-600'
              }`}>
                JawatanKuasa Masjid
              </span>
            </div>
          </Link>

          {/* 2. NAVIGATION (Hidden on mobile) */}
          <nav className="hidden lg:flex items-center justify-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-2 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 relative group ${
                    isActive 
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/40 ring-1 ring-emerald-200 dark:ring-emerald-800' 
                      : 'text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-white/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 3. ACTIONS (Admin + Mobile Toggle) */}
          <div className="flex items-center gap-3">
            {/* Admin Portal */}
            <div className="relative">
              {currentUser ? (
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                    scrolled 
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300' 
                      : 'bg-white/60 backdrop-blur-md border-slate-200 text-slate-900'
                  }`}
                >
                  <User size={20} />
                </button>
              ) : (
                <Link 
                  to="/login"
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                    scrolled 
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600' 
                      : 'bg-white/60 backdrop-blur-md border-slate-200 text-slate-900 hover:bg-white'
                  }`}
                >
                  <User size={20} />
                </Link>
              )}

              {/* Dropdown */}
              {isProfileDropdownOpen && currentUser && (
                <div className="absolute right-0 mt-3 w-64 rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 py-3 z-[60] animate-in slide-in-from-top-4 duration-300">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Akses Pentadbir</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.email}</p>
                  </div>
                  <Link 
                    to="/admin" 
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 transition-colors"
                  >
                    <ShieldAlert size={18} /> Admin Dashboard
                  </Link>
                  <button 
                    onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-3 px-6 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors text-left"
                  >
                    <LogOut size={18} /> Log Keluar
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                scrolled 
                  ? 'bg-slate-900 text-white border-slate-800' 
                  : 'bg-white/60 backdrop-blur-md border-slate-200 text-slate-900'
              }`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <div className={`lg:hidden fixed inset-0 top-[88px] z-40 bg-white dark:bg-slate-950 transition-all duration-500 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="p-6 space-y-2 overflow-y-auto max-h-full">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={`block px-6 py-5 rounded-3xl text-lg font-bold transition-all ${
                location.pathname === link.path
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <p className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Akses Sistem</p>
            {currentUser ? (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-6 py-5 rounded-3xl bg-slate-900 text-white font-bold"
              >
                <ShieldAlert size={20} /> Dashboard Pentadbir
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-6 py-5 rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold"
              >
                <User size={20} /> Log Masuk Pentadbir
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
