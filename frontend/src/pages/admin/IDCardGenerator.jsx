import { useState, useEffect } from 'react';
import { Search, Download, Users, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import schoolLogo from '../../assets/school_logo.png';
import signImage from '../../assets/sign.png';
import { downloadCards } from '../../utils/idCardDownload';

const CARD_W = 220;
const CARD_H = 360;

// Helper: resolve any profile image URL correctly
// Cloudinary images are full https:// URLs, local uploads start with /uploads/
const resolvePhoto = (profileImage) => {
  if (!profileImage) return null;
  if (profileImage.startsWith('data:')) return profileImage;           // base64
  if (profileImage.startsWith('http')) return profileImage;            // Cloudinary / any full URL
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${apiBase}${profileImage}`;                                  // local /uploads/...
};

// ─── StudentCard ──────────────────────────────────────────────────────────────
const StudentCard = ({ student, settings, color = '#1565c0' }) => {
  const dob     = student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const contact = student.fatherMobile || student.motherMobile || student.guardianMobile || '—';
  const photo   = resolvePhoto(student.profileImage);

  // derive a slightly lighter shade for gradient
  const colorDark  = color;
  const colorLight = color + 'dd';

  const Row = ({ label, value }) => (
    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '3px 0' }}>
      <span style={{ fontSize: 7, color: '#374151', fontWeight: 600, width: 62, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 7, color: '#111827', fontWeight: 500, flex: 1, wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ width: CARD_W, minHeight: CARD_H, fontFamily: 'Arial, sans-serif', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 24px rgba(0,0,0,0.18)', flexShrink: 0, background: '#fff' }}>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(180deg, ${colorDark} 0%, ${colorLight} 100%)`, padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            <img src={settings.schoolLogo || schoolLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', paddingTop: 4 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 12.5, lineHeight: 1.2 }}>
              {settings.schoolName || 'D V Convent School'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 6.5, marginTop: 1 }}>(Govt. Recognised)</div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 6.5, marginTop: 2 }}>
              {settings.schoolAddress || 'Akodha, Rohi, Bhadohi - 221308'}
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 7, marginTop: 2 }}>
              Phone No.: {settings.contactNumber || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Wave divider ── */}
      <div style={{ height: 10, background: `linear-gradient(180deg, ${colorLight} 0%, #fff 100%)`, flexShrink: 0 }} />

      {/* ── Photo centered ── */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: -2, flexShrink: 0 }}>
        <div style={{ width: 86, height: 94, border: `2.5px solid ${colorDark}`, overflow: 'hidden', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {photo
            ? <img src={photo} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 36, fontWeight: 900, color: colorDark }}>{student.name?.charAt(0)}</span>}
        </div>
      </div>

      {/* ── Student Name + UID ── */}
      <div style={{ textAlign: 'center', padding: '5px 12px 3px' }}>
        <div style={{ color: '#111827', fontWeight: 700, fontSize: 13, letterSpacing: '0.2px' }}>{student.name}</div>
        <div style={{ display: 'inline-block', background: colorDark, color: '#fff', fontWeight: 800, fontSize: 7.5, padding: '2px 12px', borderRadius: 20, marginTop: 3, letterSpacing: '0.5px' }}>
          UID: {student.UID || '—'}
        </div>
      </div>

      {/* ── Info table ── */}
      <div style={{ padding: '2px 12px', flex: 1 }}>
        <Row label="Father's Name" value={student.fatherName || '—'} />
        <Row label="Mother's Name" value={student.motherName || '—'} />
        <Row label="D.O.B." value={dob} />
        <Row label="Contact No." value={contact} />
        <Row label="Add." value={student.address || '—'} />
      </div>

      {/* ── Footer: Class + Sign ── */}
      <div style={{ padding: '3px 12px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#111827' }}>
          Class : {student.class || '—'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <img
            src={signImage}
            alt="sign"
            crossOrigin="anonymous"
            style={{ height: 28, width: 60, objectFit: 'contain', display: 'block', margin: '0 auto' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ fontSize: 7, color: '#374151', fontWeight: 600, marginTop: 1 }}>Principal Sign.</div>
        </div>
      </div>

      {/* ── Bottom note ── */}
      <div style={{ background: colorDark, padding: '3px 10px', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 5.5, fontWeight: 500, letterSpacing: '0.3px' }}>
          If found, please return to school  •  Ph: {settings.contactNumber || '—'}
        </span>
      </div>
    </div>
  );
};

// ─── TeacherCard ──────────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, settings }) => {
  const photo = resolvePhoto(teacher.profileImage);

  return (
    <div style={{ width: CARD_W, minHeight: CARD_H, fontFamily: 'Arial, sans-serif', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 24px rgba(0,0,0,0.2)', flexShrink: 0, background: '#fff' }}>

      {/* ── Dark Red Header ── */}
      <div style={{ background: 'linear-gradient(180deg, #8b1a1a 0%, #a52020 100%)', padding: '8px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.8)', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            <img src={settings.schoolLogo || schoolLogo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', paddingTop: 4 }}>
            <div style={{ color: '#fff', fontWeight: 900, fontSize: 12.5, lineHeight: 1.2 }}>
              {settings.schoolName || 'D V Convent School'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 6.5, marginTop: 1 }}>(Govt. Recognised)</div>
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 6.5, marginTop: 2 }}>
              {settings.schoolAddress || 'Akodha, Rohi, Bhadohi - 221308'}
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 7, marginTop: 2 }}>
              Phone No.: {settings.contactNumber || '—'}
            </div>
          </div>
        </div>
      </div>

      {/* ── White body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 12px 6px', background: '#fff' }}>

        {/* Photo */}
        <div style={{ width: 96, height: 106, border: '2.5px solid #8b1a1a', overflow: 'hidden', background: '#f5e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {photo
            ? <img src={photo} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 40, fontWeight: 900, color: '#8b1a1a' }}>{teacher.name?.charAt(0)}</span>}
        </div>

        {/* Name */}
        <div style={{ color: '#111827', fontWeight: 900, fontSize: 13, marginTop: 5, textAlign: 'center', letterSpacing: '0.2px' }}>
          {teacher.name}
        </div>

        {/* Emp ID pill */}
        <div style={{ display: 'inline-block', background: '#8b1a1a', color: '#fff', fontWeight: 800, fontSize: 7.5, padding: '2px 12px', borderRadius: 20, marginTop: 3, letterSpacing: '0.5px' }}>
          ID: {teacher.employeeCode || '—'}
        </div>

        {/* Info rows */}
        <div style={{ width: '100%', marginTop: 6, borderTop: '1px solid #f0e0e0' }}>
          {[
            ['Designation', teacher.designation || 'Teacher'],
            ['Phone', teacher.phone],
            ['Address', teacher.address],
          ].map(([lbl, val]) => (
            <div key={lbl} style={{ display: 'flex', borderBottom: '1px solid #f5e0e0', padding: '4px 0' }}>
              <span style={{ fontSize: 7, color: '#8b1a1a', fontWeight: 700, width: 58, flexShrink: 0 }}>{lbl}:</span>
              <span style={{ fontSize: 7, color: '#111827', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</span>
            </div>
          ))}
        </div>

        {/* Principal Sign */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #f0e0e0' }}>
          <div style={{ textAlign: 'center' }}>
            <img
              src={signImage}
              alt="sign"
              crossOrigin="anonymous"
              style={{ height: 28, width: 60, objectFit: 'contain', display: 'block', margin: '0 auto' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
            <div style={{ fontSize: 7, color: '#374151', fontWeight: 600, marginTop: 1 }}>Principal Sign.</div>
          </div>
        </div>
      </div>

      {/* ── Red bottom strip ── */}
      <div style={{ background: '#8b1a1a', padding: '3px 10px', textAlign: 'center', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontWeight: 900, fontSize: 11, letterSpacing: '1.5px', textTransform: 'uppercase' }}>Staff ID Card</span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
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
  const [studentColor, setStudentColor] = useState('#1565c0');

  const PRESET_COLORS = ['#1565c0','#1b5e20','#4a148c','#e65100','#880e4f','#006064','#37474f','#b71c1c'];

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

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll    = () => selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i => i._id)));
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
      setPrinting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleTabChange = (t) => { setTab(t); setSearch(''); setClassFilter(''); setSelected(new Set()); setPage(1); };
  const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'];

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">CR-80 standard • 54mm × 85.6mm</p>
        </div>
        <button onClick={handleDownload} disabled={printing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
          <Download size={16} />
          {printing
            ? progress.total > 1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selectedItems.length > 1 ? `Download ZIP (${selectedItems.length})` : `Download PNG (${selectedItems.length})`}
        </button>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['student', 'Students', <Users size={14} />], ['teacher', 'Teachers', <GraduationCap size={14} />]].map(([t, label, icon]) => (
          <button key={t} onClick={() => handleTabChange(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? `bg-white ${t === 'student' ? 'text-indigo-700' : 'text-red-700'} shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}>
            {icon} {label}
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
            <div className="flex items-center gap-1">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setStudentColor(c)}
                  style={{ background: c, width: 20, height: 20, borderRadius: '50%', border: studentColor === c ? '2px solid #111' : '2px solid transparent', flexShrink: 0, outline: studentColor === c ? '2px solid #fff' : 'none', outlineOffset: '-3px' }} />
              ))}
              <input type="color" value={studentColor} onChange={e => setStudentColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0"
                title="Custom color" style={{ padding: 0 }} />
            </div>
          </div>
        )}
        <button onClick={toggleAll}
          className="h-10 px-4 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100">
          {selected.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-medium">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item => (
            <div key={item._id} onClick={() => toggleSelect(item._id)} style={{ cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: -3, borderRadius: 17, border: selected.has(item._id) ? '3px solid #4f46e5' : '3px solid transparent', transition: 'border-color 0.15s', pointerEvents: 'none', zIndex: 10 }} />
              {selected.has(item._id) && (
                <div style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#4f46e5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, zIndex: 20, boxShadow: '0 2px 6px rgba(79,70,229,0.4)' }}>✔</div>
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
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronLeft size={18} /></button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Page {page} / {pagination.totalPages}</span>
          <button disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)} className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronRight size={18} /></button>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;