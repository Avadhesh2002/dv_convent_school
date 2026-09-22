import { useState, useEffect } from 'react';
import { Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import schoolLogo from '../../assets/school_logo.png';
import signImage from '../../assets/sign.png';
import { downloadCards } from '../../utils/idCardDownload';

// Preview: 57×87mm ÷ 3.5
const CARD_W = 163;
const CARD_H = 249;

const resolvePhoto = (p) => {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${base}${p}`;
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, color, even }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start',
    padding: '2px 6px',
    background: even ? color + '08' : 'transparent',
    borderBottom: '0.5px solid #e5e7eb',
  }}>
    <div style={{ width: 5, marginTop: 3.5, marginRight: 4, flexShrink: 0 }}>
      <div style={{ width: 3.5, height: 3.5, borderRadius: '50%', background: color }} />
    </div>
    <span style={{ fontSize: 5, fontWeight: 700, color: color + 'bb', width: 28, flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 5, fontWeight: 500, color: '#1f2937', flex: 1, wordBreak: 'break-word', lineHeight: 1.4 }}>{value || '—'}</span>
  </div>
);

// ── Shared card shell ─────────────────────────────────────────────────────────
const CardShell = ({ color, accentColor, logoSrc, schoolName, schoolAddress, schoolPhone,
  cardLabel, photo, personName, idLine, rows, signSlot }) => (
  <div style={{
    width: CARD_W, height: CARD_H,
    fontFamily: 'Arial, sans-serif',
    borderRadius: 7, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
    flexShrink: 0, background: '#fff',
  }}>

    {/* ── Ribbon space: clean white with subtle tint + punch hole ── */}
    <div style={{
      height: 13, flexShrink: 0,
      background: `linear-gradient(180deg, ${color}18 0%, #fff 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <div style={{ position: 'absolute', left: '35%', top: 0, bottom: 0, borderLeft: `0.5px solid ${color}20` }} />
      <div style={{ position: 'absolute', left: '65%', top: 0, bottom: 0, borderLeft: `0.5px solid ${color}20` }} />
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: '#fff', border: `0.8px solid ${color}50`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }} />
    </div>

    {/* ── Header gradient band ── */}
    <div style={{
      background: `linear-gradient(135deg, ${color} 0%, ${accentColor} 100%)`,
      padding: '5px 7px', flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 6,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* shimmer stripes */}
      {[15, 45, 75].map(x => (
        <div key={x} style={{
          position: 'absolute', left: `${x}%`, top: '-20%', bottom: '-20%', width: 14,
          background: 'rgba(255,255,255,0.045)', transform: 'skewX(-25deg)',
        }} />
      ))}
      {/* Logo */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.9)',
        overflow: 'hidden', flexShrink: 0, background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1,
      }}>
        <img src={logoSrc} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {/* School info */}
      <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 7, lineHeight: 1.25 }}>{schoolName}</div>
        <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 3.8, marginTop: 1 }}>Govt. Recognised School</div>
        <div style={{ color: 'rgba(255,255,255,0.8)',  fontSize: 3.5, marginTop: 0.5 }}>{schoolAddress}</div>
        <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700, fontSize: 4, marginTop: 1 }}>Ph: {schoolPhone}</div>
      </div>
    </div>

    {/* ── Card type label ── */}
    <div style={{ background: accentColor, padding: '2px 0', textAlign: 'center', flexShrink: 0 }}>
      <span style={{ color: '#fff', fontWeight: 900, fontSize: 4.5, letterSpacing: 2 }}>{cardLabel}</span>
    </div>

    {/* ── Photo ── */}
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 5, flexShrink: 0 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 44, height: 54, overflow: 'hidden', borderRadius: 3,
          border: `2px solid ${color}`,
          boxShadow: `0 4px 12px ${color}40`,
          background: '#eef2ff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {photo
            ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
            : <span style={{ fontSize: 22, fontWeight: 900, color }}>{personName?.charAt(0)}</span>}
        </div>
        {/* left accent */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '3px 0 0 3px' }} />
        {/* bottom bar */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, ${accentColor})` }} />
      </div>
    </div>

    {/* ── Name ── */}
    <div style={{ textAlign: 'center', padding: '3.5px 6px 0' }}>
      <div style={{ fontWeight: 900, fontSize: 7.5, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {personName}
      </div>
    </div>

    {/* ── ID Pill ── */}
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
      <div style={{
        background: `linear-gradient(90deg, ${color}, ${accentColor})`,
        color: '#fff', fontSize: 4.8, fontWeight: 800,
        padding: '2px 10px', borderRadius: 10,
        boxShadow: `0 2px 8px ${color}55`,
        letterSpacing: 0.5,
      }}>
        {idLine}
      </div>
    </div>

    {/* ── Info rows ── */}
    <div style={{ flex: 1, marginTop: 4 }}>
      {rows.map(([lbl, val], i) => (
        <InfoRow key={lbl} label={lbl} value={val} color={color} even={i % 2 === 0} />
      ))}
    </div>

    {/* ── Sign slot ── */}
    {signSlot}

    {/* ── Bottom strip ── */}
    <div style={{
      background: `linear-gradient(90deg, ${color}, ${accentColor})`,
      padding: '3px 6px', textAlign: 'center', flexShrink: 0,
    }}>
      <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 3.8, fontWeight: 500 }}>
        If found, return to school  •  {schoolName}
      </span>
    </div>
  </div>
);

// ── Sign slot component ───────────────────────────────────────────────────────
const SignSlot = ({ color }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 10px 1px', flexShrink: 0 }}>
    <div style={{ textAlign: 'center' }}>
      <img src={signImage} alt="sign"
        style={{ height: 13, objectFit: 'contain', display: 'block', margin: '0 auto' }}
        onError={e => { e.target.style.display = 'none'; }} />
      <div style={{ width: 40, borderTop: `0.6px solid ${color}50`, margin: '1px auto 0' }} />
      <div style={{ fontSize: 3.8, color: '#6b7280', fontWeight: 600, marginTop: 1 }}>Principal</div>
    </div>
  </div>
);

// ── STUDENT CARD ──────────────────────────────────────────────────────────────
const StudentCard = ({ student, settings, color = '#1a3a6b' }) => {
  const accentColor = color === '#1a3a6b' ? '#2563eb' : color + 'bb';
  const logoSrc = settings.schoolLogo
    ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
    : schoolLogo;
  const contact = student.fatherMobile || student.motherMobile || student.guardianMobile || '—';

  return (
    <CardShell
      color={color} accentColor={accentColor} logoSrc={logoSrc}
      schoolName={settings.schoolName || 'D V Convent School'}
      schoolAddress={settings.schoolAddress || 'Akodha, Rohi, Bhadohi'}
      schoolPhone={settings.contactNumber || '—'}
      cardLabel="STUDENT  IDENTITY  CARD"
      photo={resolvePhoto(student.profileImage)}
      personName={student.name}
      idLine={`UID : ${student.UID || '—'}`}
      rows={[
        ['Class',   `Class ${student.class || '—'}`],
        ['DOB',     fmtDate(student.dateOfBirth)],
        ['Father',  student.fatherName || '—'],
        ['Contact', contact],
        ['Address', student.address || '—'],
      ]}
      signSlot={<SignSlot color={color} />}
    />
  );
};

// ── TEACHER CARD ──────────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, settings }) => {
  const color = '#7b1d1d', accentColor = '#b91c1c';
  const logoSrc = settings.schoolLogo
    ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
    : schoolLogo;

  return (
    <CardShell
      color={color} accentColor={accentColor} logoSrc={logoSrc}
      schoolName={settings.schoolName || 'D V Convent School'}
      schoolAddress={settings.schoolAddress || 'Akodha, Rohi, Bhadohi'}
      schoolPhone={settings.contactNumber || '—'}
      cardLabel="STAFF  IDENTITY  CARD"
      photo={resolvePhoto(teacher.profileImage)}
      personName={teacher.name}
      idLine={`ID : ${teacher.employeeCode || '—'}`}
      rows={[
        ['Desig.',  teacher.designation || 'Teacher'],
        ['Phone',   teacher.phone || '—'],
        ['Address', teacher.address || '—'],
      ]}
      signSlot={<SignSlot color={color} />}
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

  const PRESET_COLORS = ['#1a3a6b','#1b5e20','#4a148c','#e65100','#880e4f','#006064','#37474f','#b71c1c'];
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
      setToast({ message: selectedItems.length === 1 ? 'PNG downloaded!' : `ZIP downloaded (${selectedItems.length} cards)!`, type: 'success' });
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

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">57 × 87 mm  •  300 DPI print quality  •  Lanyard hole space at top</p>
        </div>
        <button onClick={handleDownload} disabled={printing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          <Download size={16} />
          {printing
            ? progress.total > 1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selectedItems.length > 1 ? `Download ZIP (${selectedItems.length})` : `Download PNG (${selectedItems.length || 0})`}
        </button>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['student','Students',<Users size={14}/>],['teacher','Teachers',<GraduationCap size={14}/>]].map(([t,label,icon])=>(
          <button key={t} onClick={() => handleTabChange(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t ? `bg-white ${t==='student'?'text-indigo-700':'text-red-700'} shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Filters + color ── */}
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
            <span className="text-xs font-bold text-gray-500">Card Color:</span>
            <div className="flex items-center gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setStudentColor(c)}
                  style={{ background:c, width:22, height:22, borderRadius:'50%', flexShrink:0,
                    border: studentColor===c ? '2.5px solid #111' : '2.5px solid transparent',
                    outline: studentColor===c ? '2px solid #fff' : 'none', outlineOffset:'-4px',
                    boxShadow: studentColor===c ? `0 0 0 3px ${c}60` : 'none' }} />
              ))}
              <input type="color" value={studentColor} onChange={e => setStudentColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200 bg-transparent p-0.5"
                title="Custom color" />
            </div>
          </div>
        )}

        <button onClick={toggleAll}
          className="h-10 px-4 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100">
          {selected.size===items.length && items.length>0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* ── Cards grid ── */}
      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-medium">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item => (
            <div key={item._id} onClick={() => toggleSelect(item._id)}
              style={{ cursor:'pointer', position:'relative', flexShrink:0 }}>
              {/* selection ring */}
              <div style={{ position:'absolute', inset:-4, borderRadius:12,
                border: selected.has(item._id) ? '3px solid #4f46e5' : '3px solid transparent',
                transition:'border-color 0.15s', pointerEvents:'none', zIndex:10 }} />
              {selected.has(item._id) && (
                <div style={{ position:'absolute', top:-7, right:-7, width:20, height:20,
                  borderRadius:'50%', background:'#4f46e5', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:900, zIndex:20, boxShadow:'0 2px 8px rgba(79,70,229,0.45)' }}>✔</div>
              )}
              {tab === 'student'
                ? <StudentCard student={item} settings={settings} color={studentColor} />
                : <TeacherCard teacher={item} settings={settings} />}
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
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
