import { ClipboardList } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function KorbanManager() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const { data, error } = await supabase.from('korban_registrations').select('*, profiles(email, phone)');
        if (error) throw error;
        setRegistrations(data || []);
      } catch (err) {
        console.error("Error fetching korban registrations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRegistrations();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pengurusan Korban</h1>
          <p className="text-slate-500 mt-1">Uruskan pendaftaran dan status peserta korban.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">Tiada Pendaftaran</h3>
            <p className="text-slate-500 mt-1">Belum ada sebarang pendaftaran korban direkodkan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Nama Peserta</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">No. Telefon</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Jenis Bahagian</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Status</th>
                  <th className="p-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">{reg.participant_name}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{reg.contact_number}</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400 capitalize">{reg.part_type.replace('_', ' ')}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        reg.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        reg.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {reg.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">Urus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
