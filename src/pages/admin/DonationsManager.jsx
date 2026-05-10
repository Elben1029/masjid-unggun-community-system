import { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DonationsManager() {
  const [donations, setDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonations();

    const subscription = supabase
      .channel('donations_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => {
        fetchDonations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchDonations() {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching donations:", error);
    } else {
      setDonations(data || []);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (id, newStatus) => {
    if (window.confirm(`Adakah anda pasti mahu menukar status kepada ${newStatus}?`)) {
      try {
        const { error } = await supabase
          .from('donations')
          .update({ status: newStatus })
          .eq('id', id);
        
        if (error) throw error;
      } catch (err) {
        console.error("Error updating status:", err);
        alert("Gagal mengemaskini status.");
      }
    }
  };

  const filteredDonations = donations.filter(d => 
    d.contributor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.fund_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pengurusan Sumbangan</h1>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-4">Tarikh</th>
                <th className="px-6 py-4">Penyumbang</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Tabung</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Memuatkan...</td></tr>
              ) : filteredDonations.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Tiada sumbangan dijumpai.</td></tr>
              ) : filteredDonations.map((donation) => (
                <tr key={donation.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">{new Date(donation.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{donation.contributor_name || 'Hamba Allah'}</td>
                  <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400">RM {Number(donation.amount).toFixed(2)}</td>
                  <td className="px-6 py-4">{donation.fund_id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      donation.status === 'Disahkan' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      donation.status === 'Ditolak' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {donation.receipt_url && (
                      <a href={donation.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 mr-2 inline-block" title="Lihat Resit">
                        <Eye size={18} />
                      </a>
                    )}
                    {donation.status === 'Menunggu Pengesahan' && (
                      <>
                        <button onClick={() => handleUpdateStatus(donation.id, 'Disahkan')} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 p-1 mr-2" title="Sahkan">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => handleUpdateStatus(donation.id, 'Ditolak')} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1" title="Tolak">
                          <XCircle size={18} />
                        </button>
                      </>
                    )}
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
