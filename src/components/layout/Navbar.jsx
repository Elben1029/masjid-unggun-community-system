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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* TOP TIER: Branding & Admin Access */}
        <div className="flex justify-between items-center mb-2">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg group-hover:shadow-emerald-500/30 transition-all duration-300 overflow-hidden">
              {settings?.mosque_logo_url ? (
                <img src={settings.mosque_logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-xl">M</span>
              )}
            </div>
            <span className={`font-extrabold text-2xl tracking-tighter transition-colors duration-500 ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white drop-shadow-md'}`}>
              {settings?.mosque_name || 'Masjid Unggun'}
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Admin Profile/Login Icon */}
            {currentUser ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all shadow-lg ${
                    scrolled 
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                    : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  <User size={20} />
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-semibold text-slate-400">Admin</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                        {currentUser.email}
                      </p>
                    </div>
                    
                    <Link 
                      to="/admin" 
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      <ShieldAlert size={16} />
                      <span>Admin Dashboard</span>
                    </Link>
                    
                    <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                    
                    <button 
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <LogOut size={16} />
                      <span>Log Keluar</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all shadow-lg ${
                scrolled 
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50' 
                : 'bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20'
              }`}>
                <User size={20} />
              </Link>
            )}

            {/* Mobile Toggle */}
            <button
              className={`md:hidden p-2 transition-colors ${scrolled ? 'text-slate-900 dark:text-white' : 'text-white'}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* BOTTOM TIER: Navigation Bar */}
        <nav className={`hidden md:flex items-center justify-center gap-10 py-3 border-t transition-colors duration-500 ${scrolled ? 'border-slate-100 dark:border-slate-800/50' : 'border-white/10'}`}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`text-[15px] font-black transition-all duration-300 relative py-1.5 tracking-wide group ${
                  isActive 
                    ? scrolled ? 'text-emerald-700 dark:text-emerald-400' : 'text-white'
                    : scrolled 
                      ? 'text-slate-800 dark:text-slate-300 hover:text-emerald-600' 
                      : 'text-white/80 hover:text-white'
                }`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300 rounded-full ${isActive ? 'w-full' : 'w-0 group-hover:w-full'} ${!scrolled && isActive ? 'bg-white' : ''}`}></span>
              </Link>
            );
          })}
        </nav>
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
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              Dashboard Admin
            </Link>
          ) : (
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-bold text-slate-600 dark:text-slate-400"
            >
              Log Masuk Pentadbir
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
