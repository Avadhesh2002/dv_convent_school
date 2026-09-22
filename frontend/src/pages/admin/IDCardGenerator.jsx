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
  return `${import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000'}${p}`;
};
const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
  : '—';

// ── PREMIUM CARD PREVIEW ──────────────────────────────────────────────────
const PremiumCard = ({ color, gold='#c9a94a', logoSrc, sName, sAddr, sPhone,
  label, photo, name, idLine, rows }) => {

  const rH  = pp(8),  hH = pp(22), pzH = pp(28), fH = pp(9);
  const hY  = rH, pzY = rH+hH, iY = pzY+pzH, iH = PH-rH-hH-pzH-fH;
  const ftY = PH-fH;
  const pW  = pp(20), pH = pp(24);
  const pX  = (PW-pW)/2, pYY = pzY+pp(2);

  return (
    <div style={{ width:PW, height:PH, position:'relative', fontFamily:'Arial,sans-serif',
      background:'#f8f9ff', borderRadius:5, overflow:'hidden', flexShrink:0,
      boxShadow:'0 8px 32px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.12)' }}>

      {/* ── Ribbon ── */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:rH,
        background:`linear-gradient(180deg,${color}22 0%,#fff 100%)`,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:pp(5.4), height:pp(5.4), borderRadius:'50%',
          background:`radial-gradient(circle at 38% 38%, #f5e8b0, ${gold}, #7a5818)`,
          boxShadow:'0 1px 5px rgba(0,0,0,0.35)',
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:pp(3.8), height:pp(3.8), borderRadius:'50%',
            background:'#c8cede', boxShadow:'inset 0 1px 4px rgba(0,0,0,0.35)' }} />
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ position:'absolute', top:hY, left:0, right:0, height:hH,
        background:`linear-gradient(110deg,${color} 0%,${color}cc 100%)`,
        overflow:'hidden' }}>
        {/* diagonal lines */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.18 }}>
          {Array.from({length:14},(_,i)=>(
            <line key={i} x1={i*13-15} y1="0" x2={i*13+20} y2="100%"
              stroke={gold} strokeWidth="0.7"/>
          ))}
          <line x1="0" y1="35%" x2="100%" y2="35%" stroke={gold} strokeWidth="0.5" opacity="0.5"/>
          <line x1="0" y1="72%" x2="100%" y2="72%" stroke={gold} strokeWidth="0.5" opacity="0.5"/>
        </svg>
        {/* gold border lines */}
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1.2,
          background:`linear-gradient(90deg,transparent,${gold},transparent)` }}/>
        <div style={{ position:'absolute', bottom:0, left:'8%', right:'8%', height:1.2,
          background:`linear-gradient(90deg,transparent,${gold},transparent)` }}/>

        {/* Logo */}
        <div style={{ position:'absolute', left:pp(3), top:'50%', transform:'translateY(-50%)',
          width:pp(11), height:pp(11), borderRadius:'50%',
          background:`linear-gradient(135deg,#f5e8a0,${gold},#7a5818)`,
          padding:1.2, boxShadow:`0 0 ${pp(2.5)} ${gold}99` }}>
          <div style={{ width:'100%', height:'100%', borderRadius:'50%', overflow:'hidden', background:'#fff' }}>
            <img src={logoSrc} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
        </div>

        {/* School info */}
        <div style={{ position:'absolute', left:pp(16.5), right:pp(2), top:pp(2) }}>
          {/* name — two lines if needed */}
          <div style={{ color:'#fff', fontWeight:900, fontSize:pp(3.6), lineHeight:1.25,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {sName}
          </div>
          {/* gold divider */}
          <div style={{ height:1, background:`linear-gradient(90deg,${gold},transparent)`,
            margin:`${pp(1)}px 0`, width:'80%' }}/>
          <div style={{ color:'rgba(255,255,255,0.72)', fontSize:pp(2.3),
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sAddr}</div>
          <div style={{ color:gold+'ee', fontWeight:700, fontSize:pp(2.4), marginTop:pp(0.8) }}>
            Ph: {sPhone}
          </div>
          {/* badge */}
          <div style={{ display:'inline-block', marginTop:pp(1.2),
            background:`linear-gradient(90deg,${gold},#f0d060)`,
            color:color, fontWeight:900, fontSize:pp(2.1),
            padding:`${pp(0.7)}px ${pp(2)}px`, borderRadius:pp(1.8) }}>
            {label}
          </div>
        </div>
      </div>

      {/* ── Photo Zone ── */}
      <div style={{ position:'absolute', top:pzY, left:0, right:0, height:pzH,
        background:'linear-gradient(180deg,#eef0f8 0%,#fff 100%)' }}>

        {/* photo frame + photo */}
        <div style={{ position:'absolute', left:pX-pp(1.5), top:pYY-pp(1.5),
          width:pW+pp(3), height:pH+pp(3), borderRadius:pp(1.5),
          background:`linear-gradient(135deg,#f5e8a0 0%,${gold} 30%,#f5e890 55%,${gold} 80%,#7a5818 100%)`,
          boxShadow:`0 ${pp(2)} ${pp(4)} rgba(0,0,0,0.22)` }}/>

        {photo
          ? <img src={photo} alt="" style={{
              position:'absolute', left:pX, top:pYY,
              width:pW, height:pH, objectFit:'cover', objectPosition:'center top',
              borderRadius:pp(0.8) }}/>
          : <div style={{ position:'absolute', left:pX, top:pYY, width:pW, height:pH,
              borderRadius:pp(0.8), background:color+'18', display:'flex',
              alignItems:'center', justifyContent:'center',
              fontSize:pp(11), fontWeight:900, color:color+'66' }}>
              {name?.charAt(0)?.toUpperCase()}
            </div>
        }

        {/* Name */}
        <div style={{ position:'absolute', bottom:pp(6.5), left:pp(3), right:pp(3),
          textAlign:'center', fontWeight:900, color:color, lineHeight:1.2,
          fontSize:name?.length>16 ? pp(3.2) : pp(3.8),
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {name}
        </div>

        {/* UID pill */}
        <div style={{ position:'absolute', bottom:pp(1.5), left:'50%', transform:'translateX(-50%)',
          background:`linear-gradient(90deg,${color},${color}bb)`,
          color:'#fff', fontWeight:800, fontSize:pp(2.6),
          padding:`${pp(1)}px ${pp(4)}px`, borderRadius:pp(3),
          border:`0.8px solid ${gold}66`, whiteSpace:'nowrap',
          boxShadow:`0 ${pp(1)} ${pp(2.5)} ${color}44` }}>
          {idLine}
        </div>
      </div>

      {/* ── Info rows ── */}
      <div style={{ position:'absolute', top:iY, left:0, right:0, height:iH, background:'#fff', overflow:'hidden' }}>
        <div style={{ height:1.2, background:`linear-gradient(90deg,transparent 5%,${gold} 15%,${gold} 85%,transparent 95%)` }}/>
        {rows.map(([lbl,val],i)=>(
          <div key={lbl} style={{ display:'flex', alignItems:'center',
            padding:`${pp(0.6)}px ${pp(3.5)}px`,
            background:i%2===0?color+'07':'transparent',
            borderBottom:'0.5px solid #e5e7eb' }}>
            <div style={{ width:pp(0.8), height:pp(3.5), background:`linear-gradient(180deg,${color}cc,${color}33)`,
              marginRight:pp(2), borderRadius:1, flexShrink:0 }}/>
            <span style={{ fontSize:pp(2.7), fontWeight:700, color, width:pp(13), flexShrink:0 }}>{lbl}</span>
            <span style={{ fontSize:pp(2.7), color:'#9ca3af', marginRight:pp(1.5) }}>:</span>
            <span style={{ fontSize:pp(2.7), fontWeight:500, color:'#111827', flex:1,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val||'—'}</span>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:fH,
        background:`linear-gradient(90deg,${color}f2,${color})`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:`0 ${pp(3.5)}px`, position:'absolute' }}>
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1.2,
          background:`linear-gradient(90deg,transparent,${gold},transparent)` }}/>
        <span style={{ fontSize:pp(2.4), fontWeight:700, color:'rgba(255,255,255,0.9)' }}>📞 {sPhone}</span>
        <div style={{ textAlign:'center' }}>
          <img src={signImage} alt="" style={{ height:pp(5), objectFit:'contain', display:'block', margin:'0 auto' }}
            onError={e=>{e.target.style.display='none';}}/>
          <div style={{ fontSize:pp(2.2), color:gold+'ee', fontWeight:700 }}>Principal</div>
        </div>
      </div>
    </div>
  );
};

const getLogoSrc = (settings) => settings.schoolLogo
  ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
  : schoolLogo;

const StudentCard = ({ student, settings, color='#1a3a6b' }) => (
  <PremiumCard color={color} logoSrc={getLogoSrc(settings)}
    sName={settings.schoolName||'D V Convent School'}
    sAddr={settings.schoolAddress||'Akodha, Rohi, Bhadohi'}
    sPhone={settings.contactNumber||'—'}
    label="STUDENT ID CARD"
    photo={resolvePhoto(student.profileImage)}
    name={student.name}
    idLine={`UID : ${student.UID||'—'}`}
    rows={[
      ['Name',   student.name||'—'],
      ['F/Name', student.fatherName||'—'],
      ['Class',  `Class ${student.class||'—'}`],
      ['D.O.B',  fmtDate(student.dateOfBirth)],
      ['Address',student.address||'—'],
    ]}
  />
);

const TeacherCard = ({ teacher, settings }) => (
  <PremiumCard color="#7b1d1d" logoSrc={getLogoSrc(settings)}
    sName={settings.schoolName||'D V Convent School'}
    sAddr={settings.schoolAddress||'Akodha, Rohi, Bhadohi'}
    sPhone={settings.contactNumber||'—'}
    label="STAFF ID CARD"
    photo={resolvePhoto(teacher.profileImage)}
    name={teacher.name}
    idLine={`ID : ${teacher.employeeCode||'—'}`}
    rows={[
      ['Name',   teacher.name||'—'],
      ['Desig.', teacher.designation||'Teacher'],
      ['Phone',  teacher.phone||'—'],
      ['Addr.',  teacher.address||'—'],
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
  const [progress, setProgress]         = useState({ current:0, total:0 });
  const [studentColor, setStudentColor] = useState('#1a3a6b');

  const PRESET = ['#1a3a6b','#0f766e','#166534','#4a148c','#9a3412','#9d174d','#374151','#7c3aed'];
  const CLASSES = ['Nursery','LKG','UKG','1','2','3','4','5','6','7','8'];

  useEffect(()=>{const t=setTimeout(load,300);return()=>clearTimeout(t);},[tab,search,classFilter,page]);

  const load = async () => {
    setLoading(true);
    try {
      if(tab==='student'){
        const r=await API.get('/admin/students',{params:{search,studentClass:classFilter,status:'active',page,limit:20}});
        setItems(r.data.students); setPagination(r.data.pagination);
      } else {
        const r=await API.get('/admin/teachers',{params:{search,status:'active',page,limit:20}});
        setItems(r.data.teachers); setPagination(r.data.pagination);
      }
    } catch { setToast({message:'Failed to load',type:'error'}); }
    finally { setLoading(false); }
  };

  const toggle    = (id) => setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll = () => selected.size===items.length ? setSelected(new Set()) : setSelected(new Set(items.map(i=>i._id)));
  const selItems  = items.filter(i=>selected.has(i._id));

  const handleDl = async () => {
    if(!selItems.length){ setToast({message:'Select at least one card',type:'error'}); return; }
    setPrinting(true); setProgress({current:0,total:selItems.length});
    setToast({message:selItems.length===1?'Preparing PNG…':'Preparing ZIP…',type:'success'});
    try {
      await downloadCards(selItems,tab,settings,schoolLogo,signImage,
        (c,t)=>setProgress({current:c,total:t}),
        tab==='student'?studentColor:null);
      setToast({message:selItems.length===1?'PNG downloaded!':'ZIP downloaded!',type:'success'});
    } catch(e){ setToast({message:'Download failed: '+e.message,type:'error'}); }
    finally { setPrinting(false); setProgress({current:0,total:0}); }
  };

  const switchTab = (t) => { setTab(t); setSearch(''); setClassFilter(''); setSelected(new Set()); setPage(1); };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ID Card Generator</h1>
          <p className="text-xs text-gray-500 mt-0.5">57×87mm • 300 DPI • Gold frame • Lanyard hole</p>
        </div>
        <button onClick={handleDl} disabled={printing}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <Download size={16}/>
          {printing
            ? progress.total>1 ? `Processing ${progress.current}/${progress.total}…` : 'Processing…'
            : selItems.length>1 ? `Download ZIP (${selItems.length})` : `Download PNG (${selItems.length||0})`}
        </button>
      </div>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {[['student','Students',<Users size={14}/>],['teacher','Teachers',<GraduationCap size={14}/>]].map(([t,lbl,icon])=>(
          <button key={t} onClick={()=>switchTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?`bg-white ${t==='student'?'text-indigo-700':'text-red-700'} shadow-sm`:'text-gray-500 hover:text-gray-700'}`}>
            {icon}{lbl}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-gray-50 rounded-xl px-3 h-10 border border-gray-100">
          <Search size={14} className="text-gray-400 shrink-0"/>
          <input className="bg-transparent text-sm font-medium outline-none w-full placeholder:text-gray-400"
            placeholder={tab==='student'?'Search name or UID...':'Search name or code...'}
            value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
        {tab==='student'&&(
          <select className="h-10 bg-gray-50 border border-gray-100 rounded-xl px-3 text-xs font-bold outline-none"
            value={classFilter} onChange={e=>{setClassFilter(e.target.value);setPage(1);}}>
            <option value="">All Classes</option>
            {CLASSES.map(c=><option key={c} value={c}>Class {c}</option>)}
          </select>
        )}
        {tab==='student'&&(
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Theme:</span>
            <div className="flex items-center gap-1.5">
              {PRESET.map(c=>(
                <button key={c} onClick={()=>setStudentColor(c)}
                  style={{ background:c, width:22, height:22, borderRadius:'50%', flexShrink:0,
                    border:studentColor===c?'2.5px solid #111':'2.5px solid transparent',
                    outline:studentColor===c?'2px solid #fff':'none', outlineOffset:'-4px',
                    boxShadow:studentColor===c?`0 0 0 3px ${c}55`:'none' }}/>
              ))}
              <input type="color" value={studentColor} onChange={e=>setStudentColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-200" style={{padding:2}} title="Custom"/>
            </div>
          </div>
        )}
        <button onClick={toggleAll}
          className="h-10 px-4 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl hover:bg-indigo-100 border border-indigo-100 transition-colors">
          {selected.size===items.length&&items.length>0?'Deselect All':'Select All'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg"/></div>
      ) : items.length===0 ? (
        <div className="py-20 text-center text-gray-400 font-medium">No records found</div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {items.map(item=>(
            <div key={item._id} onClick={()=>toggle(item._id)} style={{cursor:'pointer',position:'relative',flexShrink:0}}>
              <div style={{ position:'absolute', inset:-4, borderRadius:10,
                border:selected.has(item._id)?'3px solid #4f46e5':'3px solid transparent',
                transition:'border-color 0.15s', pointerEvents:'none', zIndex:10 }}/>
              {selected.has(item._id)&&(
                <div style={{ position:'absolute', top:-7, right:-7, width:20, height:20,
                  borderRadius:'50%', background:'#4f46e5', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:900, zIndex:20, boxShadow:'0 2px 8px rgba(79,70,229,0.45)' }}>✔</div>
              )}
              {tab==='student'
                ? <StudentCard student={item} settings={settings} color={studentColor}/>
                : <TeacherCard teacher={item} settings={settings}/>}
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages>1&&(
        <div className="flex items-center justify-center gap-4 pt-2">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronLeft size={18}/></button>
          <span className="text-xs font-black text-gray-600 uppercase tracking-widest">Page {page} / {pagination.totalPages}</span>
          <button disabled={page===pagination.totalPages} onClick={()=>setPage(p=>p+1)}
            className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"><ChevronRight size={18}/></button>
        </div>
      )}
    </div>
  );
};

export default IDCardGenerator;
