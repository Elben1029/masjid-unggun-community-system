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
  
  const { currentUser, userRole, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Utama', path: '/' },
    { name: 'Acara', path: '/events' },
    { name: 'Sumbangan', path: '/donations' },
    { name: 'Korban', path: '/korban' },
    { name: 'Inventori', path: '/inventory' },
    { name: 'Tentang Kami', path: '/about' },
  ];

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'navbar-scrolled py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300 overflow-hidden">
              {settings?.mosque_logo_url ? (
                <img src={settings.mosque_logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">M</span>
              )}
            </div>
            <span className={`font-black text-xl tracking-tight transition-colors duration-300 ${scrolled ? 'text-white' : 'text-white'}`}>
              {settings?.mosque_name || (
                <>Masjid <span className="text-emerald-400">Unggun</span></>
              )}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-base font-bold transition-all duration-300 ${
                    isActive 
                      ? 'text-emerald-400 border-b-2 border-emerald-400 pb-0.5' 
                      : 'text-white hover:text-emerald-400'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              {currentUser ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-bold border border-white/20 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 shadow-sm"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-xs uppercase">
                      {currentUser.email ? currentUser.email[0] : 'U'}
                    </div>
                    <span>Profil</span>
                  </button>
                  
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn text-slate-900 dark:text-white">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-semibold text-slate-400">Log masuk sebagai</p>
                        <p className="text-sm font-black truncate">
                          {currentUser.email || 'Pengguna'}
                        </p>
                      </div>
                      
                      <Link 
                        to="/profile" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                      >
                        <User size={16} />
                        <span>Lihat & Edit Profil</span>
                      </Link>
                      
                      {userRole === 'admin' && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ShieldAlert size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                      
                      <button 
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
                      >
                        <LogOut size={16} />
                        <span>Log Keluar</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300 shadow-xl bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-500 hover:scale-105">
                  <User size={16} />
                  <span>Log Masuk</span>
                </Link>
              )}
            </div>

            <button
              className="md:hidden p-2 transition-colors duration-300 text-white"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle Menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 shadow-lg border-t border-slate-100 dark:border-slate-800 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-[85vh] overflow-y-auto py-4' : 'max-h-0 py-0'}`}>
        <div className="flex flex-col px-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block px-3 py-2 rounded-lg text-base font-bold text-slate-900 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2"></div>

          {currentUser ? (
            <>
              {userRole === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/profile"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-bold text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Profil
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="mt-4 w-full text-center bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 px-4 py-3 rounded-xl text-base font-bold transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/40"
              >
                Log Keluar
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl text-base font-bold shadow-md transition-colors"
            >
              Log Masuk / Daftar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
