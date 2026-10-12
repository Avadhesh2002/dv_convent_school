import { useState } from 'react';
import { Download, Tag, Search, Users } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import { generateExamNameTagPDF } from '../../utils/examNameTagPDF';

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'];

// ── Small preview card (visual only) ──────────────────────────
const TagPreview = ({ student, index }) => (
  <div className="flex items-stretch rounded-xl border border-blue-100 overflow-hidden shadow-sm bg-white" style={{ minHeight: 72 }}>
    {/* Left blue strip */}
    <div className="w-5 bg-blue-700 flex items-center justify-center shrink-0">
      <span className="text-white text-[7px] font-black tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
        EXAM
      </span>
    </div>
    {/* Content */}
    <div className="flex-1 px-3 py-2 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-2">
        <p className="font-black text-gray-900 text-sm leading-tight truncate">{student.name || '—'}</p>
        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 shrink-0">
          #{String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[10px] font-bold bg-blue-700 text-white rounded-full px-2 py-0.5">
          UID: {student.UID || '—'}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-600">
        <span><span className="font-bold text-blue-600">Class:</span> {student.class || '—'}</span>
        <span className="truncate"><span className="font-bold text-blue-600">Father:</span> {student.fatherName || '—'}</span>
      </div>
    </div>
  </div>
);

// ── MAIN PAGE ─────────────────────────────────────────────────
const ExamNameTagGenerator = () => {
  const { settings } = useSettings();

  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch]               = useState('');
  const [students, setStudents]           = useState([]);
  const [fetched, setFetched]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [toast, setToast]                 = useState(null);

  // ── Fetch students ───────────────────────────────────────
  const fetchStudents = async () => {
    if (!selectedClass) {
      setToast({ message: 'Pehle class select karo', type: 'error' });
      return;
    }
    setLoading(true);
    setFetched(false);
    setStudents([]);
    try {
      const r = await API.get('/admin/students', {
        params: { studentClass: selectedClass, status: 'active', limit: 9999 },
      });
      const list = r.data.students || [];
      if (!list.length) {
        setToast({ message: `Class ${selectedClass} mein koi student nahi mila`, type: 'error' });
      }
      setStudents(list);
      setFetched(true);
    } catch {
      setToast({ message: 'Students fetch karne mein error aaya', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered list for preview ────────────────────────────
  const filtered = search.trim()
    ? students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.UID?.toLowerCase().includes(search.toLowerCase())
      )
    : students;

  // ── PDF download ─────────────────────────────────────────
  const handleDownload = async () => {
    if (!students.length) {
      setToast({ message: 'Pehle class ke students load karo', type: 'error' });
      return;
    }
    setDownloading(true);
    setToast({ message: `${students.length} name tags ka PDF ban raha hai…`, type: 'success' });
    try {
      // jsPDF is synchronous but can freeze UI — give React a tick to render toast
      await new Promise(r => setTimeout(r, 50));
      generateExamNameTagPDF(students, settings, selectedClass);
      setToast({ message: `PDF downloaded — ${students.length} tags, ${Math.ceil(students.length / 16)} page(s)`, type: 'success' });
    } catch (e) {
      setToast({ message: 'PDF download failed: ' + e.message, type: 'error' });
    } finally {
      setDownloading(false);
    }
  };

  const totalPages = Math.ceil(students.length / 16);

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Tag size={22} className="text-blue-600" />
            Exam Name Tag Generator
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A4 Portrait • 2 × 8 = 16 tags per page • Cut along dashed lines
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={!students.length || downloading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Download size={16} />
          {downloading
            ? 'PDF ban raha hai…'
            : students.length
              ? `Download PDF (${students.length} tags, ${totalPages} page${totalPages > 1 ? 's' : ''})`
              : 'Download PDF'}
        </button>
      </div>

      {/* ── Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-end gap-3">
        {/* Class select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Class</label>
          <select
            value={selectedClass}
            onChange={e => { setSelectedClass(e.target.value); setFetched(false); setStudents([]); }}
            className="h-10 bg-gray-50 border border-gray-200 rounded-xl px-3 text-sm font-bold outline-none min-w-[130px]"
          >
            <option value="">-- Class चुनें --</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        </div>

        {/* Load button */}
        <button
          onClick={fetchStudents}
          disabled={!selectedClass || loading}
          className="h-10 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-5 rounded-xl transition-colors"
        >
          <Users size={15} />
          {loading ? 'Loading…' : 'Students Load Karo'}
        </button>

        {/* Search (only after fetch) */}
        {fetched && students.length > 0 && (
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 rounded-xl px-3 h-10 border border-gray-100">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              className="bg-transparent text-sm font-medium outline-none w-full placeholder:text-gray-400"
              placeholder="Naam ya UID se dhundho…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Stats badges */}
        {students.length > 0 && (
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <span className="bg-blue-50 text-blue-700 border border-blue-100 text-xs font-black px-3 py-1.5 rounded-xl">
              {students.length} Students
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black px-3 py-1.5 rounded-xl">
              {totalPages} A4 Page{totalPages > 1 ? 's' : ''}
            </span>
            <span className="bg-purple-50 text-purple-700 border border-purple-100 text-xs font-black px-3 py-1.5 rounded-xl">
              16 Tags / Page
            </span>
          </div>
        )}
      </div>

      {/* ── Info banner ── */}
      {!fetched && !loading && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
          <Tag size={36} className="text-blue-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-blue-700">Upar se class select karo aur "Students Load Karo" click karo</p>
          <p className="text-xs text-blue-500 mt-1">Saare students ek saath PDF mein aa jayenge — har tag mein naam, class, UID aur father's name hoga</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* ── Preview grid ── */}
      {!loading && fetched && students.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Preview — {filtered.length} tag{filtered.length !== 1 ? 's' : ''}
              {search ? ` (filtered from ${students.length})` : ''}
            </p>
            <p className="text-xs text-gray-400">PDF mein exactly aise dikhega</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((s, i) => (
              <TagPreview key={s._id} student={s} index={students.indexOf(s)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-10 text-center text-gray-400 text-sm">Koi student nahi mila is search ke liye</div>
          )}
        </>
      )}

      {/* ── Empty after fetch ── */}
      {!loading && fetched && students.length === 0 && (
        <div className="py-16 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">Class {selectedClass} mein koi active student nahi hai</p>
        </div>
      )}
    </div>
  );
};

export default ExamNameTagGenerator;
