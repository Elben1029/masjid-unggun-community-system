import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, DollarSign, Calendar as CalendarIcon, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const donationData = [
  { name: 'Jan', sumbangan: 4000 },
  { name: 'Feb', sumbangan: 3000 },
  { name: 'Mac', sumbangan: 2000 },
  { name: 'Apr', sumbangan: 2780 },
  { name: 'Mei', sumbangan: 1890 },
  { name: 'Jun', sumbangan: 2390 },
];

const eventData = [
  { name: 'Minggu 1', hadirin: 120 },
  { name: 'Minggu 2', hadirin: 200 },
  { name: 'Minggu 3', hadirin: 150 },
  { name: 'Minggu 4', hadirin: 280 },
];

export default function Dashboard() {
  const [stats, setStats] = useState([
    { label: 'Jumlah Ahli', value: '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Sumbangan (Disahkan)', value: 'RM 0', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Acara Aktif', value: '0', icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Aset & Inventori', value: '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ]);

  useEffect(() => {
    async function fetchStats() {
      // 1. Fetch Users count
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      
      // 2. Fetch Donations sum
      const { data: donations } = await supabase.from('donations').select('amount').eq('status', 'Disahkan');
      const totalDonations = donations?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // 3. Fetch Events count
      const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });

      // 4. Fetch Inventory count
      const { count: inventoryCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true });

      setStats([
        { label: 'Jumlah Ahli', value: usersCount?.toLocaleString() || '0', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Sumbangan (Disahkan)', value: `RM ${totalDonations.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { label: 'Acara Aktif', value: eventsCount?.toLocaleString() || '0', icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        { label: 'Aset & Inventori', value: inventoryCount?.toLocaleString() || '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
      ]);
    }

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Dashboard Utama</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Tren Sumbangan 6 Bulan</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="sumbangan" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Kehadiran Acara (Bulan Ini)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={eventData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="hadirin" stroke="#6366f1" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
