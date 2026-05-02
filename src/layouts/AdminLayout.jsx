import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentUser, userRole, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Memuatkan...</div>;
  }

  if (!currentUser || userRole !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 md:hidden sticky top-0 z-40">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-400"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold ml-4 text-slate-800 dark:text-white">Admin Panel</span>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      
      {/* Simple Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-64 h-full bg-white dark:bg-slate-900">
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}
