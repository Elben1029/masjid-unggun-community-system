import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Search, X, Upload, CheckCircle, 
  XCircle, Filter, Users, Calendar, DollarSign, MapPin, 
  FileText, Clock, ShieldCheck, Tag, ExternalLink 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function EventsManager() {
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'registrations'
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtering States for Events
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'free' | 'paid'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'Akan Datang' | 'Published' | 'Draf' | 'Selesai'
  
  // Filtering States for Registrations
  const [regSearchTerm, setRegSearchTerm] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('all');
  const [regStatusFilter, setRegStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // Form Fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Kuliah / Ceramah');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('Dewan Solat Utama');
  const [status, setStatus] = useState('Akan Datang');
  const [description, setDescription] = useState('');
  
  // Image Uploads
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  
  // Paid Event Controls
  const [eventType, setEventType] = useState('free'); // 'free' | 'paid'
  const [eventFee, setEventFee] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrFile, setQrFile] = useState(null);
  const [paymentNotes, setPaymentNotes] = useState('');
  
  // Registration Settings
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [maxParticipants, setMaxParticipants] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');

  useEffect(() => {
    fetchEvents();
    fetchRegistrations();

    // Setup realtime updates
    const subEvents = supabase
      .channel('admin_events_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations' }, () => {
        fetchRegistrations();
        fetchEvents();
      })
      .subscribe();

    return () => {
      subEvents.unsubscribe();
    };
  }, []);

  async function fetchEvents() {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents(data || []);
    }
  }

  async function fetchRegistrations() {
    const { data, error } = await supabase
      .from('event_registrations')
      .select(`
        *,
        events(title, event_type, event_fee),
        profiles(full_name, email, username)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching registrations:", error);
    } else {
      setRegistrations(data || []);
    }
  }

  const resetForm = () => {
    setCurrentId(null);
    setTitle('');
    setCategory('Kuliah / Ceramah');
    setDate('');
    setStartTime('');
    setEndTime('');
    setLocation('Dewan Solat Utama');
    setStatus('Akan Datang');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setEventType('free');
    setEventFee('');
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setQrCodeUrl('');
    setQrFile(null);
    setPaymentNotes('');
    setRegistrationEnabled(true);
    setMaxParticipants('');
    setRegistrationDeadline('');
  };

  const handleOpenModal = (ev = null) => {
    if (ev) {
      setCurrentId(ev.id);
      setTitle(ev.title || '');
      setCategory(ev.category || 'Kuliah / Ceramah');
      setDate(ev.date ? new Date(ev.date).toISOString().slice(0, 16) : '');
      setStartTime(ev.start_time || '');
      setEndTime(ev.end_time || '');
      setLocation(ev.location || '');
      setStatus(ev.status || 'Akan Datang');
      setDescription(ev.description || '');
      setImageUrl(ev.image_url || '');
      setImageFile(null);
      setEventType(ev.event_type || 'free');
      setEventFee(ev.event_fee || '');
      setBankName(ev.bank_name || '');
      setAccountName(ev.account_name || '');
      setAccountNumber(ev.account_number || '');
      setQrCodeUrl(ev.qr_code_url || '');
      setQrFile(null);
      setPaymentNotes(ev.payment_notes || '');
      setRegistrationEnabled(ev.registration_enabled !== false);
      setMaxParticipants(ev.max_participants || '');
      setRegistrationDeadline(ev.registration_deadline ? new Date(ev.registration_deadline).toISOString().slice(0, 16) : '');
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Upload helper for events bucket
  async function uploadStorageFile(file, prefix = 'img') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('events')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('events')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalPosterUrl = imageUrl;
      let finalQrUrl = qrCodeUrl;

      // Upload new poster if provided
      if (imageFile) {
        finalPosterUrl = await uploadStorageFile(imageFile, 'poster');
      }

      // Upload new QR code if provided and it's a paid event
      if (eventType === 'paid' && qrFile) {
        finalQrUrl = await uploadStorageFile(qrFile, 'qr');
      }

      // Prepare payload
      const payload = {
        title,
        category,
        date: date ? new Date(date).toISOString() : null,
        start_time: startTime,
        end_time: endTime,
        location,
        status,
        description,
        image_url: finalPosterUrl,
        event_type: eventType,
        event_fee: eventType === 'paid' && eventFee ? parseFloat(eventFee) : null,
        bank_name: eventType === 'paid' ? bankName : null,
        account_name: eventType === 'paid' ? accountName : null,
        account_number: eventType === 'paid' ? accountNumber : null,
        qr_code_url: eventType === 'paid' ? finalQrUrl : null,
        payment_notes: eventType === 'paid' ? paymentNotes : null,
        registration_enabled: registrationEnabled,
        max_participants: maxParticipants ? parseInt(maxParticipants, 10) : null,
        registration_deadline: registrationDeadline ? new Date(registrationDeadline).toISOString() : null,
        registered: currentId ? events.find(e => e.id === currentId)?.registered || 0 : 0
      };

      if (currentId) {
        const { error } = await supabase
          .from('events')
          .update(payload)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([payload]);
        if (error) throw error;
      }

      handleCloseModal();
      fetchEvents();
      alert(`Acara berjaya ${currentId ? 'dikemaskini' : 'dicipta'}!`);
    } catch (err) {
      console.error("Error saving event:", err);
      alert("Gagal menyimpan acara: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Adakah anda pasti mahu memadam acara ini secara kekal? Segala rekod pendaftaran juga akan terhapus.')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        if (error) throw error;
        fetchEvents();
      } catch (err) {
        console.error("Error deleting event:", err);
        alert("Gagal memadam acara.");
      }
    }
  };

  const handleUpdateRegistrationStatus = async (regId, newStatus) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ 
          registration_status: newStatus,
          payment_status: newStatus === 'confirmed' ? 'confirmed' : 'pending' 
        })
        .eq('id', regId);
      
      if (error) throw error;
      fetchRegistrations();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Gagal mengemaskini status pendaftaran.");
    }
  };

  // Filtering Logic
  const filteredEvents = events.filter(ev => {
    const matchesSearch = ev.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ev.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || ev.event_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || ev.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const filteredRegistrations = registrations.filter(reg => {
    const nameStr = reg.participant_name || reg.profiles?.full_name || '';
    const matchesSearch = nameStr.toLowerCase().includes(regSearchTerm.toLowerCase()) ||
                          reg.phone_number?.includes(regSearchTerm) ||
                          reg.events?.title?.toLowerCase().includes(regSearchTerm.toLowerCase());
    const matchesEvent = regEventFilter === 'all' || reg.event_id === regEventFilter;
    const matchesStatus = regStatusFilter === 'all' || reg.registration_status === regStatusFilter;
    return matchesSearch && matchesEvent && matchesStatus;
  });

  // Calculate quick metrics
  const totalFreeEvents = events.filter(e => e.event_type !== 'paid').length;
  const totalPaidEvents = events.filter(e => e.event_type === 'paid').length;
  const totalPendingRegs = registrations.filter(r => r.registration_status === 'pending').length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Quick Stat Banners */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Pengurusan Acara</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cipta acara, urus bayaran penyertaan, dan pantau pendaftaran peserta.</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:scale-105"
        >
          <Plus size={18} />
          Cipta Acara Baru
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Acara</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{events.length}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Calendar size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acara Percuma</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalFreeEvents}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Tag size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acara Berbayar</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{totalPaidEvents}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendaftaran Menunggu</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalPendingRegs}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button 
          onClick={() => setActiveTab('events')}
          className={`pb-3 font-bold text-base transition-colors relative flex items-center gap-2 ${
            activeTab === 'events' 
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' 
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Calendar size={18} />
          Senarai Acara ({events.length})
        </button>
        <button 
          onClick={() => setActiveTab('registrations')}
          className={`pb-3 font-bold text-base transition-colors relative flex items-center gap-2 ${
            activeTab === 'registrations' 
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400' 
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users size={18} />
          Senarai Pendaftaran 
          {totalPendingRegs > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {totalPendingRegs}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: Senarai Acara */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari tajuk atau lokasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
              {/* Type Filter Chips */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button 
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Semua Jenis
                </button>
                <button 
                  onClick={() => setTypeFilter('free')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'free' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Percuma
                </button>
                <button 
                  onClick={() => setTypeFilter('paid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === 'paid' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Berbayar
                </button>
              </div>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="Akan Datang">Akan Datang</option>
                <option value="Published">Published</option>
                <option value="Draf">Draf</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>
          </div>

          {/* Events Card Layout Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
                Tiada acara berpadanan dijumpai.
              </div>
            ) : filteredEvents.map((ev) => {
              const isPaid = ev.event_type === 'paid';
              return (
                <div key={ev.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
                  {/* Poster Image Area */}
                  <div className="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {ev.image_url ? (
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600 font-bold text-lg">
                        Tiada Poster
                      </div>
                    )}
                    
                    {/* Top Right Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-md ${
                        isPaid ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {isPaid ? `BERBAYAR (RM${ev.event_fee || 0})` : 'PERCUMA'}
                      </span>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                        ev.status === 'Published' || ev.status === 'Akan Datang' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                        ev.status === 'Draf' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' :
                        'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                      }`}>
                        {ev.status}
                      </span>
                    </div>

                    {/* Bottom overlay metadata */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-3 pt-8">
                      <span className="text-[11px] font-bold text-emerald-400 bg-slate-900/60 backdrop-blur-sm px-2 py-0.5 rounded">
                        {ev.category || 'Umum'}
                      </span>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-emerald-600 transition-colors">
                        {ev.title}
                      </h3>
                      
                      <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400 shrink-0" />
                          <span>{ev.date ? new Date(ev.date).toLocaleDateString('ms-MY', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'Tarikh tidak ditetapkan'}</span>
                        </div>
                        {(ev.start_time || ev.end_time) && (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-400 shrink-0" />
                            <span>{ev.start_time || ''} - {ev.end_time || 'Selesai'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{ev.location || 'Masjid Unggun'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Registration Status Stats Bar */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold uppercase">Peserta</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {ev.registered || 0} {ev.max_participants ? `/ ${ev.max_participants}` : ''} Orang
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleOpenModal(ev)}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 dark:text-slate-400 transition-colors"
                          title="Kemaskini Acara"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:text-slate-400 transition-colors"
                          title="Padam Acara"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: Senarai Pendaftaran Peserta */}
      {activeTab === 'registrations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Sub Filters for Registrations */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama peserta, no tel, atau acara..."
                value={regSearchTerm}
                onChange={(e) => setRegSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Event Filter dropdown */}
              <select 
                value={regEventFilter}
                onChange={(e) => setRegEventFilter(e.target.value)}
                className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none max-w-[200px] truncate"
              >
                <option value="all">Semua Acara</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select 
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Pengesahan</option>
                <option value="confirmed">Disahkan</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nama Peserta</th>
                  <th className="px-6 py-4">Acara</th>
                  <th className="px-6 py-4">Jenis / Yuran</th>
                  <th className="px-6 py-4">Bukti / Rujukan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      Tiada rekod pendaftaran peserta dijumpai.
                    </td>
                  </tr>
                ) : filteredRegistrations.map((reg) => {
                  const eventObj = reg.events || {};
                  const profileObj = reg.profiles || {};
                  const isPaid = eventObj.event_type === 'paid';
                  
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {reg.participant_name || profileObj.full_name || 'Tanpa Nama'}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {reg.phone_number || profileObj.email || profileObj.username || 'Tiada No Tel'}
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                        {eventObj.title || 'Acara Telah Dipadam'}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                          isPaid ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {isPaid ? `RM${eventObj.event_fee || 0}` : 'Percuma'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {reg.payment_proof_url ? (
                          <a 
                            href={reg.payment_proof_url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded"
                          >
                            <ExternalLink size={12} />
                            Lihat Bukti
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Tiada Resit Upload</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          reg.registration_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                          reg.registration_status === 'rejected' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        }`}>
                          {reg.registration_status === 'confirmed' && <CheckCircle size={12} />}
                          {reg.registration_status === 'rejected' && <XCircle size={12} />}
                          {reg.registration_status === 'pending' && <Clock size={12} />}
                          {reg.registration_status === 'confirmed' ? 'Disahkan' : reg.registration_status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                        {reg.registration_status !== 'confirmed' && (
                          <button 
                            onClick={() => handleUpdateRegistrationStatus(reg.id, 'confirmed')}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-xs transition-colors"
                          >
                            Sahkan
                          </button>
                        )}
                        {reg.registration_status !== 'rejected' && (
                          <button 
                            onClick={() => handleUpdateRegistrationStatus(reg.id, 'rejected')}
                            className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-lg font-bold text-xs transition-colors"
                          >
                            Tolak
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT PREMIUM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-100 dark:border-slate-800 my-8">
            {/* Modal Top Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {currentId ? 'Kemaskini Acara' : 'Cipta Acara Baru'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Lengkapkan parameter dan kawalan penyertaan di bawah.</p>
                </div>
              </div>
              <button onClick={handleCloseModal} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            {/* Form Body - Grouped Card Sections */}
            <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
              {/* SECTION 1: Event Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <FileText size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seksyen 1: Maklumat Asas Acara</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tajuk Acara <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      placeholder="Cth: Kuliah Dhuha Mingguan / Kursus Pengurusan Jenazah" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    >
                      <option value="Kuliah / Ceramah">Kuliah / Ceramah</option>
                      <option value="Bengkel & Kursus">Bengkel & Kursus</option>
                      <option value="Sembahyang & Berjemaah">Sembahyang & Berjemaah</option>
                      <option value="Aktiviti Komuniti">Aktiviti Komuniti</option>
                      <option value="Sambutan Perayaan">Sambutan Perayaan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Penerangan Penuh</label>
                  <textarea 
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    placeholder="Butiran aturcara, rujukan penceramah, keperluan peserta dsb..."
                  ></textarea>
                </div>

                {/* Poster Upload Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Poster / Banner Acara</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    {imageUrl && !imageFile && (
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                        <img src={imageUrl} alt="Poster" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {imageFile && (
                      <div className="w-32 h-20 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xs text-emerald-700 font-bold px-2 text-center shrink-0">
                        {imageFile.name}
                      </div>
                    )}
                    <div className="flex-1 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <input 
                        type="file" 
                        id="posterUpload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                      />
                      <label htmlFor="posterUpload" className="cursor-pointer flex flex-col items-center justify-center gap-1">
                        <Upload size={20} className="text-slate-400" />
                        <span className="text-xs font-bold text-emerald-600 hover:underline">Muat naik imej baru</span>
                        <span className="text-[10px] text-slate-400">Format disokong: JPG, PNG, WEBP max 5MB</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Date & Location */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <MapPin size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seksyen 2: Tarikh, Masa & Lokasi</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tarikh Acara</label>
                    <input 
                      type="datetime-local" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Masa Mula</label>
                    <input 
                      type="text" 
                      placeholder="Cth: 08:30 Pagi / Lepas Maghrib"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Masa Tamat</label>
                    <input 
                      type="text" 
                      placeholder="Cth: 12:30 Tengahari"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tempat / Venue</label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    placeholder="Cth: Dewan Utama Masjid Unggun"
                  />
                </div>
              </div>

              {/* SECTION 3: Event Type Selector */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <DollarSign size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seksyen 3: Jenis Penyertaan (Percuma / Berbayar)</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                    eventType === 'free' 
                      ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-sm' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Acara Percuma</span>
                      <input 
                        type="radio" 
                        name="eventTypeSelect" 
                        checked={eventType === 'free'} 
                        onChange={() => setEventType('free')}
                        className="text-emerald-600 focus:ring-emerald-500" 
                      />
                    </div>
                    <span className="text-xs text-slate-400">Penyertaan terbuka tanpa pembayaran yuran wajib.</span>
                  </label>

                  <label className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                    eventType === 'paid' 
                      ? 'border-amber-500 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">Acara Berbayar</span>
                      <input 
                        type="radio" 
                        name="eventTypeSelect" 
                        checked={eventType === 'paid'} 
                        onChange={() => setEventType('paid')}
                        className="text-amber-600 focus:ring-amber-500" 
                      />
                    </div>
                    <span className="text-xs text-slate-400">Sertakan resit/QR pembayaran untuk yuran pendaftaran penganjuran.</span>
                  </label>
                </div>
              </div>

              {/* SECTION 4: Payment Details (Conditional view) */}
              {eventType === 'paid' && (
                <div className="space-y-4 p-5 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl animate-fadeIn">
                  <div className="flex items-center gap-2 border-b border-amber-200/60 dark:border-amber-900/40 pb-2">
                    <ShieldCheck size={16} className="text-amber-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-400">Seksyen 4: Butiran Pembayaran Yuran</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Amaun Yuran (RM) <span className="text-rose-500">*</span></label>
                      <input 
                        type="number" 
                        step="0.01"
                        required={eventType === 'paid'}
                        value={eventFee}
                        onChange={(e) => setEventFee(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                        placeholder="Cth: 50.00" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Bank</label>
                      <input 
                        type="text" 
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                        placeholder="Cth: Maybank Islamic" 
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">No Akaun</label>
                      <input 
                        type="text" 
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                        placeholder="Cth: 562201992019" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Pemegang Akaun</label>
                    <input 
                      type="text" 
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                      placeholder="Cth: Masjid Unggun Kariah" 
                    />
                  </div>

                  {/* QR Code upload for Paid Event */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kod QR DuitNow / Pembayaran</label>
                    <div className="flex flex-col sm:flex-row gap-4 items-start bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      {qrCodeUrl && !qrFile && (
                        <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                          <img src={qrCodeUrl} alt="QR Pembayaran" className="w-full h-full object-contain p-1" />
                        </div>
                      )}
                      {qrFile && (
                        <div className="w-24 h-24 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-xs text-amber-700 font-bold px-2 text-center shrink-0">
                          QR Dipilih
                        </div>
                      )}
                      <div className="flex-1 w-full text-center sm:text-left space-y-2">
                        <input 
                          type="file" 
                          id="qrUpload" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => setQrFile(e.target.files[0])}
                        />
                        <label htmlFor="qrUpload" className="inline-block cursor-pointer px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition-colors">
                          Pilih Imej QR Kod
                        </label>
                        <p className="text-[10px] text-slate-400 block">Digalakkan memuat naik QR rasmi bank untuk mudahkan penyemakan transaksi peserta.</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Arahan Bayaran Tambahan</label>
                    <input 
                      type="text" 
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white"
                      placeholder="Cth: Masukkan rujukan 'KURSUS2026' dalam resit transaksi anda." 
                    />
                  </div>
                </div>
              )}

              {/* SECTION 5: Registration Settings */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Users size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seksyen 5: Tetapan Pendaftaran</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer py-2">
                    <input 
                      type="checkbox" 
                      checked={registrationEnabled} 
                      onChange={(e) => setRegistrationEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" 
                    />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Buka Pendaftaran Dalam Talian</span>
                  </label>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Had Kuota Peserta</label>
                    <input 
                      type="number" 
                      disabled={!registrationEnabled}
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 dark:text-white"
                      placeholder="Cth: 150 (Kosongkan jika tiada had)" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tarikh Tutup Pendaftaran</label>
                    <input 
                      type="datetime-local" 
                      disabled={!registrationEnabled}
                      value={registrationDeadline}
                      onChange={(e) => setRegistrationDeadline(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 6: Publish Controls */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <Tag size={16} className="text-emerald-600" />
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Seksyen 6: Kawalan Penyiaran</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Paparan Umum</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full md:w-1/2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  >
                    <option value="Published">Published (Disiarkan Umum)</option>
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Draf">Draf (Sembunyi dari Umum)</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>
              </div>

              {/* Bottom Trigger actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-md text-sm disabled:opacity-50"
                >
                  {loading ? 'Memproses...' : 'Simpan Acara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
