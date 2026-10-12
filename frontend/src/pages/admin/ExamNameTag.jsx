import { useState, useEffect, useRef } from 'react';
import { Download, Tag, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import API from '../../api/axios';
import { useSettings } from '../../context/SettingsContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';

// ── A4 dimensions in mm ──────────────────────────────────────
const A4_W = 210;
const A4_H = 297;

// ── Tag dimensions & layout ──────────────────────────────────
const COLS        = 2;
const ROWS        = 8;
const TAGS_PER_PAGE = COLS * ROWS;   // 16

const MARGIN_X    = 8;   // mm left/right page margin
const MARGIN_Y    = 8;   // mm top/bottom page margin
const GAP_X       = 4;   // mm horizontal gap between columns
const GAP_Y       = 3;   // mm vertical gap between rows

const TAG_W = (A4_W - 2 * MARGIN_X - (COLS - 1) * GAP_X) / COLS;  // ~95mm
const TAG_H = (A4_H - 2 * MARGIN_Y - (ROWS - 1) * GAP_Y) / ROWS;  // ~34.6mm

const CLASSES = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'];

// ── Draw one tag onto jsPDF doc ───────────────────────────────
const drawTag = (doc, x, y, student, schoolName, acYear) => {
  const W = TAG_W;
  const H = TAG_H;

  // Outer border (solid rounded-ish rect)
  doc.setDrawColor(30, 80, 160);
  doc.setLineWidth(0.5);
  doc.rect(x, y, W, H);

  // Top color bar
  const BAR = 6.5;
  doc.setFillColor(21, 101, 192);
  doc.rect(x, y, W, BAR, 'F');

  // School name in bar — white, bold, centered
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const schoolDisplay = (schoolName || 'DV Convent School').toUpperCase();
  doc.text(schoolDisplay, x + W / 2, y + BAR - 1.6, { align: 'center' });

  // Academic year — right side of bar, small
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 255);
  doc.text(acYear || '', x + W - 1.5, y + 2.2, { align: 'right' });

  // Body area
  const BX = x + 3;
  const BY = y + BAR + 2.5;
  const BW = W - 6;

  // Student Name — large, bold, dark blue
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 30, 90);
  const nameStr = (student.name || '—').toUpperCase();
  // Truncate if too wide
  let displayName = nameStr;
  while (doc.getTextWidth(displayName) > BW && displayName.length > 3) {
    displayName = displayName.slice(0, -1);
  }
  if (displayName !== nameStr) displayName = displayName.slice(0, -1) + '…';
  doc.text(displayName, BX, BY + 3.5);

  // Thin separator line
  doc.setDrawColor(200, 210, 230);
  doc.setLineWidth(0.25);
  doc.line(BX, BY + 5.2, x + W - 3, BY + 5.2);

  // Row: Father's name
  const R1Y = BY + 8.2;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 100, 140);
  doc.text("Father's Name :", BX, R1Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  const fatherStr = student.fatherName || '—';
  let displayFather = fatherStr;
  const fatherMaxW = BW - doc.getTextWidth("Father's Name :") - 1.5;
  while (doc.getTextWidth(displayFather) > fatherMaxW && displayFather.length > 2) {
    displayFather = displayFather.slice(0, -1);
  }
  if (displayFather !== fatherStr) displayFather = displayFather.slice(0, -1) + '…';
  doc.text(displayFather, BX + doc.getTextWidth("Father's Name :") + 1.5, R1Y);

  // Row: Class | UID
  const R2Y = R1Y + 5.2;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 100, 140);
  doc.text('Class :', BX, R2Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(student.class || '—', BX + doc.getTextWidth('Class :') + 1.5, R2Y);

  // UID — right aligned
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(80, 100, 140);
  const uidLabel = 'UID :';
  const uidVal   = String(student.UID || '—');
  const uidValW  = doc.getTextWidth(uidVal);
  const uidLblW  = doc.getTextWidth(uidLabel);
  const uidX     = x + W - 3 - uidValW;
  doc.text(uidLabel, uidX - uidLblW - 1, R2Y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  doc.text(uidVal, uidX, R2Y);

  // Bottom accent line
  doc.setDrawColor(21, 101, 192);
  doc.setLineWidth(0.4);
  doc.line(x, y + H - 1.2, x + W, y + H - 1.2);
};

// ── Generate & download PDF ───────────────────────────────────
const generatePDF = (students, schoolName, acYear, className) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  for (let i = 0; i < students.length; i++) {
    if (i > 0 && i % TAGS_PER_PAGE === 0) doc.addPage();

    const posOnPage = i % TAGS_PER_PAGE;
    const col = posOnPage % COLS;
    const row = Math.floor(posOnPage / COLS);

    const x = MARGIN_X + col * (TAG_W + GAP_X);
    const y = MARGIN_Y + row * (TAG_H + GAP_Y);

    drawTag(doc, x, y, students[i], schoolName, acYear);
  }

  doc.save(`name-tags-class-${className}.pdf`);
};

// ── Preview: one tag rendered on a scaled canvas ──────────────
const TagPreview = ({ student, schoolName, acYear }) => {
  const canvasRef = useRef(null);
  const SCALE = 3.2; // px per mm for preview

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = TAG_W * SCALE;
    const H = TAG_H * SCALE;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const s = SCALE;

    // Outer border
    ctx.strokeStyle = '#1e50a0';
    ctx.lineWidth = 0.5 * s;
    ctx.strokeRect(0.25 * s, 0.25 * s, (TAG_W - 0.5) * s, (TAG_H - 0.5) * s);

    // Top bar
    const BAR = 6.5 * s;
    ctx.fillStyle = '#1565c0';
    ctx.fillRect(0, 0, W, BAR);

    // School name in bar
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${7.2 * s * 0.35}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText((schoolName || 'DV Convent School').toUpperCase(), W / 2, BAR - 1.4 * s * 0.35);

    // Academic year
    ctx.fillStyle = 'rgba(200,220,255,0.9)';
    ctx.font = `${5.5 * s * 0.35}px Arial`;
    ctx.textAlign = 'right';
    ctx.fillText(acYear || '', W - 1.5 * s * 0.35, 2.5 * s * 0.35);

    const BX = 3 * s;
    const BY = BAR + 2.5 * s;

    // Student name
    ctx.fillStyle = '#0a1e5a';
    ctx.font = `bold ${11 * s * 0.35}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText((student.name || '—').toUpperCase(), BX, BY + 3.5 * s * 0.35);

    // Separator
    ctx.strokeStyle = '#c8d2e6';
    ctx.lineWidth = 0.25 * s;
    ctx.beginPath();
    ctx.moveTo(BX, BY + 5.2 * s * 0.35);
    ctx.lineTo(W - 3 * s, BY + 5.2 * s * 0.35);
    ctx.stroke();

    // Father label
    const R1Y = BY + 8.2 * s * 0.35;
    ctx.fillStyle = '#506494';
    ctx.font = `bold ${6.5 * s * 0.35}px Arial`;
    ctx.fillText("Father's Name :", BX, R1Y);
    const lw1 = ctx.measureText("Father's Name :").width;
    ctx.fillStyle = '#141414';
    ctx.font = `${6.5 * s * 0.35}px Arial`;
    ctx.fillText(student.fatherName || '—', BX + lw1 + 1.5 * s * 0.35, R1Y);

    // Class | UID row
    const R2Y = R1Y + 5.2 * s * 0.35;
    ctx.fillStyle = '#506494';
    ctx.font = `bold ${6.5 * s * 0.35}px Arial`;
    ctx.fillText('Class :', BX, R2Y);
    const lw2 = ctx.measureText('Class :').width;
    ctx.fillStyle = '#141414';
    ctx.font = `${6.5 * s * 0.35}px Arial`;
    ctx.fillText(student.class || '—', BX + lw2 + 1.5 * s * 0.35, R2Y);

    // UID right
    ctx.fillStyle = '#506494';
    ctx.font = `bold ${6.5 * s * 0.35}px Arial`;
    ctx.textAlign = 'right';
    const uidFull = `UID : ${student.UID || '—'}`;
    ctx.fillText(uidFull, W - 3 * s, R2Y);

    // Bottom accent
    ctx.strokeStyle = '#1565c0';
    ctx.lineWidth = 0.4 * s;
    ctx.beginPath();
    ctx.moveTo(0, H - 1.2 * s * 0.35);
    ctx.lineTo(W,  H - 1.2 * s * 0.35);
    ctx.stroke();
  }, [student, schoolName, acYear]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width:  TAG_W * SCALE,
        height: TAG_H * SCALE,
        display: 'block',
        borderRadius: 3,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      }}
    />
  );
};

// ── MAIN PAGE ─────────────────────────────────────────────────
const ExamNameTag = () => {
  const { settings } = useSettings();
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [generating, setGenerating]       = useState(false);
  const [toast, setToast]                 = useState(null);

  // Fetch students whenever class changes
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
      // small delay so toast renders
      await new Promise(r => setTimeout(r, 80));
      generatePDF(
        students,
        settings.schoolName,
        settings.currentAcademicYear,
        selectedClass,
      );
      setToast({ message: `PDF downloaded — ${students.length} tags, ${Math.ceil(students.length / TAGS_PER_PAGE)} pages`, type: 'success' });
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
            A4 • 2 × 8 = 16 tags per page • 95 × 35 mm each • Class-wise PDF
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

      {/* Class selector card */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Class चुनें</p>
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

        {/* Info row */}
        {selectedClass && !loading && students.length > 0 && (
          <div className="mt-4 flex items-center gap-6 text-xs font-semibold text-gray-500">
            <span className="text-blue-700 font-black text-sm">{students.length} Students</span>
            <span>→ {totalPages} page{totalPages > 1 ? 's' : ''} in PDF</span>
            <span>→ {TAGS_PER_PAGE} tags per page</span>
          </div>
        )}
      </div>

      {/* Preview area */}
      {loading ? (
        <div className="py-20 flex justify-center"><LoadingSpinner size="lg" /></div>
      ) : !selectedClass ? (
        <div className="py-20 text-center text-gray-400 text-sm font-medium">
          Upar se class choose karo — preview aur download available ho jayega
        </div>
      ) : students.length === 0 ? (
        <div className="py-20 text-center text-gray-400 text-sm font-medium">
          Class {selectedClass} mein koi active student nahi mila
        </div>
      ) : (
        <>
          {/* Preview label */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Preview</span>
            <span className="text-xs text-gray-400">— pehle 8 tags dikh rahe hain</span>
          </div>

          {/* Tag grid preview — show first 8 (half a page) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, ${TAG_W * 3.2}px)`,
              gap: `${GAP_Y * 3.2}px ${GAP_X * 3.2}px`,
            }}
          >
            {students.slice(0, 8).map(student => (
              <TagPreview
                key={student._id}
                student={student}
                schoolName={settings.schoolName}
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
