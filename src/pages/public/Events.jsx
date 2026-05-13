import { useState, useEffect } from 'react';
import { 
  Calendar, Users, Image as ImageIcon, MapPin, Clock, 
  DollarSign, CheckCircle, AlertCircle, Upload, FileText, 
  Tag, ShieldAlert, ArrowRight, ExternalLink, X, Info, Sparkles, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Events() {
  const { settings } = useSettings();
  const { user: currentUser, profile: currentUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [joinedEvents, setJoinedEvents] = useState({}); // { event_id: { status, payment_status } }
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua'); // 'Semua' | 'Percuma' | 'Berbayar'
  
  // Selected Event Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Registration Form Fields
  const [participantName, setParticipantName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [proofFile, setProofFile] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchUserRegistrations();
      // Pre-fill form details
      setParticipantName(currentUserProfile?.full_name || '');
      setPhoneNumber(currentUserProfile?.phone_number || '');
    } else {
      setJoinedEvents({});
    }
  }, [currentUser, currentUserProfile]);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'Published') // Only show published events to public
      .order('date', { ascending: true });
    
    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  }

  async function fetchUserRegistrations() {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', currentUser.id);

    if (error) {
      console.error("Error fetching user registrations:", error);
    } else {
      const joinedMap = {};
      data?.forEach(reg => {
        joinedMap[reg.event_id] = {
          status: reg.registration_status,
          paymentStatus: reg.payment_status,
          proofUrl: reg.payment_proof_url
        };
      });
      setJoinedEvents(joinedMap);
    }
  }

  const handleOpenDetails = (ev) => {
    setSelectedEvent(ev);
    setIsRegistering(false);
    setProofFile(null);
  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
    setIsRegistering(false);
    setProofFile(null);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Sila log masuk untuk menyertai acara.");
      navigate('/login', { state: { from: '/events' } });
      return;
    }

    setSubmitting(true);
    try {
      let paymentProofUrl = null;
      
      // If paid event, require payment proof
      if (selectedEvent.event_type === 'Paid' && proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
        const filePath = `payments/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-proofs')
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-proofs')
          .getPublicUrl(filePath);
          
        paymentProofUrl = publicUrl;
      }

      const { error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: selectedEvent.id,
          user_id: currentUser.id,
          participant_name: participantName,
          phone_number: phoneNumber,
          payment_status: selectedEvent.event_type === 'Paid' ? 'Pending' : 'N/A',
          registration_status: 'Pending',
          payment_proof_url: paymentProofUrl
        });

      if (regError) throw regError;

      alert("Pendaftaran berjaya! Pihak kami akan mengesahkan pendaftaran anda.");
      fetchUserRegistrations();
      handleCloseModal();
    } catch (err) {
      console.error("Registration error:", err);
      alert("Gagal memproses pendaftaran: " + (err.message || "Sila cuba lagi."));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEvents = events.filter(ev => {
    if (activeFilter === 'Semua') return true;
    if (activeFilter === 'Percuma') return ev.event_type === 'Free';
    if (activeFilter === 'Berbayar') return ev.event_type === 'Paid';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-[#0A2E1F] py-24 sm:py-32 mb-16">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-emerald-500 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-teal-500 rounded-full blur-[150px] translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-800/40 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-700/50 text-emerald-200 text-sm font-bold mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <Calendar size={16} className="text-emerald-400" />
            Program & Aktiviti Masjid
          </div>
          <h1 className="text-5xl sm:text-7xl font-black text-white mb-8 tracking-tight leading-[1.1]">Acara & Majlis Ilmu</h1>
          <p className="text-emerald-100/70 text-xl sm:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
            Sertai pelbagai program menarik yang dianjurkan oleh Masjid Unggun untuk mengukuhkan ukhuwah dan ilmu.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <div className="bg-white dark:bg-slate-900 p-2 rounded-[32px] shadow-2xl flex gap-2 border border-slate-200/50 dark:border-slate-800/50 overflow-x-auto max-w-full">
            {['Semua', 'Percuma', 'Berbayar'].map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-10 py-4 rounded-[26px] font-black transition-all duration-500 whitespace-nowrap ${activeFilter === f ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 scale-105' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-bold bg-white dark:bg-slate-900 px-8 py-4 rounded-[28px] shadow-xl border border-slate-100 dark:border-slate-800">
            <Filter size={20} className="text-emerald-600" />
            <span className="text-sm tracking-widest uppercase">Tapis Acara</span>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-black tracking-[0.2em] uppercase text-sm animate-pulse">Memuatkan Acara...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[50px] p-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
              <Calendar className="text-slate-200" size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Tiada Acara Dijumpai</h3>
            <p className="text-slate-500 font-medium text-lg">Buat masa ini tiada acara bagi kategori ini. Sila semak semula nanti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {filteredEvents.map(ev => {
              const registration = joinedEvents[ev.id];
              return (
                <div key={ev.id} className="group bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 overflow-hidden flex flex-col h-full border-t-0">
                  <div className="aspect-[16/10] relative bg-slate-200 overflow-hidden">
                    {ev.poster_url ? (
                      <img src={ev.poster_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon size={64} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                      <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-white/20 ${ev.event_type === 'Paid' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                        {ev.event_type === 'Paid' ? `RM ${ev.price}` : 'Percuma'}
                      </span>
                    </div>
                  </div>

                  <div className="p-10 flex-1 flex flex-col">
                    <div className="mb-8">
                      <h3 className="text-2xl font-black text-[#1E293B] dark:text-white mb-4 leading-tight group-hover:text-emerald-600 transition-colors line-clamp-2">{ev.title}</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[#475569] dark:text-slate-400 font-bold text-sm">
                          <Calendar size={16} className="text-emerald-500" />
                          {new Date(ev.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-3 text-[#475569] dark:text-slate-400 font-bold text-sm">
                          <MapPin size={16} className="text-emerald-500" />
                          {ev.location || 'Dewan Masjid Unggun'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4">
                      {registration ? (
                        <div className={`flex items-center gap-2 font-black text-sm px-4 py-2 rounded-full ${
                          registration.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          <CheckCircle size={16} />
                          {registration.status === 'Approved' ? 'Berdaftar' : 'Dalam Proses'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#64748B] dark:text-slate-500 font-bold text-sm">
                          <Users size={16} />
                          {ev.capacity ? `${ev.capacity} Slot` : 'Terbuka'}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => handleOpenDetails(ev)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-[20px] font-black text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 group/btn"
                      >
                        Lihat Acara
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md overflow-y-auto pt-24 pb-12 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-[50px] shadow-3xl w-full max-w-4xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Left: Poster & Info */}
              <div className="relative bg-slate-100 dark:bg-slate-950">
                {selectedEvent.poster_url ? (
                  <img src={selectedEvent.poster_url} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full min-h-[400px] flex items-center justify-center">
                    <ImageIcon size={80} className="text-slate-200" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-10 left-10 right-10">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4 inline-block ${selectedEvent.event_type === 'Paid' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                    {selectedEvent.event_type === 'Paid' ? `RM ${selectedEvent.price}` : 'Kemasukan Percuma'}
                  </span>
                  <h2 className="text-3xl font-black text-white leading-tight">{selectedEvent.title}</h2>
                </div>
              </div>

              {/* Right: Content & Form */}
              <div className="p-12 flex flex-col h-full">
                <div className="flex justify-between items-start mb-10">
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                      <Calendar size={18} className="text-emerald-600" />
                      <span className="font-black text-emerald-900 dark:text-emerald-300 text-sm">
                        {new Date(selectedEvent.date).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3">
                      <Clock size={18} className="text-slate-400" />
                      <span className="font-black text-slate-800 dark:text-white text-sm">{selectedEvent.time || '8:00 PM'}</span>
                    </div>
                  </div>
                  <button onClick={handleCloseModal} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full hover:scale-110 transition-all text-slate-400">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 space-y-10">
                  {!isRegistering ? (
                    <>
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan Acara</h4>
                        <div className="prose dark:prose-invert max-w-none text-[#334155] dark:text-slate-400 font-medium leading-relaxed">
                          {selectedEvent.description || 'Tiada keterangan lanjut disediakan buat masa ini.'}
                        </div>
                      </div>

                      <div className="pt-6">
                        {joinedEvents[selectedEvent.id] ? (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-8 rounded-[32px] border-2 border-emerald-100 dark:border-emerald-800 flex items-center gap-6">
                            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                              <CheckCircle className="text-emerald-500" size={32} />
                            </div>
                            <div>
                              <p className="font-black text-emerald-900 dark:text-emerald-300 text-xl">Anda Sudah Berdaftar</p>
                              <p className="text-emerald-700/60 dark:text-emerald-400/60 font-bold text-sm">Status: {joinedEvents[selectedEvent.id].status}</p>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setIsRegistering(true)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-4"
                          >
                            Daftar Sekarang
                            <ArrowRight size={24} />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Borang Pendaftaran</h4>
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Penuh Peserta</label>
                          <input type="text" required value={participantName} onChange={e => setParticipantName(e.target.value)} className="w-full px-8 py-5 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold text-lg" />
                        </div>
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombor Telefon</label>
                          <input type="tel" required value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full px-8 py-5 border-2 border-slate-50 dark:border-slate-800 rounded-[24px] bg-slate-50 dark:bg-slate-950 focus:border-emerald-500 outline-none transition-all font-bold text-lg" />
                        </div>

                        {selectedEvent.event_type === 'Paid' && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-[32px] border-2 border-amber-100 dark:border-amber-900/50 space-y-4">
                            <div className="flex items-center gap-3 text-amber-900 dark:text-amber-300">
                              <AlertCircle size={20} />
                              <p className="font-bold">Sila muat naik bukti pembayaran RM {selectedEvent.price}</p>
                            </div>
                            <input 
                              type="file" 
                              required 
                              onChange={e => setProofFile(e.target.files[0])}
                              className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-black file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200" 
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex gap-4">
                        <button type="button" onClick={() => setIsRegistering(false)} className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[28px] font-black text-lg transition-all hover:bg-slate-200">Kembali</button>
                        <button 
                          type="submit" 
                          disabled={submitting}
                          className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {submitting ? 'Memproses...' : 'Sahkan Pendaftaran'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
