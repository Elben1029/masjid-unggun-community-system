import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function Navbar() {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
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
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
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
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              {settings?.mosque_name || (
                <>Masjid <span className="text-emerald-700 dark:text-emerald-400">Unggun</span></>
              )}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-base font-bold transition-colors hover:text-emerald-700 dark:hover:text-emerald-300 ${
                  location.pathname === link.path ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User & Mobile Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              {userRole === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 bg-emerald-700 dark:bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-emerald-800 dark:hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all border border-emerald-600 dark:border-emerald-500">
                  <ShieldAlert size={16} />
                  <span>Admin Panel</span>
                </Link>
              )}
              
              {currentUser ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm font-bold">
                    <User size={16} />
                    <span>Profil</span>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-2 rounded-full text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all border border-slate-200 dark:border-slate-700">
                    <LogOut size={16} />
                    <span>Log Keluar</span>
                  </button>
                </>
              ) : (
                <Link to="/login" className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-full text-sm font-bold hover:scale-105 transition-transform duration-200 shadow-md border border-slate-800 dark:border-white">
                  <User size={16} />
                  <span>Log Masuk</span>
                </Link>
              )}
            </div>

            <button
              className="md:hidden p-2 text-slate-600 dark:text-slate-300"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
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
