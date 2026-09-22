import { useState, useEffect } from 'react';
import { Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import schoolLogo from '../../assets/school_logo.png';
import signImage from '../../assets/sign.png';
import { downloadCards } from '../../utils/idCardDownload';

// Preview dimensions — 57×87mm scaled to fit screen (÷4)
const CARD_W = 171;   // 673 / ~4
const CARD_H = 261;   // 1028 / ~4

const resolvePhoto = (p) => {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${p}`;
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ── Reusable row ─────────────────────────────────────────────────────────────
const Row = ({ label, value, color }) => (
  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '2px 0' }}>
    <span style={{ fontSize: 5.5, fontWeight: 700, color, width: 40, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 5.5, fontWeight: 500, color: '#1f2937', flex: 1, wordBreak: 'break-word' }}>{value || '—'}</span>
  </div>
);

// ── STUDENT CARD PREVIEW ─────────────────────────────────────────────────────
const StudentCard = ({ student, settings, color = '#1a3a6b' }) => {
  const photo   = resolvePhoto(student.profileImage);
  const contact = student.fatherMobile || student.motherMobile || student.guardianMobile || '—';
  const logoSrc = settings.schoolLogo
    ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
    : schoolLogo;

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      fontFamily: 'Arial, sans-serif',
      borderRadius: 8, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      flexShrink: 0, background: '#fff',
      position: 'relative',
    }}>
      {/* Ribbon strip */}
      <div style={{ background: color + 'cc', height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* dashed lines */}
        <div style={{ position: 'absolute', left: '38%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.5)' }} />
        <div style={{ position: 'absolute', left: '62%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.5)' }} />
        {/* hole */}
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', border: '1px solid #9ca3af' }} />
      </div>

      {/* Header band */}
      <div style={{ background: `linear-gradient(180deg, ${color} 0%, ${color}ee 100%)`, padding: '5px 7px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #fff', overflow: 'hidden', flexShrink: 0, background: '#fff' }}>
          <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 7, lineHeight: 1.2 }}>
            {settings.schoolName || 'D V Convent School'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 4.5, marginTop: 1 }}>(Govt. Recognised)</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 4, marginTop: 1 }}>
            {settings.schoolAddress || 'Akodha, Rohi, Bhadohi'}
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 4.5, marginTop: 1 }}>
            Ph: {settings.contactNumber || '—'}
          </div>
        </div>
      </div>

      {/* Label band */}
      <div style={{ background: color + '18', padding: '2px 0', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 5, fontWeight: 900, color, letterSpacing: 2 }}>STUDENT IDENTITY CARD</span>
      </div>

      {/* Photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, flexShrink: 0 }}>
        <div style={{ width: 46, height: 56, border: `2px solid ${color}`, overflow: 'hidden', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photo
            ? <img src={photo} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            : <span style={{ fontSize: 22, fontWeight: 900, color }}>{student.name?.charAt(0)}</span>}
        </div>
      </div>
      <div style={{ height: 2, background: color, width: 46, margin: '0 auto', flexShrink: 0 }} />

      {/* Name + UID */}
      <div style={{ textAlign: 'center', padding: '3px 6px 2px' }}>
        <div style={{ fontWeight: 900, fontSize: 7, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
        <div style={{ display: 'inline-block', background: color, color: '#fff', fontSize: 5, fontWeight: 800, padding: '1px 8px', borderRadius: 10, marginTop: 2 }}>
          UID : {student.UID || '—'}
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: '2px 8px', flex: 1 }}>
        <Row label="Class"   value={`Class ${student.class || '—'}`} color={color} />
        <Row label="D.O.B."  value={fmtDate(student.dateOfBirth)}    color={color} />
        <Row label="Contact" value={contact}                          color={color} />
        <Row label="Address" value={student.address || '—'}          color={color} />
      </div>

      {/* Footer */}
      <div style={{ padding: '2px 8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <img src={signImage} alt="sign" style={{ height: 14, objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ fontSize: 4.5, color: '#6b7280', fontWeight: 600 }}>Principal</div>
        </div>
      </div>
      <div style={{ background: color, padding: '2px 6px', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 4, fontWeight: 500 }}>
          If found, return to school • Ph: {settings.contactNumber || '—'}
        </span>
      </div>
    </div>
  );
};

// ── TEACHER CARD PREVIEW ─────────────────────────────────────────────────────
const TeacherCard = ({ teacher, settings }) => {
  const photo   = resolvePhoto(teacher.profileImage);
  const color   = '#7b1d1d';
  const logoSrc = settings.schoolLogo
    ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
    : schoolLogo;

  return (
    <div style={{
      width: CARD_W, height: CARD_H,
      fontFamily: 'Arial, sans-serif',
      borderRadius: 8, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
      flexShrink: 0, background: '#fff',
    }}>
      {/* Ribbon strip */}
      <div style={{ background: color + 'cc', height: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '38%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.5)' }} />
        <div style={{ position: 'absolute', left: '62%', top: 0, bottom: 0, borderLeft: '1px dashed rgba(255,255,255,0.5)' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#fff', border: '1px solid #9ca3af' }} />
      </div>

      {/* Header band */}
      <div style={{ background: `linear-gradient(180deg, ${color} 0%, #b91c1c 100%)`, padding: '5px 7px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #fff', overflow: 'hidden', flexShrink: 0, background: '#fff' }}>
          <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: 7, lineHeight: 1.2 }}>
            {settings.schoolName || 'D V Convent School'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 4.5, marginTop: 1 }}>(Govt. Recognised)</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 4, marginTop: 1 }}>
            {settings.schoolAddress || 'Akodha, Rohi, Bhadohi'}
          </div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 4.5, marginTop: 1 }}>
            Ph: {settings.contactNumber || '—'}
          </div>
        </div>
      </div>

      {/* Label band */}
      <div style={{ background: color + '18', padding: '2px 0', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: 5, fontWeight: 900, color, letterSpacing: 2 }}>STAFF IDENTITY CARD</span>
      </div>

      {/* Photo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, flexShrink: 0 }}>
        <div style={{ width: 46, height: 56, border: `2px solid ${color}`, overflow: 'hidden', background: '#f5e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photo
            ? <img src={photo} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            : <span style={{ fontSize: 22, fontWeight: 900, color }}>{teacher.name?.charAt(0)}</span>}
        </div>
      </div>
      <div style={{ height: 2, background: color, width: 46, margin: '0 auto', flexShrink: 0 }} />

      {/* Name + ID */}
      <div style={{ textAlign: 'center', padding: '3px 6px 2px' }}>
        <div style={{ fontWeight: 900, fontSize: 7, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{teacher.name}</div>
        <div style={{ display: 'inline-block', background: color, color: '#fff', fontSize: 5, fontWeight: 800, padding: '1px 8px', borderRadius: 10, marginTop: 2 }}>
          ID : {teacher.employeeCode || '—'}
        </div>
      </div>

      {/* Info rows */}
      <div style={{ padding: '2px 8px', flex: 1 }}>
        <Row label="Desig."  value={teacher.designation || 'Teacher'} color={color} />
        <Row label="Phone"   value={teacher.phone || '—'}             color={color} />
        <Row label="Address" value={teacher.address || '—'}           color={color} />
      </div>

      {/* Footer */}
      <div style={{ padding: '2px 8px', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', flexShrink: 0 }}>
        <div style={{ textAlign: 'center' }}>
          <img src={signImage} alt="sign" style={{ height: 14, objectFit: 'contain', display: 'block', margin: '0 auto' }} onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ fontSize: 4.5, color: '#6b7280', fontWeight: 600 }}>Principal</div>
        </div>
      </div>
      <div style={{ background: color, padding: '2px 6px', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 4, fontWeight: 500 }}>
          If found, return to school • Ph: {settings.contactNumber || '—'}
        </span>
      </div>
    </div>
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const IDCardGenerator = () => {
  const { settings } = useSettings();
  const [tab, setTab]               = useState('student');
  const [search, setSearch]         = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [items, setItems]           = useState([]);
  const [loading, setLoading]       = useState(false);
  const [toast, setToast]           = useState(null);
  const [selected, setSelected]     = useState(new Set());
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState({});
  const [printing, setPrinting]     = useState(false);
  const [progress, setProgress]     = useState({ current: 0, total: 0 });
  const [studentColor, setStudentColor] = useState('#1a3a6b');

  const PRESET_COLORS = ['#1a3a6b','#1b5e20','#4a148c','#e65100','#880e4f','#006064','#37474f','#b71c1c'];

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [tab, search, classFilter, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'student') {
        const res = await API.get('/admin/students', { params: { search, studentClass: classFilter, status: 'active', page, limit: 20 } });
        setItems(res.data.students); setPagination(res.data.pagination);
      } else {
        const res = await API.get('/admin/teachers', { params: { search, status: 'active', page, limit: 20 } });
        setItems(res.data.teachers); setPagination(res.data.pagination);
      }
    } catch { setToast({ message: 'Failed to load data', type: 'error' }); }
    finally   { setLoading(false); }
  };

  const toggleSelect  = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll     = () => selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i => i._id)));
  const selectedItems = items.filter(i => selected.has(i._id));

  const handleDownload = async () => {
    if (!selectedItems.length) { setToast({ message: 'Select at least one card', type: 'error' }); return; }
    setPrinting(true);
    setProgress({ current: 0, total: selectedItems.length });
    setToast({ message: selectedItems.length === 1 ? 'Preparing PNG…' : 'Preparing ZIP…', type: 'success' });
    try {
      await downloadCards(selectedItems, tab, settings, schoolLogo, signImage,
        (current, total) => setProgress({ current, total }),
        tab === 'student' ? studentColor : null);
      setToast({ message: selectedItems.length === 1 ? 'PNG downloaded!' : `ZIP downloaded (${selectedItems.length} cards)!`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Download failed: ' + err.message, type: 'error' });
    } finally {
      setPrinting(false); setProgress({ current: 0, total: 0 });
    }
  };

  const handleTabChange = (t) => { setTab(t); setSearch(''); setClassFilter(''); setSelected(new Set()); setPage(1); };
  const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">57mm × 87mm • 300 DPI print quality</p>
        </div>
        <button onClick={handleDownload} disabled={printing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          <Download size={16} />
          {printing
            ? progress.total > 1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selectedItems.length > 1 ? `Download ZIP (${selectedItems.length})` : `Download PNG (${selectedItems.length})`}
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['student','Students',<Users size={14}/>],['teacher','Teachers',<GraduationCap size={14}/>]].map(([t,label,icon])=>(
          <button key={t} onClick={() => handleTabChange(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t ? `bg-white ${t==='student'?'text-indigo-700':'text-red-700'} shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 rounded-xl px-3 h-10 border border-gray-100">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input className="bg-transparent text-sm font-medium outline-none w-full placeholder:text-gray-400"
            placeholder={tab==='student' ? 'Search name or UID...' : 'Search name or code...'}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {tab==='student' && (
          <select className="h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-xs font-bold outline-none"
            value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
        )}
        {tab==='student' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Color:</span>
            <div className="flex items-center gap-1">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setStudentColor(c)}
                  style={{ background:c, width:20, height:20, borderRadius:'50%', border: studentColor===c ? '2px solid #111' : '2px solid transparent', outline: studentColor===c ? '2px solid #fff' : 'none', outlineOffset:'-3px', flexShrink:0 }} />
              ))}
              <input type="color" value={studentColor} onChange={e => setStudentColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0" title="Custom color" style={{ padding:0 }} />
            </div>
          </div>
        )}
        <button onClick={toggleAll}
          className="h-10 px-4 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100">
          {selected.size===items.length && items.length>0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : items.length===0 ? (
        <div className="py-20 text-center text-gray-400 font-medium">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item => (
            <div key={item._id} onClick={() => toggleSelect(item._id)} style={{ cursor:'pointer', position:'relative', flexShrink:0 }}>
              {/* selection border */}
              <div style={{ position:'absolute', inset:-3, borderRadius:12, border: selected.has(item._id) ? '3px solid #4f46e5' : '3px solid transparent', transition:'border-color 0.15s', pointerEvents:'none', zIndex:10 }} />
              {selected.has(item._id) && (
                <div style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'#4f46e5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, zIndex:20, boxShadow:'0 2px 6px rgba(79,70,229,0.4)' }}>✔</div>
              )}
              {tab==='student'
                ? <StudentCard student={item} settings={settings} color={studentColor} />
                : <TeacherCard teacher={item} settings={settings} />}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Page {page} / {pagination.totalPages}</span>
          <button disabled={page===pagination.totalPages} onClick={() => setPage(p=>p+1)} className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronRight size={18}/></button>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;
