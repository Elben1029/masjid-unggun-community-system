import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Box, Users, FileText, Download, Edit, Trash2, 
  Check, X, Search, Filter, MessageCircle, Mail,
  CreditCard, ExternalLink, RefreshCcw, TrendingUp,
  Package, LayoutDashboard, Plus, Clock, ShieldCheck
} from 'lucide-react';

export default function KorbanManager() {
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, bookings, participants, packages
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [packages, setPackages] = useState([]);
  const [payers, setPayers] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'bookings') {
        const { data: bData, error: bError } = await supabase
          .from('korban_bookings')
          .select('*, payer:korban_payers(*), participants:korban_participants(*)')
          .order('created_at', { ascending: false });
        if (bError) throw bError;
        setBookings(bData || []);
      }
      
      if (activeTab === 'dashboard' || activeTab === 'packages') {
        const { data: pData, error: pError } = await supabase
          .from('korban_packages')
          .select('*')
          .order('created_at', { ascending: true });
        if (pError) throw pError;
        setPackages(pData || []);
      }
      
      if (activeTab === 'dashboard' || activeTab === 'participants') {
        const { data: partData, error: partError } = await supabase
          .from('korban_participants')
          .select('*, booking:korban_bookings(status, korban_payers(*)), package:korban_packages(name)')
          .order('created_at', { ascending: false });
        if (partError) throw partError;
        setParticipants(partData || []);
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Dashboard Stats
  const totalRevenue = bookings.filter(b => b.payment_status === 'Verified').reduce((acc, b) => acc + Number(b.total_amount), 0);
  const pendingPayments = bookings.filter(b => b.payment_status === 'Pending Verification').length;
  const totalParticipants = participants.length;
  
  // Handlers
  const updatePaymentStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('korban_bookings')
        .update({ 
          payment_status: status, 
          status: status === 'Verified' ? 'completed' : status === 'Rejected' ? 'cancelled' : 'pending',
          verified_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Ralat mengemaskini status.");
    }
  };

  const handlePrintCertificate = (participant) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Sijil Ibadah Korban - ${participant.participant_name}</title>
          <style>
            body { font-family: 'Georgia', serif; text-align: center; padding: 50px; background: #fdfdfd; }
            .certificate { border: 15px solid #6b21a8; padding: 50px; border-radius: 20px; background: white; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { font-size: 50px; color: #6b21a8; margin-bottom: 10px; }
            h2 { font-size: 24px; color: #333; font-weight: normal; margin-bottom: 40px; }
            p { font-size: 20px; color: #666; margin: 10px 0; }
            .name { font-size: 40px; font-weight: bold; color: #111; margin: 30px 0; text-decoration: underline; }
            .package { font-size: 24px; font-weight: bold; color: #6b21a8; margin: 20px 0; }
            .footer { margin-top: 80px; display: flex; justify-content: space-around; }
            .signature { border-top: 2px solid #333; width: 250px; padding-top: 10px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h1>SIJIL PENGHARGAAN</h1>
            <h2>PELAKSANAAN IBADAH KORBAN 1447H</h2>
            <p>Dengan ini disahkan bahawa</p>
            <div class="name">${participant.participant_name}</div>
            <p>Telah menyertai ibadah korban bagi pakej:</p>
            <div class="package">${participant.package?.name || '-'}</div>
            <p>Pihak pengurusan merakamkan jutaan terima kasih. Semoga Allah SWT menerima ibadah korban ini.</p>
            <div class="footer">
              <div class="signature">Pengerusi Masjid</div>
              <div class="signature">Pengarah Program</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const savePackage = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      if (selectedItem) {
        const { error } = await supabase.from('korban_packages').update(data).eq('id', selectedItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('korban_packages').insert([data]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Ralat menyimpan pakej.");
    }
  };

  const deletePackage = async (id) => {
    if (!confirm("Padam pakej ini?")) return;
    try {
      const { error } = await supabase.from('korban_packages').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Ralat memadam pakej.");
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Box className="text-purple-600" size={32} />
            Pengurusan Korban
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Sistem Pengurusan Ibadah Korban Moden</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b-2 border-slate-200 dark:border-slate-800">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'bookings', label: 'Semakan Pembayaran', icon: ShieldCheck },
          { id: 'participants', label: 'Senarai Peserta', icon: Users },
          { id: 'packages', label: 'Pakej & Haiwan', icon: Package },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 font-bold flex items-center gap-2 whitespace-nowrap transition-all border-b-4 -mb-[2px] ${
              activeTab === tab.id 
                ? 'border-purple-600 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10' 
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Kutipan</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white">RM {totalRevenue.toFixed(2)}</h3>
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Menunggu Sah</p>
                      <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400">{pendingPayments}</h3>
                    </div>
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Clock size={24} /></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Peserta</p>
                      <h3 className="text-3xl font-black text-purple-600 dark:text-purple-400">{totalParticipants}</h3>
                    </div>
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><Users size={24} /></div>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Pakej</p>
                      <h3 className="text-3xl font-black text-blue-600 dark:text-blue-400">{packages.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Package size={24} /></div>
                  </div>
                </div>
              </div>
              
              {/* Recent Bookings in Dashboard */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transaksi Terkini</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-purple-600 font-bold text-sm hover:underline">Lihat Semua</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-sm text-slate-500">
                        <th className="pb-4 font-bold">Pembayar</th>
                        <th className="pb-4 font-bold">Jumlah (RM)</th>
                        <th className="pb-4 font-bold">Status Bayaran</th>
                        <th className="pb-4 font-bold">Tarikh</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map(b => (
                        <tr key={b.id} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="py-4 font-bold text-slate-900 dark:text-white">{b.payer?.[0]?.full_name || 'Tiada Data'}</td>
                          <td className="py-4 font-bold text-slate-700 dark:text-slate-300">{Number(b.total_amount).toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              b.payment_status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                              b.payment_status === 'Pending Verification' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {b.payment_status}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-500">{new Date(b.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Maklumat Tempahan & Pembayar</th>
                      <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Jumlah</th>
                      <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Resit & Rujukan</th>
                      <th className="p-5 font-bold text-slate-600 dark:text-slate-300">Status</th>
                      <th className="p-5 font-bold text-slate-600 dark:text-slate-300 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(booking => (
                      <tr key={booking.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-5">
                          <div className="font-bold text-slate-900 dark:text-white">{booking.payer?.[0]?.full_name}</div>
                          <div className="text-xs text-slate-500">{booking.payer?.[0]?.phone} | {booking.payer?.[0]?.email}</div>
                          <div className="mt-2 text-xs text-slate-400">{booking.participants?.length || 0} Peserta</div>
                        </td>
                        <td className="p-5">
                          <span className="font-black text-slate-900 dark:text-white">RM {Number(booking.total_amount).toFixed(2)}</span>
                        </td>
                        <td className="p-5">
                          <div className="flex flex-col gap-2">
                            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">{booking.reference_number || '-'}</span>
                            {booking.receipt_url ? (
                              <a href={booking.receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-700">
                                <ExternalLink size={14} /> Lihat Resit
                              </a>
                            ) : (
                              <span className="text-xs text-red-500 italic">Tiada Resit</span>
                            )}
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            booking.payment_status === 'Verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            booking.payment_status === 'Pending Verification' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td className="p-5 text-right space-x-2">
                          {booking.payment_status === 'Pending Verification' && (
                            <>
                              <button onClick={() => updatePaymentStatus(booking.id, 'Verified')} className="p-2 bg-emerald-100 text-emerald-600 hover:bg-emerald-200 rounded-lg transition-colors" title="Sahkan">
                                <Check size={18} />
                              </button>
                              <button onClick={() => updatePaymentStatus(booking.id, 'Rejected')} className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors" title="Tolak">
                                <X size={18} />
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
          )}

          {activeTab === 'participants' && (
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <div className="flex gap-4 w-full max-w-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Cari nama peserta..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-purple-500/20" />
                  </div>
                  <button className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2 hover:bg-slate-50">
                    <Filter size={18} /> Filter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500">
                      <th className="p-5 font-bold">Nama Peserta</th>
                      <th className="p-5 font-bold">Pakej</th>
                      <th className="p-5 font-bold">Status Bayaran</th>
                      <th className="p-5 font-bold">Komunikasi</th>
                      <th className="p-5 font-bold text-right">Sijil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map(part => {
                      const payer = part.booking?.korban_payers?.[0];
                      const payStatus = part.booking?.status;
                      const wappNumber = payer?.phone ? payer.phone.replace('+', '') : '';

                      return (
                        <tr key={part.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-5">
                            <div className="font-bold text-slate-900 dark:text-white">{part.participant_name}</div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <User size={12}/> Pembayar: {payer?.full_name || 'Unknown'}
                            </div>
                          </td>
                          <td className="p-5 font-medium text-slate-700 dark:text-slate-300">
                            {part.package?.name || '-'}
                          </td>
                          <td className="p-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              payStatus === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              payStatus === 'pending' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {payStatus === 'completed' ? 'Selesai' : payStatus === 'pending' ? 'Menunggu' : 'Batal'}
                            </span>
                          </td>
                          <td className="p-5 space-x-2">
                            {wappNumber && (
                              <a href={`https://wa.me/${wappNumber}`} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200" title="WhatsApp">
                                <MessageCircle size={16} />
                              </a>
                            )}
                            {payer?.email && (
                              <a href={`mailto:${payer.email}`} className="inline-flex p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200" title="Email">
                                <Mail size={16} />
                              </a>
                            )}
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => handlePrintCertificate(part)}
                              disabled={payStatus !== 'completed'}
                              className={`p-2 rounded-lg font-bold flex items-center gap-2 ml-auto ${
                                payStatus === 'completed' ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <FileText size={16} /> <span className="text-xs">Cetak Sijil</span>
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'packages' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button 
                  onClick={() => { setSelectedItem(null); setModalType('package'); setIsModalOpen(true); }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
                >
                  <Plus size={20} /> Tambah Pakej Baru
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map(pkg => (
                  <div key={pkg.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{pkg.name}</h3>
                        <p className="text-sm text-slate-500">{pkg.animal_type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        pkg.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pkg.status}
                      </span>
                    </div>
                    <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mb-6">RM {Number(pkg.price).toFixed(2)}</p>
                    
                    <div className="space-y-4 mb-6 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Baki Kuota</span>
                        <span className="font-bold text-slate-900 dark:text-white">{pkg.available_quota} / {pkg.quota}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(pkg.available_quota / pkg.quota) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedItem(pkg); setModalType('package'); setIsModalOpen(true); }}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deletePackage(pkg.id)}
                        className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Package Form Modal */}
      {isModalOpen && modalType === 'package' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedItem ? 'Kemaskini Pakej' : 'Tambah Pakej Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={24} /></button>
            </div>
            
            <form onSubmit={savePackage} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Pakej</label>
                <input name="name" defaultValue={selectedItem?.name} required className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jenis Haiwan</label>
                  <select name="animal_type" defaultValue={selectedItem?.animal_type} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white">
                    <option value="Lembu">Lembu</option>
                    <option value="Kambing">Kambing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Bil. Bahagian</label>
                  <input name="shares" type="number" defaultValue={selectedItem?.shares || 1} required className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Harga (RM)</label>
                  <input name="price" type="number" step="0.01" defaultValue={selectedItem?.price} required className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jumlah Kuota</label>
                  <input name="quota" type="number" defaultValue={selectedItem?.quota} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Deskripsi Ringkas</label>
                <input name="description" defaultValue={selectedItem?.description} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Status</label>
                <select name="status" defaultValue={selectedItem?.status || 'active'} className="w-full px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-purple-500 outline-none dark:text-white">
                  <option value="active">Aktif</option>
                  <option value="inactive">Tidak Aktif</option>
                </select>
              </div>
              
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-4 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-lg">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
