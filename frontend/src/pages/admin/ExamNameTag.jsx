import { useState, useEffect, useRef } from 'react';
import { Download, Tag } from 'lucide-react';
import jsPDF from 'jspdf';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

// ── A4 dimensions in mm ──────────────────────────────────────
const A4_W = 210;
const A4_H = 297;

const COLS          = 2;
const ROWS          = 8;
const TAGS_PER_PAGE = COLS * ROWS; // 16

const MARGIN_X = 7;
const MARGIN_Y = 7;
const GAP_X    = 5;
const GAP_Y    = 2.5;

const TAG_W = (A4_W - 2 * MARGIN_X - (COLS - 1) * GAP_X) / COLS; // ~96mm
const TAG_H = (A4_H - 2 * MARGIN_Y - (ROWS - 1) * GAP_Y) / ROWS; // ~35mm

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'];

// ── Draw one tag onto jsPDF ───────────────────────────────────
const drawTag = (doc, x, y, student, examName, acYear) => {
  const W = TAG_W;
  const H = TAG_H;

  // Shadow / background rect (light blue tint)
  doc.setFillColor(235, 243, 255);
  doc.roundedRect(x, y, W, H, 1.2, 1.2, 'F');

  // Outer border
  doc.setDrawColor(21, 101, 192);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, W, H, 1.2, 1.2, 'S');

  // ── Top bar ──────────────────────────────────────────────
  const BAR = 8;
  doc.setFillColor(21, 101, 192);
  doc.roundedRect(x, y, W, BAR, 1.2, 1.2, 'F');
  // cover bottom corners of bar so it looks flat at bottom
  doc.rect(x, y + BAR / 2, W, BAR / 2, 'F');

  // Exam name — centered, white, bold
  const examLabel = (examName || 'EXAMINATION').toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(examLabel, x + W / 2, y + BAR - 2.2, { align: 'center' });

  // Academic year — top-right corner, small
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(180, 210, 255);
  doc.text(acYear || '', x + W - 2, y + 3, { align: 'right' });

  // ── Body ─────────────────────────────────────────────────
  const pad  = 3.5;
  const BX   = x + pad;
  const BW   = W - pad * 2;
  let   curY = y + BAR + 4;

  // Student Name — large, dark navy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(8, 28, 80);
  let nameStr = (student.name || '—').toUpperCase();
  while (doc.getTextWidth(nameStr) > BW - 1 && nameStr.length > 3)
    nameStr = nameStr.slice(0, -1);
  if (nameStr !== (student.name || '—').toUpperCase())
    nameStr = nameStr.slice(0, -1) + '…';
  doc.text(nameStr, BX, curY);
  curY += 1.8;

  // Separator line — bold blue
  doc.setDrawColor(21, 101, 192);
  doc.setLineWidth(0.5);
  doc.line(BX, curY, x + W - pad, curY);
  curY += 4.2;

  // ── Row helper ───────────────────────────────────────────
  const row = (label, value, rightLabel, rightValue) => {
    const LABEL_SZ = 7;
    const VAL_SZ   = 8;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(LABEL_SZ);
    doc.setTextColor(60, 90, 160);
    doc.text(label, BX, curY);
    const lw = doc.getTextWidth(label);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(VAL_SZ);
    doc.setTextColor(15, 15, 15);
    // truncate value
    let val = value || '—';
    const maxValW = rightLabel
      ? (BW / 2) - lw - 1
      : BW - lw - 1;
    while (doc.getTextWidth(val) > maxValW && val.length > 2)
      val = val.slice(0, -1);
    if (val !== (value || '—')) val = val.slice(0, -1) + '…';
    doc.text(val, BX + lw + 1, curY);

    // right side (Class / UID)
    if (rightLabel && rightValue !== undefined) {
      const midX = x + W / 2 + 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(LABEL_SZ);
      doc.setTextColor(60, 90, 160);
      doc.text(rightLabel, midX, curY);
      const rlw = doc.getTextWidth(rightLabel);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(VAL_SZ);
      doc.setTextColor(8, 28, 80);
      doc.text(String(rightValue || '—'), midX + rlw + 1, curY);
    }

    curY += 5.5;
  };

  row("Father : ", student.fatherName || '—');
  row("Class :  ", student.class      || '—', "UID : ", student.UID || '—');
};

// ── Generate PDF ─────────────────────────────────────────────
const generatePDF = (students, examName, acYear, className) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < students.length; i++) {
    if (i > 0 && i % TAGS_PER_PAGE === 0) doc.addPage();
    const pos = i % TAGS_PER_PAGE;
    const col = pos % COLS;
    const row = Math.floor(pos / COLS);
    const tx  = MARGIN_X + col * (TAG_W + GAP_X);
    const ty  = MARGIN_Y + row * (TAG_H + GAP_Y);
    drawTag(doc, tx, ty, students[i], examName, acYear);
  }

  doc.save(`name-tags-class-${className}.pdf`);
};

// ── Canvas preview — one tag ──────────────────────────────────
const SCALE = 3.4; // px per mm

const TagPreview = ({ student, examName, acYear }) => {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const W = Math.round(TAG_W * SCALE);
    const H = Math.round(TAG_H * SCALE);
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const s   = SCALE;

    // background tint
    ctx.fillStyle = '#ebf3ff';
    roundRect(ctx, 0, 0, W, H, 4, true, false);

    // outer border
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 0.5 * s;
    roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 4, false, true);

    // top bar
    const BAR = 8 * s;
    ctx.fillStyle = '#1565c0';
    roundRect(ctx, 0, 0, W, BAR, 4, true, false);
    ctx.fillRect(0, BAR / 2, W, BAR / 2); // flatten bottom

    // exam name
    ctx.fillStyle = '#fff';
    ctx.font      = `bold ${9.5 * s * 0.352}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText((examName || 'EXAMINATION').toUpperCase(), W / 2, BAR - 2.2 * s * 0.352);

    // ac year
    ctx.fillStyle    = 'rgba(180,210,255,0.9)';
    ctx.font         = `${6 * s * 0.352}px Arial`;
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(acYear || '', W - 2 * s * 0.352, 1 * s * 0.352);

    // body
    const pad  = 3.5 * s;
    const BX   = pad;
    let   curY = BAR + 4 * s;

    // name
    ctx.fillStyle    = '#081c50';
    ctx.font         = `bold ${13.5 * s * 0.352}px Arial`;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText((student.name || '—').toUpperCase(), BX, curY);
    curY += 1.8 * s;

    // separator
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth   = 0.5 * s;
    ctx.beginPath();
    ctx.moveTo(BX, curY); ctx.lineTo(W - pad, curY); ctx.stroke();
    curY += 4.2 * s;

    const lSz = 7 * s * 0.352;
    const vSz = 8 * s * 0.352;

    // father row
    ctx.fillStyle = '#3c5aa0';
    ctx.font      = `bold ${lSz}px Arial`;
    ctx.fillText('Father : ', BX, curY);
    const lw1 = ctx.measureText('Father : ').width;
    ctx.fillStyle = '#0f0f0f';
    ctx.font      = `${vSz}px Arial`;
    ctx.fillText(student.fatherName || '—', BX + lw1, curY);
    curY += 5.5 * s;

    // class + uid row
    ctx.fillStyle = '#3c5aa0';
    ctx.font      = `bold ${lSz}px Arial`;
    ctx.fillText('Class :  ', BX, curY);
    const lw2 = ctx.measureText('Class :  ').width;
    ctx.fillStyle = '#0f0f0f';
    ctx.font      = `${vSz}px Arial`;
    ctx.fillText(student.class || '—', BX + lw2, curY);

    // uid right
    const midX = W / 2 + 2 * s;
    ctx.fillStyle = '#3c5aa0';
    ctx.font      = `bold ${lSz}px Arial`;
    ctx.fillText('UID : ', midX, curY);
    const lw3 = ctx.measureText('UID : ').width;
    ctx.fillStyle = '#081c50';
    ctx.font      = `bold ${vSz}px Arial`;
    ctx.fillText(String(student.UID || '—'), midX + lw3, curY);
  }, [student, examName, acYear]);

  return (
    <canvas
      ref={ref}
      style={{
        width:        Math.round(TAG_W * SCALE),
        height:       Math.round(TAG_H * SCALE),
        display:      'block',
        borderRadius: 4,
        boxShadow:    '0 3px 14px rgba(21,101,192,0.18)',
      }}
    />
  );
};

// small helper — rounded rect for canvas
function roundRect(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill)   ctx.fill();
  if (stroke) ctx.stroke();
}

// ── MAIN PAGE ─────────────────────────────────────────────────
const ExamNameTag = () => {
  const { settings }                      = useSettings();
  const [selectedClass, setSelectedClass] = useState('');
  const [examName, setExamName]           = useState('');
  const [students, setStudents]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [toast, setToast]                 = useState(null);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); return; }
    const t = setTimeout(fetchStudents, 250);
    return () => clearTimeout(t);
  }, [selectedClass]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const r = await API.get('/admin/students', {
        params: { studentClass: selectedClass, status: 'active', limit: 9999 },
      });
      setStudents(r.data.students || []);
    } catch {
      setToast({ message: 'Students load nahi hue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!students.length) {
      setToast({ message: 'Pehle class select karo', type: 'error' }); return;
    }
    setGenerating(true);
    setToast({ message: `${students.length} name tags ka PDF ban raha hai…`, type: 'success' });
    try {
      await new Promise(r => setTimeout(r, 80));
      generatePDF(students, examName, settings.currentAcademicYear, selectedClass);
      const pages = Math.ceil(students.length / TAGS_PER_PAGE);
      setToast({ message: `PDF ready — ${students.length} tags, ${pages} page${pages > 1 ? 's' : ''}`, type: 'success' });
    } catch (e) {
      setToast({ message: 'PDF error: ' + e.message, type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const totalPages = Math.ceil(students.length / TAGS_PER_PAGE);

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Tag size={22} className="text-blue-600" /> Exam Name Tags
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            A4 • 2 × 8 = 16 tags/page • ~96 × 35 mm • Class-wise PDF
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={generating || loading || !students.length}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Download size={16} />
          {generating
            ? 'PDF बन रहा है…'
            : students.length
              ? `Download PDF (${students.length} tags, ${totalPages} page${totalPages > 1 ? 's' : ''})`
              : 'Download PDF'}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">

        {/* Exam name input */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">
            Exam का नाम
          </label>
          <input
            type="text"
            value={examName}
            onChange={e => setExamName(e.target.value)}
            placeholder="जैसे: Half Yearly Exam 2026-27"
            className="w-full max-w-md h-10 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-400 focus:bg-white transition-colors"
          />
        </div>

        {/* Class selector */}
        <div>
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">
            Class चुनें
          </label>
          <div className="flex flex-wrap gap-2">
            {CLASSES.map(c => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  selectedClass === c
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {c === 'Nursery' || c === 'LKG' || c === 'UKG' ? c : `Class ${c}`}
              </button>
            ))}
          </div>
        </div>

        {/* Info row */}
        {selectedClass && !loading && students.length > 0 && (
          <div className="flex items-center gap-6 text-xs font-semibold text-gray-500 pt-1 border-t border-gray-50">
            <span className="text-blue-700 font-black text-sm">{students.length} Students</span>
            <span>→ {totalPages} page{totalPages > 1 ? 's' : ''} in PDF</span>
            <span>→ {TAGS_PER_PAGE} tags per page</span>
          </div>
        )}
      </div>

      {/* Preview */}
      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : !selectedClass ? (
        <div className="py-20 text-center text-gray-400 text-sm font-medium">
          Upar class choose karo — preview yahan aayega
        </div>
      ) : students.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm font-medium">
          Class {selectedClass} mein koi active student nahi mila
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Preview</span>
            <span className="text-xs text-gray-400">— pehle {Math.min(8, students.length)} tags</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, ${Math.round(TAG_W * SCALE)}px)`,
              gap: `${GAP_Y * SCALE}px ${GAP_X * SCALE}px`,
            }}
          >
            {students.slice(0, 8).map(student => (
              <TagPreview
                key={student._id}
                student={student}
                examName={examName}
                acYear={settings.currentAcademicYear}
              />
            ))}
          </div>

          {students.length > 8 && (
            <p className="text-xs text-gray-400 text-center pt-1">
              + {students.length - 8} aur tags PDF mein honge
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default ExamNameTag;
