import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Users, DollarSign, Calendar as CalendarIcon, Package, ClipboardList, Clock } from 'lucide-react';
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
    { label: 'Sumbangan (Disahkan)', value: 'RM 0', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Acara (Bulan Ini)', value: '0', icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Pendaftaran Korban', value: '0', icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { label: 'Aset & Inventori', value: '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Kelulusan Tertunda', value: '0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Sumbangan (Cash Donations)
        const { data: donations } = await supabase.from('cash_donations').select('amount').eq('status', 'approved');
        const totalDonations = donations?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

        // Total Events
        const { count: eventsCount } = await supabase.from('events').select('*', { count: 'exact', head: true });

        // Korban Registrations
        const { count: korbanCount } = await supabase.from('korban_registrations').select('*', { count: 'exact', head: true });

        // Inventory
        const { count: inventoryCount } = await supabase.from('inventory').select('*', { count: 'exact', head: true });

        // Pending Approvals (Sum of pending from various tables)
        const { count: pendingDonations } = await supabase.from('cash_donations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingKorban } = await supabase.from('korban_registrations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingFood } = await supabase.from('food_donations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        const { count: pendingAsset } = await supabase.from('asset_waqf_donations').select('*', { count: 'exact', head: true }).eq('status', 'pending');
        
        const totalPending = (pendingDonations || 0) + (pendingKorban || 0) + (pendingFood || 0) + (pendingAsset || 0);

        setStats([
          { label: 'Sumbangan (Disahkan)', value: `RM ${totalDonations.toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
          { label: 'Acara Keseluruhan', value: eventsCount?.toLocaleString() || '0', icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
          { label: 'Pendaftaran Korban', value: korbanCount?.toLocaleString() || '0', icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
          { label: 'Aset & Inventori', value: inventoryCount?.toLocaleString() || '0', icon: Package, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          { label: 'Kelulusan Tertunda', value: totalPending.toLocaleString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        ]);

        // Fetch Recent Transactions
        const [cashRes, foodRes, assetRes] = await Promise.all([
          supabase.from('cash_donations').select('id, donor_name, status, created_at, amount').order('created_at', { ascending: false }).limit(5),
          supabase.from('food_donations').select('id, donor_name, status, created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('asset_waqf_donations').select('id, donor_name, status, created_at').order('created_at', { ascending: false }).limit(5)
        ]);

        const recent = [
          ...(cashRes.data || []).map(d => ({ ...d, type: 'Wang Ringgit' })),
          ...(foodRes.data || []).map(d => ({ ...d, type: 'Jadual Sumbangan Makanan' })),
          ...(assetRes.data || []).map(d => ({ ...d, type: 'Wakaf Aset' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

        setRecentTransactions(recent);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      }
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

      {/* Recent Transactions Table */}
      <div className="mt-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Transaksi Terkini (Kelulusan Diperlukan)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Tarikh</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Jenis Transaksi</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {recentTransactions.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-500">Tiada transaksi terkini.</td></tr>
              ) : recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">{new Date(tx.created_at).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{tx.donor_name || 'Hamba Allah'}</td>
                  <td className="px-4 py-3">{tx.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      tx.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      (tx.status === 'approved' || tx.status === 'completed') ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
