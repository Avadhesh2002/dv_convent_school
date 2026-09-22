import { useState, useEffect } from 'react';
import { Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import schoolLogo from '../../assets/school_logo.png';
import signImage from '../../assets/sign.png';
import { downloadCards } from '../../utils/idCardDownload';

// Preview 57×87mm ÷ 3.5
const PW = 163, PH = 249;
const pp = (mm) => mm * PW / 57;

const resolvePhoto = (p) => {
  if (!p) return null;
  if (p.startsWith('data:') || p.startsWith('http')) return p;
  return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${p}`;
};
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';
const getLogoSrc = (s) => s.schoolLogo
  ? (s.schoolLogo.startsWith('data:') ? s.schoolLogo : `data:image/png;base64,${s.schoolLogo}`)
  : schoolLogo;

// ── CARD PREVIEW ──────────────────────────────────────────────────────────
const IDCard = ({ color = '#1565c0', logoSrc, sName, sAddr, sPhone, photo, personName, idLine, rows, classVal }) => {
  const RH=pp(5), HH=pp(18), PZH=pp(18), NUH=pp(8), IH=pp(21), SFH=pp(9), BSH=pp(8);
  const HY=RH, PZY=HY+HH, NUY=PZY+PZH, IY=NUY+NUH, SFY=IY+IH, BTSY=SFY+SFH;
  const PW2=pp(18), PHGT=pp(22), PX=(PW-PW2)/2, PYY=PZY+pp(1);
  const rowH=IH/rows.length;

  return (
    <div style={{ width: PW, height: PH, position: 'relative', fontFamily: 'Arial,sans-serif',
      background: '#fff', borderRadius: 5, overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }}>

      {/* 1. Ribbon — blue (same as bottom) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: RH,
        background: color }} />

      {/* 2. Header */}
      <div style={{ position: 'absolute', top: HY, left: 0, right: 0, height: HH,
        background: `linear-gradient(180deg, #1565c0 0%, #1976d2 100%)` }}>
        {/* Logo */}
        <div style={{ position: 'absolute', left: pp(2.5), top: '50%', transform: 'translateY(-50%)',
          width: pp(11), height: pp(11), borderRadius: '50%',
          overflow: 'hidden', background: '#fff' }}>
          <img src={logoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        {/* Text */}
        <div style={{ position: 'absolute', left: pp(15.5), right: pp(2), top: pp(1) }}>
          <div style={{ color: '#fff', fontWeight: 900, lineHeight: 1.2,
            fontSize: sName.length > 20 ? pp(2.8) : sName.length > 14 ? pp(3.2) : pp(3.8),
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sName}</div>
          <div style={{ color: 'rgba(255,255,255,0.88)', fontSize: pp(1.9), marginTop: pp(0.4) }}>
            (Govt. Recognised)
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: pp(1.9), marginTop: pp(0.2),
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sAddr}</div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: pp(2.2), marginTop: pp(0.6) }}>
            Phone No.: {sPhone}
          </div>
        </div>
      </div>

      {/* 3. Photo zone */}
      <div style={{ position: 'absolute', top: PZY, left: 0, right: 0, height: PZH, background: '#fff' }}>
        <div style={{ position: 'absolute', left: PX - pp(0.6), top: PYY - pp(0.6),
          width: PW2 + pp(1.2), height: PHGT + pp(1.2),
          border: `${pp(0.6)}px solid ${color}`, background: '#dbeafe' }}>
          {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />}
        </div>
        {!photo && (
          <div style={{ position: 'absolute', left: PX, top: PYY, width: PW2, height: PHGT,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: pp(8), fontWeight: 900, color: color + '66' }}>
            {personName?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </div>

      {/* 4. Name + UID */}
      <div style={{ position: 'absolute', top: NUY, left: pp(2), right: pp(2), height: NUH,
        background: '#fff', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1,
          fontSize: (personName?.length||0) > 18 ? pp(2.8) : pp(3.2),
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: pp(0.4) }}>
          {personName}
        </div>
        <div style={{ display: 'inline-block', marginTop: pp(0.7),
          background: color, color: '#fff', fontWeight: 800, fontSize: pp(2.2),
          padding: `${pp(0.6)}px ${pp(3)}px`, borderRadius: pp(3) }}>
          {idLine}
        </div>
      </div>

      {/* 5. Info table */}
      <div style={{ position: 'absolute', top: IY, left: 0, right: 0, height: IH,
        background: '#fff', overflow: 'hidden', borderTop: '0.5px solid #e0e0e0' }}>
        {rows.map(([lbl, val], i) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', height: rowH,
            padding: `0 ${pp(3)}px`,
            background: i % 2 === 0 ? '#f5f8ff' : '#fff',
            borderBottom: '0.5px solid #e0e0e0', boxSizing: 'border-box' }}>
            <span style={{ fontSize: pp(2.2), fontWeight: 700, color, width: pp(17), flexShrink: 0 }}>{lbl}</span>
            <span style={{ fontSize: pp(2.2), color: '#1a1a1a', flex: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
          </div>
        ))}
      </div>

      {/* 6. Sign footer */}
      <div style={{ position: 'absolute', top: SFY, left: 0, right: 0, height: SFH,
        background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${pp(3)}px`, borderTop: '0.5px solid #e0e0e0' }}>
        <span style={{ fontWeight: 900, fontSize: pp(3), color: '#1a1a1a' }}>
          Class : {classVal}
        </span>
        <div style={{ textAlign: 'center' }}>
          <img src={signImage} alt="" style={{ height: pp(4.5), objectFit: 'contain', display: 'block', margin: '0 auto' }}
            onError={e => { e.target.style.display = 'none'; }} />
          <div style={{ width: pp(18), borderTop: '0.5px solid #333', marginTop: pp(0.5) }} />
          <div style={{ fontSize: pp(2), color: '#333', marginTop: pp(0.5) }}>Principal Sign.</div>
        </div>
      </div>

      {/* 7. Bottom strip */}
      <div style={{ position: 'absolute', top: BTSY, left: 0, right: 0, height: BSH,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: pp(2), color: '#fff', fontWeight: 500 }}>
          If found, please return to school  •  Ph: {sPhone}
        </span>
      </div>
    </div>
  );
};

const StudentCard = ({ student, settings, color = '#1565c0' }) => (
  <IDCard
    color={color}
    logoSrc={getLogoSrc(settings)}
    sName={settings.schoolName || 'D V Convent School'}
    sAddr={settings.schoolAddress || 'Vill-Akodha,Post-Rohi,Dist-Bhadohi,221308'}
    sPhone={settings.contactNumber || '—'}
    photo={resolvePhoto(student.profileImage)}
    personName={student.name}
    idLine={`UID: ${student.UID || '—'}`}
    classVal={student.class || '—'}
    rows={[
      ["Father's Name", student.fatherName || '—'],
      ["Mother's Name", student.motherName || '—'],
      ['D.O.B.',        fmtDate(student.dateOfBirth)],
      ['Contact No.',   student.fatherMobile || student.motherMobile || student.guardianMobile || '—'],
      ['Add.',          student.address || '—'],
    ]}
  />
);

const TeacherCard = ({ teacher, settings }) => (
  <IDCard
    color="#1565c0"
    logoSrc={getLogoSrc(settings)}
    sName={settings.schoolName || 'D V Convent School'}
    sAddr={settings.schoolAddress || 'Vill-Akodha,Post-Rohi,Dist-Bhadohi,221308'}
    sPhone={settings.contactNumber || '—'}
    photo={resolvePhoto(teacher.profileImage)}
    personName={teacher.name}
    idLine={`ID: ${teacher.employeeCode || '—'}`}
    classVal={teacher.designation || 'Teacher'}
    rows={[
      ['Designation', teacher.designation || 'Teacher'],
      ['Phone',       teacher.phone || '—'],
      ['Address',     teacher.address || '—'],
    ]}
  />
);

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

  const PRESET = ['#1565c0', '#0d47a1', '#1b5e20', '#4a148c', '#b71c1c', '#e65100', '#37474f', '#880e4f'];
  const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'];

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [tab, search, classFilter, page]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'student') {
        const r = await API.get('/admin/students', { params: { search, studentClass: classFilter, status: 'active', page, limit: 20 } });
        setItems(r.data.students); setPagination(r.data.pagination);
      } else {
        const r = await API.get('/admin/teachers', { params: { search, status: 'active', page, limit: 20 } });
        setItems(r.data.teachers); setPagination(r.data.pagination);
      }
    } catch { setToast({ message: 'Failed to load', type: 'error' }); }
    finally  { setLoading(false); }
  };

  const toggle    = (id) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i => i._id)));
  const selItems  = items.filter(i => selected.has(i._id));

  const handleDl = async () => {
    if (!selItems.length) { setToast({ message: 'Select at least one card', type: 'error' }); return; }
    setPrinting(true); setProgress({ current: 0, total: selItems.length });
    setToast({ message: selItems.length === 1 ? 'Preparing PNG…' : 'Preparing ZIP…', type: 'success' });
    try {
      await downloadCards(selItems, tab, settings, schoolLogo, signImage,
        (c, t) => setProgress({ current: c, total: t }),
        tab === 'student' ? studentColor : '#1565c0');
      setToast({ message: selItems.length === 1 ? 'PNG downloaded!' : 'ZIP downloaded!', type: 'success' });
    } catch (e) { setToast({ message: 'Download failed: ' + e.message, type: 'error' }); }
    finally { setPrinting(false); setProgress({ current: 0, total: 0 }); }
  };

  const switchTab = (t) => { setTab(t); setSearch(''); setClassFilter(''); setSelected(new Set()); setPage(1); };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 mt-0.5">57×87mm • 300 DPI • Ribbon space at top</p>
        </div>
        <button onClick={handleDl} disabled={printing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <Download size={16} />
          {printing
            ? progress.total > 1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selItems.length > 1 ? `Download ZIP (${selItems.length})` : `Download PNG (${selItems.length || 0})`}
        </button>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['student', 'Students', <Users size={14} />], ['teacher', 'Teachers', <GraduationCap size={14} />]].map(([t, lbl, icon]) => (
          <button key={t} onClick={() => switchTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {icon}{lbl}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 rounded-xl px-3 h-10 border border-gray-100">
          <Search size={14} className="text-gray-400 shrink-0" />
          <input className="bg-transparent text-sm font-medium outline-none w-full placeholder:text-gray-400"
            placeholder={tab === 'student' ? 'Search name or UID...' : 'Search name or code...'}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {tab === 'student' && (
          <select className="h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-xs font-bold outline-none"
            value={classFilter} onChange={e => { setClassFilter(e.target.value); setPage(1); }}>
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
                  style={{ background: c, width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    border: studentColor === c ? '2.5px solid #111' : '2.5px solid transparent',
                    outline: studentColor === c ? '2px solid #fff' : 'none', outlineOffset: '-4px',
                    boxShadow: studentColor === c ? `0 0 0 3px ${c}55` : 'none' }} />
              ))}
              <input type="color" value={studentColor} onChange={e => setStudentColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200" style={{ padding: 2 }} />
            </div>
          </div>
        )}
        <button onClick={toggleAll}
          className="h-10 px-4 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors">
          {selected.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item => (
            <div key={item._id} onClick={() => toggle(item._id)} style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: -4, borderRadius: 10,
                border: selected.has(item._id) ? '3px solid #1565c0' : '3px solid transparent',
                transition: 'border-color 0.15s', pointerEvents: 'none', zIndex: 10 }} />
              {selected.has(item._id) && (
                <div style={{ position: 'absolute', top: -7, right: -7, width: 20, height: 20,
                  borderRadius: '50%', background: '#1565c0', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900, zIndex: 20, boxShadow: '0 2px 8px rgba(21,101,192,0.45)' }}>✔</div>
              )}
              {tab === 'student'
                ? <StudentCard student={item} settings={settings} color={studentColor} />
                : <TeacherCard teacher={item} settings={settings} />}
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronLeft size={18} /></button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Page {page} / {pagination.totalPages}</span>
          <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;
