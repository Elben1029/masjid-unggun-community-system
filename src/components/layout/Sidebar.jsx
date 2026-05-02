import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  Heart, 
  Box, 
  Users, 
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Calendar, label: 'Events', path: '/admin/events' },
    { icon: Heart, label: 'Donations', path: '/admin/donations' },
    { icon: Box, label: 'Inventory', path: '/admin/inventory' },
    { icon: Users, label: 'Users', path: '/admin/users' },
    { icon: Settings, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col hidden md:flex">
      <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <span className="text-white font-bold">M</span>
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-white">Admin Panel</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={20} className={isActive ? 'text-teal-600 dark:text-teal-400' : ''} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
