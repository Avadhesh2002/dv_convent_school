import { useState, useEffect } from 'react';
import { Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import schoolLogo from '../../assets/school_logo.png';
import signImage from '../../assets/sign.png';
import { downloadCards } from '../../utils/idCardDownload';

// Preview scale: 57×87mm ÷ 3.5  →  163×249px
const PW = 163;   // preview width
const PH = 249;   // preview height
const pp = (mm) => Math.round(mm * PW / 57);  // mm → preview px

const resolvePhoto = (p) => {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${p}`;
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  : '—';

// ── CARD PREVIEW COMPONENT ─────────────────────────────────────────────────
const CardPreview = ({ color, accentColor, logoSrc, schoolName, schoolAddress, schoolPhone,
  cardLabel, photo, personName, rows }) => {

  const ribbonH = pp(8);
  const headerH = pp(28);
  const sideW   = pp(8);
  const footerH = pp(9);
  const bodyY   = ribbonH + headerH;
  const bodyH   = PH - ribbonH - headerH - footerH;
  const infoW   = PW - sideW;

  return (
    <div style={{ width: PW, height: PH, position: 'relative', borderRadius: 5,
      overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
      fontFamily: 'Arial,sans-serif', background: '#fff', flexShrink: 0 }}>

      {/* ── Ribbon ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ribbonH,
        background: `linear-gradient(180deg,${color}22 0%,#fff 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: pp(4.4), height: pp(4.4), borderRadius: '50%',
          background: '#fff', border: `0.8px solid ${color}55`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
      </div>

      {/* ── Header ── */}
      <div style={{ position: 'absolute', top: ribbonH, left: 0, right: 0, height: headerH,
        background: `linear-gradient(135deg,${color} 0%,${color} 65%,${accentColor} 100%)`,
        overflow: 'hidden' }}>
        {/* diagonal wedge */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '55%',
          background: accentColor + 'aa',
          clipPath: 'polygon(35% 0,100% 0,100% 100%,0% 100%)' }} />

        {/* Logo */}
        <div style={{ position: 'absolute', top: pp(3), left: pp(3),
          width: pp(11), height: pp(11), borderRadius: '50%',
          border: `1px solid rgba(255,255,255,0.9)`,
          overflow: 'hidden', background: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
          <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* School text */}
        <div style={{ position: 'absolute', top: pp(3), left: pp(16), right: pp(22) }}>
          <div style={{ color: '#fff', fontWeight: 900, fontSize: pp(4), lineHeight: 1.2 }}>{schoolName}</div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, fontSize: pp(3), marginTop: 1 }}>{schoolName}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: pp(2.6), marginTop: 1 }}>{schoolAddress}</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: pp(2.6), marginTop: pp(2) }}>Ph: {schoolPhone}</div>
        </div>

        {/* Photo */}
        <div style={{ position: 'absolute', right: pp(2.5),
          top: (headerH - pp(24)) / 2, width: pp(20), height: pp(24),
          border: '1.5px solid rgba(255,255,255,0.4)',
          overflow: 'hidden', background: '#dbeafe' }}>
          {photo
            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: pp(9), fontWeight: 900, color }}>{personName?.charAt(0)}</div>}
        </div>
      </div>

      {/* ── Right strip ── */}
      <div style={{ position: 'absolute', top: bodyY, right: 0, width: sideW, height: bodyH + footerH,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)',
          color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: pp(3.2),
          letterSpacing: pp(1) }}>
          {cardLabel}
        </div>
      </div>

      {/* ── Info rows ── */}
      <div style={{ position: 'absolute', top: bodyY, left: 0, width: infoW,
        height: bodyH, overflow: 'hidden' }}>
        {rows.map(([lbl, val], i) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'flex-start',
            padding: `${pp(0.8)}px ${pp(3)}px`,
            background: i % 2 === 0 ? color + '07' : 'transparent',
            borderBottom: '0.5px solid #e5e7eb' }}>
            <span style={{ fontSize: pp(2.8), fontWeight: 700, color: color + 'cc', width: pp(14), flexShrink: 0 }}>{lbl}</span>
            <span style={{ fontSize: pp(2.8), color: '#6b7280', marginRight: pp(2) }}>:</span>
            <span style={{ fontSize: pp(2.8), fontWeight: 500, color: '#111827', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: infoW, height: footerH,
        background: '#f9fafb', borderTop: `0.5px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${pp(3)}px` }}>
        <span style={{ fontSize: pp(2.4), fontWeight: 700, color: '#374151' }}>
          📞 {schoolPhone}
        </span>
        <div style={{ textAlign: 'center' }}>
          <img src={signImage} alt="" style={{ height: pp(5.5), objectFit: 'contain', display: 'block', margin: '0 auto' }}
            onError={e => { e.target.style.display='none'; }} />
          <div style={{ fontSize: pp(2.2), color: '#374151', fontWeight: 700 }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

// ── STUDENT CARD ──────────────────────────────────────────────────────────────
const StudentCard = ({ student, settings, color = '#1a3a6b' }) => {
  const accent  = color === '#1a3a6b' ? '#f59e0b' : color + 'aa';
  const logoSrc = settings.schoolLogo
    ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
    : schoolLogo;
  return (
    <CardPreview
      color={color} accentColor={accent} logoSrc={logoSrc}
      schoolName={settings.schoolName || 'D V Convent School'}
      schoolAddress={settings.schoolAddress || 'Akodha, Rohi, Bhadohi'}
      schoolPhone={settings.contactNumber || '—'}
      cardLabel="STUDENT ID CARD"
      photo={resolvePhoto(student.profileImage)}
      personName={student.name}
      rows={[
        ['Name',   student.name || '—'],
        ['F/Name', student.fatherName || '—'],
        ['Class',  `Class ${student.class || '—'}`],
        ['D.O.B',  fmtDate(student.dateOfBirth)],
        ['Address',student.address || '—'],
      ]}
    />
  );
};

// ── TEACHER CARD ──────────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, settings }) => {
  const color = '#7b1d1d', accent = '#f59e0b';
  const logoSrc = settings.schoolLogo
    ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
    : schoolLogo;
  return (
    <CardPreview
      color={color} accentColor={accent} logoSrc={logoSrc}
      schoolName={settings.schoolName || 'D V Convent School'}
      schoolAddress={settings.schoolAddress || 'Akodha, Rohi, Bhadohi'}
      schoolPhone={settings.contactNumber || '—'}
      cardLabel="STAFF ID CARD"
      photo={resolvePhoto(teacher.profileImage)}
      personName={teacher.name}
      rows={[
        ['Name',   teacher.name || '—'],
        ['Desig.', teacher.designation || 'Teacher'],
        ['Phone',  teacher.phone || '—'],
        ['Addr.',  teacher.address || '—'],
      ]}
    />
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
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
  const [studentColor, setStudentColor] = useState('#1a3a6b');

  const PRESET_COLORS = ['#1a3a6b','#0f766e','#1b5e20','#4a148c','#e65100','#880e4f','#37474f','#b71c1c'];
  const CLASSES = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8'];

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
    finally  { setLoading(false); }
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
      setToast({ message: selectedItems.length === 1 ? 'PNG downloaded!' : `ZIP (${selectedItems.length} cards) downloaded!`, type: 'success' });
    } catch (err) {
      setToast({ message: 'Download failed: ' + err.message, type: 'error' });
    } finally {
      setPrinting(false); setProgress({ current: 0, total: 0 });
    }
  };

  const handleTabChange = (t) => { setTab(t); setSearch(''); setClassFilter(''); setSelected(new Set()); setPage(1); };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">57mm × 87mm &nbsp;•&nbsp; 300 DPI &nbsp;•&nbsp; Lanyard hole at top</p>
        </div>
        <button onClick={handleDownload} disabled={printing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          <Download size={16} />
          {printing
            ? progress.total > 1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selectedItems.length > 1 ? `Download ZIP (${selectedItems.length})` : `Download PNG (${selectedItems.length || 0})`}
        </button>
      </div>

      {/* Tabs */}
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
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setStudentColor(c)}
                  style={{ background:c, width:22, height:22, borderRadius:'50%', flexShrink:0,
                    border: studentColor===c ? '2.5px solid #111' : '2.5px solid transparent',
                    outline: studentColor===c ? '2px solid #fff' : 'none', outlineOffset:'-4px',
                    boxShadow: studentColor===c ? `0 0 0 3px ${c}55` : 'none' }} />
              ))}
              <input type="color" value={studentColor} onChange={e => setStudentColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 bg-transparent"
                title="Custom color" style={{ padding: 2 }} />
            </div>
          </div>
        )}
        <button onClick={toggleAll}
          className="h-10 px-4 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100">
          {selected.size===items.length && items.length>0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-medium">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item => (
            <div key={item._id} onClick={() => toggleSelect(item._id)}
              style={{ cursor:'pointer', position:'relative', flexShrink:0 }}>
              <div style={{ position:'absolute', inset:-4, borderRadius:10,
                border: selected.has(item._id) ? '3px solid #4f46e5' : '3px solid transparent',
                transition:'border-color 0.15s', pointerEvents:'none', zIndex:10 }} />
              {selected.has(item._id) && (
                <div style={{ position:'absolute', top:-7, right:-7, width:20, height:20,
                  borderRadius:'50%', background:'#4f46e5', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:900, zIndex:20,
                  boxShadow:'0 2px 8px rgba(79,70,229,0.45)' }}>✔</div>
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
          <button disabled={page===1} onClick={() => setPage(p=>p-1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Page {page} / {pagination.totalPages}</span>
          <button disabled={page===pagination.totalPages} onClick={() => setPage(p=>p+1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronRight size={18}/></button>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;
