import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BackButton({ to = -1, label = "Kembali" }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => typeof to === 'number' ? navigate(to) : navigate(to)}
      className="inline-flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors group mb-6"
    >
      <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      {label}
    </button>
  );
}
