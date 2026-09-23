import { useState, useEffect, useRef } from 'react';
import { Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import schoolLogo from '../../assets/school_logo.png';
import signImage from '../../assets/sign.png';
import {
  downloadCards,
  drawCardToCanvas,
  buildStudentOpts,
  buildTeacherOpts,
} from '../../utils/idCardDownload';

// Preview dimensions (same aspect as 57×87mm)
const PREVIEW_W = 163;
const PREVIEW_H = 249;

// ── Helpers ───────────────────────────────────────────────────────────────
const resolvePhoto = (p) => {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  return `${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${p}`;
};

const loadImg = (src) => new Promise((res) => {
  if (!src) return res(null);
  const i = new Image(); i.crossOrigin = 'anonymous';
  i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

const getLogoSrc = (s) => s.schoolLogo
  ? (s.schoolLogo.startsWith('data:') ? s.schoolLogo : `data:image/png;base64,${s.schoolLogo}`)
  : schoolLogo;

// ── Canvas preview — EXACTLY same as download ─────────────────────────────
const CardCanvas = ({ item, type, settings, color }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const [logoImg, signImg, photoImg] = await Promise.all([
        loadImg(getLogoSrc(settings)),
        loadImg(signImage),
        loadImg(resolvePhoto(item.profileImage)),
      ]);
      if (cancelled) return;
      const opts = type === 'student'
        ? { ...buildStudentOpts(item), color }
        : buildTeacherOpts(item);
      await drawCardToCanvas(canvas, settings, { logoImg, signImg, photoImg }, opts);
    })();
    return () => { cancelled = true; };
  }, [item._id, type, settings, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:  PREVIEW_W,
        height: PREVIEW_H,
        display: 'block',
        borderRadius: 5,
        boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
      }}
    />
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
const IDCardGenerator = () => {
  const { settings } = useSettings();
  const [tab, setTab]                   = useState('student');
  const [search, setSearch]             = useState('');
  const [classFilter, setClassFilter]   = useState('');
  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [toast, setToast]               = useState(null);
  const [selected, setSelected]         = useState(new Set());
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState({});
  const [printing, setPrinting]         = useState(false);
  const [progress, setProgress]         = useState({ current: 0, total: 0 });
  const [studentColor, setStudentColor] = useState('#1565c0');

  const PRESET  = ['#1565c0','#0d47a1','#1b5e20','#4a148c','#b71c1c','#e65100','#37474f','#880e4f'];
  const CLASSES = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8'];

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [tab, search, classFilter, page]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'student') {
        const r = await API.get('/admin/students', {
          params: { search, studentClass: classFilter, status: 'active', page, limit: 20 },
        });
        setItems(r.data.students); setPagination(r.data.pagination);
      } else {
        const r = await API.get('/admin/teachers', {
          params: { search, status: 'active', page, limit: 20 },
        });
        setItems(r.data.teachers); setPagination(r.data.pagination);
      }
    } catch { setToast({ message: 'Failed to load', type: 'error' }); }
    finally  { setLoading(false); }
  };

  const toggle    = (id) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selected.size === items.length
    ? setSelected(new Set())
    : setSelected(new Set(items.map(i => i._id)));
  const selItems  = items.filter(i => selected.has(i._id));

  const handleDl = async () => {
    if (!selItems.length) { setToast({ message: 'Select at least one card', type: 'error' }); return; }
    setPrinting(true); setProgress({ current: 0, total: selItems.length });
    setToast({ message: selItems.length === 1 ? 'Preparing PNG…' : 'Preparing ZIP…', type: 'success' });
    try {
      await downloadCards(
        selItems, tab, settings, schoolLogo, signImage,
        (c, t) => setProgress({ current: c, total: t }),
        tab === 'student' ? studentColor : '#1565c0',
      );
      setToast({ message: selItems.length === 1 ? 'PNG downloaded!' : 'ZIP downloaded!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Download failed: ' + e.message, type: 'error' });
    } finally {
      setPrinting(false); setProgress({ current: 0, total: 0 });
    }
  };

  const switchTab = (t) => {
    setTab(t); setSearch(''); setClassFilter(''); setSelected(new Set()); setPage(1);
  };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 mt-0.5">57×87mm • 300 DPI • Preview = Download</p>
        </div>
        <button onClick={handleDl} disabled={printing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <Download size={16} />
          {printing
            ? progress.total > 1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selItems.length > 1 ? `Download ZIP (${selItems.length})` : `Download PNG (${selItems.length || 0})`}
        </button>
      </div>

      {/* Tab */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['student','Students',<Users size={14}/>],['teacher','Teachers',<GraduationCap size={14}/>]].map(([t,lbl,icon])=>(
          <button key={t} onClick={() => switchTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?'bg-white text-blue-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>
            {icon}{lbl}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 rounded-xl px-3 h-10 border border-gray-100">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            className="bg-transparent text-sm font-medium outline-none w-full placeholder:text-gray-400"
            placeholder={tab === 'student' ? 'Search name or UID...' : 'Search name or code...'}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {tab === 'student' && (
          <select
            className="h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-xs font-bold outline-none"
            value={classFilter}
            onChange={e => { setClassFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        )}
        {tab === 'student' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Color:</span>
            <div className="flex items-center gap-1.5">
              {PRESET.map(c => (
                <button key={c} onClick={() => setStudentColor(c)}
                  style={{
                    background: c, width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: studentColor === c ? '2.5px solid #111' : '2.5px solid transparent',
                    outline: studentColor === c ? '2px solid #fff' : 'none', outlineOffset: '-4px',
                    boxShadow: studentColor === c ? `0 0 0 3px ${c}55` : 'none',
                  }}
                />
              ))}
              <input
                type="color" value={studentColor}
                onChange={e => setStudentColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200"
                style={{ padding: 2 }}
              />
            </div>
          </div>
        )}
        <button onClick={toggleAll}
          className="h-10 px-4 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors">
          {selected.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item => (
            <div
              key={item._id}
              onClick={() => toggle(item._id)}
              style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}
            >
              {/* selection ring */}
              <div style={{
                position: 'absolute', inset: -4, borderRadius: 10,
                border: selected.has(item._id) ? '3px solid #1565c0' : '3px solid transparent',
                transition: 'border-color 0.15s', pointerEvents: 'none', zIndex: 10,
              }} />
              {selected.has(item._id) && (
                <div style={{
                  position: 'absolute', top: -7, right: -7, width: 20, height: 20,
                  borderRadius: '50%', background: '#1565c0', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, zIndex: 20,
                  boxShadow: '0 2px 8px rgba(21,101,192,0.45)',
                }}>✔</div>
              )}
              {/* Canvas preview — same rendering as download */}
              <CardCanvas
                item={item}
                type={tab}
                settings={settings}
                color={tab === 'student' ? studentColor : '#1565c0'}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm">
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">
            Page {page} / {pagination.totalPages}
          </span>
          <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm">
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;
