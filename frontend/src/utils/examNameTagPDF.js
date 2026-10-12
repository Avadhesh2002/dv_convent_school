import { jsPDF } from 'jspdf';

// ── A4 dimensions (mm) ────────────────────────────────────────
const PAGE_W = 210;
const PAGE_H = 297;

// ── Tag dimensions ────────────────────────────────────────────
// 2 columns × 8 rows = 16 per page
const COLS      = 2;
const ROWS      = 8;
const H_PAD     = 8;   // left/right page margin
const V_PAD     = 6;   // top/bottom page margin
const COL_GAP   = 4;   // gap between columns
const ROW_GAP   = 2;   // gap between rows

const TAG_W = (PAGE_W - H_PAD * 2 - COL_GAP) / COLS;         // ~95mm
const TAG_H = (PAGE_H - V_PAD * 2 - ROW_GAP * (ROWS - 1)) / ROWS;  // ~34mm

// ── Color scheme ─────────────────────────────────────────────
const BLUE      = [21,  101, 192];   // #1565c0
const BLUE_LIGHT= [219, 234, 254];   // #dbeafe
const WHITE     = [255, 255, 255];
const DARK      = [17,  17,  17];
const GRAY      = [100, 116, 139];

// ── Draw one tag ─────────────────────────────────────────────
const drawTag = (doc, x, y, student, schoolName, serialNo) => {
  const W = TAG_W;
  const H = TAG_H;

  // ── Outer border ──
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, W, H, 2, 2, 'S');

  // ── Left accent strip (4mm wide) ──
  doc.setFillColor(...BLUE);
  doc.roundedRect(x, y, 4, H, 2, 2, 'F');
  // cover right side of rounded strip to make left edge square on right
  doc.setFillColor(...BLUE);
  doc.rect(x + 2, y, 2, H, 'F');

  // ── School name inside left strip (rotated) ──
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.saveGraphicsState();
  doc.text(
    schoolName || 'D V Convent School',
    x + 2,
    y + H - 1,
    { angle: 90, maxWidth: H - 2 }
  );
  doc.restoreGraphicsState();

  // ── Serial number badge (top-right corner) ──
  const badgeR = 3.5;
  const badgeX = x + W - badgeR - 1.5;
  const badgeY = y + badgeR + 1.5;
  doc.setFillColor(...BLUE_LIGHT);
  doc.circle(badgeX, badgeY, badgeR, 'F');
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text(String(serialNo).padStart(2, '0'), badgeX, badgeY + 0.5, { align: 'center' });

  // ── Content area (starts after left strip) ──
  const CX = x + 5.5;   // content left
  const CW = W - 5.5 - 1.5;  // content width

  // ── Student Name ──
  let curY = y + 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  const nameFit = doc.splitTextToSize(student.name || '—', CW - 5);
  doc.text(nameFit[0], CX, curY);
  curY += 5;

  // ── UID pill ──
  const uidText = `UID: ${student.UID || '—'}`;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  const uidW = doc.getTextWidth(uidText) + 4;
  doc.setFillColor(...BLUE);
  doc.roundedRect(CX, curY - 2.8, uidW, 4, 1, 1, 'F');
  doc.setTextColor(...WHITE);
  doc.text(uidText, CX + 2, curY, { baseline: 'middle' });
  curY += 4;

  // ── Divider ──
  doc.setDrawColor(...BLUE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(CX, curY, x + W - 2, curY);
  curY += 3;

  // ── Class row ──
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Class:', CX, curY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(student.class || '—', CX + 11, curY);
  curY += 4.5;

  // ── Father's name row ──
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('Father:', CX, curY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  const fatherFit = doc.splitTextToSize(student.fatherName || '—', CW - 13);
  doc.text(fatherFit[0], CX + 13, curY);

  // ── Bottom "EXAM" label ──
  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text('EXAM NAME TAG', x + W / 2 + 1, y + H - 1.5, { align: 'center' });
};

// ── Cut guide lines (dashed) ─────────────────────────────────
const drawCutLines = (doc) => {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1.5], 0);

  // vertical cut line between columns
  const midX = H_PAD + TAG_W + COL_GAP / 2;
  doc.line(midX, 2, midX, PAGE_H - 2);

  // horizontal cut lines between rows
  for (let r = 1; r < ROWS; r++) {
    const midY = V_PAD + r * TAG_H + (r - 0.5) * ROW_GAP;
    doc.line(2, midY, PAGE_W - 2, midY);
  }

  doc.setLineDashPattern([], 0); // reset dash
};

// ── Main export ───────────────────────────────────────────────
export const generateExamNameTagPDF = (students, settings, className) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const schoolName = settings?.schoolName || 'D V Convent School';

  const total = students.length;
  let idx = 0;

  while (idx < total) {
    if (idx > 0) doc.addPage();

    drawCutLines(doc);

    for (let r = 0; r < ROWS && idx < total; r++) {
      for (let c = 0; c < COLS && idx < total; c++) {
        const x = H_PAD + c * (TAG_W + COL_GAP);
        const y = V_PAD + r * (TAG_H + ROW_GAP);
        drawTag(doc, x, y, students[idx], schoolName, idx + 1);
        idx++;
      }
    }
  }

  const fileName = className
    ? `exam-name-tags-class-${className}.pdf`
    : 'exam-name-tags.pdf';

  doc.save(fileName);
};
