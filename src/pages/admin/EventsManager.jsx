import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, ExternalLink, X, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function EventsManager() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [currentId, setCurrentId] = useState(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Akan Datang');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchEvents();

    // Subscribe to changes
    const subscription = supabase
      .channel('events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
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

  const resetForm = () => {
    setCurrentId(null);
    setTitle('');
    setDate('');
    setStatus('Akan Datang');
    setDescription('');
    setImageFile(null);
  };

  const handleOpenModal = (event = null) => {
    if (event) {
      setCurrentId(event.id);
      setTitle(event.title || '');
      setDate(event.date ? new Date(event.date).toISOString().slice(0, 16) : '');
      setStatus(event.status || 'Akan Datang');
      setDescription(event.description || '');
      setImageFile(null);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${Date.now()}_${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const eventData = {
        title,
        date,
        status,
        description,
        registered: currentId ? events.find(ev => ev.id === currentId)?.registered || 0 : 0
      };

      if (imageUrl) eventData.image_url = imageUrl;

      if (currentId) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', currentId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        if (error) throw error;
      }

      handleCloseModal();
    } catch (err) {
      console.error("Error saving event: ", err);
      alert("Gagal menyimpan acara. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Adakah anda pasti mahu memadam acara ini?')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error("Error deleting event: ", err);
        alert("Gagal memadam acara.");
      }
    }
  };

  const filteredEvents = events.filter(ev => 
    ev.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Pengurusan Acara</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Cipta Acara Baru
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-slate-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Cari acara..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
              <tr>
                <th className="px-6 py-4">Nama Acara</th>
                <th className="px-6 py-4">Tarikh</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Pendaftaran</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Tiada acara dijumpai.</td>
                </tr>
              ) : filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{event.title}</td>
                  <td className="px-6 py-4">{event.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'Akan Datang' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400' :
                      event.status === 'Selesai' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{event.registered || 0} Orang</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenModal(event)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 mr-2" title="Edit Acara">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1" title="Padam Acara">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cipta / Edit Acara */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {currentId ? 'Edit Acara' : 'Cipta Acara Baru'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tajuk Acara</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                  placeholder="Cth: Kuliah Maghrib Perdana" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tarikh & Masa</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="Akan Datang">Akan Datang</option>
                    <option value="Sedang Berlangsung">Sedang Berlangsung</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Draf">Draf</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Penerangan</label>
                <textarea 
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-teal-500 focus:border-teal-500"
                  placeholder="Maklumat lanjut berkenaan acara..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gambar Poster (Pilihan)</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600 dark:text-slate-400">
                      <label className="relative cursor-pointer rounded-md bg-transparent font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2">
                        <span>Upload a file</span>
                        <input type="file" className="sr-only" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {imageFile ? imageFile.name : 'PNG, JPG up to 5MB'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-5 py-2 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Acara'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
