import JSZip from 'jszip';

// Exact 57 × 87 mm @ 300 DPI
const MM = 300 / 25.4;
const CW = Math.round(57 * MM);   // 673px
const CH = Math.round(87 * MM);   // 1028px
const p  = (mm) => Math.round(mm * MM);

const loadImg = (src) => new Promise((res) => {
  if (!src) return res(null);
  const i = new Image(); i.crossOrigin = 'anonymous';
  i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

const ell = (ctx, txt, maxW) => {
  if (!txt) return '—';
  let t = String(txt);
  while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1);
  return t.length < String(txt).length ? t.slice(0, -1) + '…' : t;
};

const wrapText = (ctx, txt, maxW) => {
  if (!txt) return ['—'];
  const words = String(txt).replace(/,(\S)/g, ', $1').replace(/\s+/g, ' ').trim().split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['—'];
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const cropDraw = (ctx, img, x, y, w, h) => {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const ia = img.width / img.height, ba = w / h;
  let sx, sy, sw, sh;
  if (ia > ba) { sh = img.height; sw = sh * ba; sx = (img.width - sw) / 2; sy = 0; }
  else         { sw = img.width;  sh = sw / ba; sx = 0; sy = 0; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
};

// ══════════════════════════════════════════════════════════════════════════
// LAYOUT (mm) — total = 87mm
//  ribbon  =  7   plain white
//  header  = 22   blue gradient
//  photo   = 29   white, centered large photo
//  info    = 20   table rows
//  sigfoot =  9   class + sign (white)
// ══════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, cardLabel, personName, idLine, rows, classVal } = opts;

  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  const RH  = p(7);
  const HH  = p(22);
  const PZH = p(29);
  const IH  = p(20);
  const SFH = p(9);
  // bottom strip
  const BSH = CH - RH - HH - PZH - IH - SFH; // remaining ≈ p(0)
  // recalc to fill exactly
  const HY  = RH;
  const PZY = HY + HH;
  const IY  = PZY + PZH;
  const SFY = IY + IH;
  const FTY = SFY + SFH;
  // bottom strip if any
  const BSPH = CH - FTY;

  // ── White base ────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // ── 1. RIBBON — plain white (7mm) ─────────────────────────────────────
  // nothing — white base

  // ── 2. HEADER (blue gradient) ─────────────────────────────────────────
  const hg = ctx.createLinearGradient(0, HY, 0, HY + HH);
  hg.addColorStop(0, '#1565c0');
  hg.addColorStop(1, '#1976d2');
  ctx.fillStyle = hg;
  ctx.fillRect(0, HY, CW, HH);

  // logo circle — white ring
  const LSZ = p(14), LX = p(3), LY = HY + (HH - LSZ) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(LX + LSZ/2, LY + LSZ/2, LSZ/2 + p(0.8), 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(LX + LSZ/2, LY + LSZ/2, LSZ/2, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, LX, LY, LSZ, LSZ);
  ctx.restore();

  // school text
  const TX = LX + LSZ + p(3), TW = CW - TX - p(2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';

  // school name — bold white, auto-shrink
  let nfs = p(5);
  ctx.font = `900 ${nfs}px Arial`;
  while (ctx.measureText(settings.schoolName || 'D V Convent School').width > TW && nfs > p(3)) {
    nfs--; ctx.font = `900 ${nfs}px Arial`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(settings.schoolName || 'D V Convent School', TX, HY + p(2));

  // (Govt. Recognised)
  ctx.font = `400 ${p(2.6)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText('(Govt. Recognised)', TX, HY + p(2) + nfs + p(1));

  // address
  ctx.font = `400 ${p(2.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.82)';
  const addrY = HY + p(2) + nfs + p(5.5);
  ctx.fillText(ell(ctx, settings.schoolAddress || 'Vill-Akodha,Post-Rohi,Dist-Bhadohi,221308', TW), TX, addrY);

  // phone — bold
  ctx.font = `800 ${p(2.8)}px Arial`; ctx.fillStyle = '#ffffff';
  ctx.fillText(`Phone No.: ${settings.contactNumber || '—'}`, TX, addrY + p(4.5));

  // ── 3. PHOTO ZONE (white) ─────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, PZY, CW, PZH);

  // large photo — centered, blue border
  const PW2 = p(30), PHGT = p(36);   // bigger photo
  const PX = (CW - PW2) / 2, PY = PZY + (PZH - PHGT) / 2;

  // blue border
  ctx.strokeStyle = color;
  ctx.lineWidth = p(0.8);
  ctx.strokeRect(PX - p(0.8), PY - p(0.8), PW2 + p(1.6), PHGT + p(1.6));

  if (photoImg) {
    cropDraw(ctx, photoImg, PX, PY, PW2, PHGT);
  } else {
    ctx.fillStyle = '#dbeafe';
    ctx.fillRect(PX, PY, PW2, PHGT);
    ctx.font = `900 ${p(14)}px Arial`; ctx.fillStyle = color + '66';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((personName || '?').charAt(0).toUpperCase(), PX + PW2/2, PY + PHGT/2);
  }

  // ── 4. NAME + UID ─────────────────────────────────────────────────────
  // name — centered below photo zone, actually put in info area top
  const NAY = IY - p(10);  // above info table

  // name
  let fnfs = p(5);
  ctx.font = `700 ${fnfs}px Arial`; ctx.fillStyle = '#1a1a1a';
  while (ctx.measureText(personName || '').width > CW - p(10) && fnfs > p(3)) {
    fnfs--; ctx.font = `700 ${fnfs}px Arial`;
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(personName || '', CW / 2, NAY);

  // UID pill
  const UIDT = idLine;
  ctx.font = `800 ${p(3)}px Arial`;
  const UW = ctx.measureText(UIDT).width + p(8), UH = p(5.5);
  const UX = (CW - UW) / 2, UY = NAY + fnfs + p(1.5);
  ctx.beginPath();
  ctx.roundRect(UX, UY, UW, UH, UH/2);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(UIDT, CW/2, UY + UH/2);

  // ── 5. INFO TABLE ─────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, IY, CW, IH);

  // top border line
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = p(0.3);
  ctx.beginPath(); ctx.moveTo(0, IY); ctx.lineTo(CW, IY); ctx.stroke();

  const LXI = p(4), VXI = p(24), VW = CW - VXI - p(3);
  const totalRows = rows.length;
  const rowH = IH / totalRows;

  const tc = document.createElement('canvas'); tc.width = CW; tc.height = 10;
  const mc = tc.getContext('2d'); mc.font = `400 ${p(2.6)}px Arial`;

  let ry = IY;
  rows.forEach(([lbl, val], i) => {
    const lines = wrapText(mc, val, VW);
    const rh = lines.length > 1 ? Math.max(rowH, lines.length * p(3.5) + p(2)) : rowH;

    if (i % 2 === 0) {
      ctx.fillStyle = '#f5f8ff';
      ctx.fillRect(0, ry, CW, rh);
    }

    // label — bold blue
    ctx.font = `700 ${p(2.6)}px Arial`; ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, LXI, ry + rh / 2);

    // value
    ctx.font = `400 ${p(2.6)}px Arial`; ctx.fillStyle = '#1a1a1a';
    ctx.textBaseline = 'top';
    lines.forEach((ln, li) => ctx.fillText(ln, VXI, ry + p(1.5) + li * p(3.5)));

    // row divider
    ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = p(0.3);
    ctx.beginPath(); ctx.moveTo(0, ry + rh); ctx.lineTo(CW, ry + rh); ctx.stroke();

    ry += rh;
  });

  // ── 6. SIGN FOOTER (white) ────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, SFY, CW, SFH);

  // Class — bold left
  ctx.font = `900 ${p(3.5)}px Arial`; ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`Class : ${classVal || '—'}`, p(4), SFY + SFH / 2);

  // sign image + label — right
  if (signImg) {
    const sh = Math.min(p(6), SFH - p(2));
    const sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - p(4), sy = SFY + (SFH - sh) / 2 - p(1);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = '#333'; ctx.lineWidth = p(0.4);
    ctx.beginPath(); ctx.moveTo(sx, sy+sh+p(0.8)); ctx.lineTo(sx+sw, sy+sh+p(0.8)); ctx.stroke();
    ctx.font = `400 ${p(2.3)}px Arial`; ctx.fillStyle = '#333';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal Sign.', sx + sw/2, sy + sh + p(1.2));
  } else {
    ctx.font = `400 ${p(2.3)}px Arial`; ctx.fillStyle = '#555';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('Principal Sign.', CW - p(4), SFY + SFH/2);
  }

  // ── 7. BOTTOM STRIP (blue) ────────────────────────────────────────────
  const BTSY = SFY + SFH;
  const BTSH = CH - BTSY;
  if (BTSH > 0) {
    ctx.fillStyle = color;
    ctx.fillRect(0, BTSY, CW, BTSH);
    ctx.font = `500 ${p(2.4)}px Arial`; ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`If found, please return to school  •  Ph: ${settings.contactNumber || '—'}`, CW/2, BTSY + BTSH/2);
  }
};

// Student
const drawStudent = async (canvas, student, settings, assets, color = '#1565c0') => {
  await drawCard(canvas, settings, assets, {
    color,
    cardLabel: 'STUDENT ID CARD',
    personName: student.name || '',
    idLine: `UID: ${student.UID || '—'}`,
    classVal: student.class || '—',
    rows: [
      ["Father's Name", student.fatherName || '—'],
      ["Mother's Name", student.motherName || '—'],
      ['D.O.B.',        fmtDate(student.dateOfBirth)],
      ['Contact No.',   student.fatherMobile || student.motherMobile || student.guardianMobile || '—'],
      ['Add.',          student.address || '—'],
    ],
  });
};

// Teacher
const drawTeacher = async (canvas, teacher, settings, assets) => {
  await drawCard(canvas, settings, assets, {
    color: '#1565c0',
    cardLabel: 'STAFF ID CARD',
    personName: teacher.name || '',
    idLine: `ID: ${teacher.employeeCode || '—'}`,
    classVal: teacher.designation || 'Teacher',
    rows: [
      ['Designation',  teacher.designation || 'Teacher'],
      ['Phone',        teacher.phone || '—'],
      ['Address',      teacher.address || '—'],
    ],
  });
};

const resolvePhotoUrl = (pp) => {
  if (!pp) return null;
  if (pp.startsWith('data:') || pp.startsWith('http')) return pp;
  return `${import.meta.env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${pp}`;
};

const toBlob = (item, type, settings, shared, sc) => new Promise(async (res, rej) => {
  const photoImg = await loadImg(resolvePhotoUrl(item.profileImage));
  const canvas = document.createElement('canvas');
  if (type === 'student') await drawStudent(canvas, item, settings, { ...shared, photoImg }, sc);
  else                     await drawTeacher(canvas, item, settings, { ...shared, photoImg });
  canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png', 1.0);
});

const triggerDl = (blob, name) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const downloadCards = async (items, type, settings, logoSrc, signSrc, onProgress, sc = '#1565c0') => {
  if (!items?.length) throw new Error('No items');
  const label = type === 'student' ? 'student' : 'teacher';
  const shared = {
    logoImg: await loadImg(settings.schoolLogo || logoSrc),
    signImg: await loadImg(signSrc),
  };
  if (items.length === 1) {
    onProgress?.(0, 1);
    triggerDl(await toBlob(items[0], type, settings, shared, sc), `${label}-id-card.png`);
    onProgress?.(1, 1); return;
  }
  const zip = new JSZip(), folder = zip.folder(`${label}-id-cards`);
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i, items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`, await toBlob(items[i], type, settings, shared, sc));
  }
  onProgress?.(items.length, items.length);
  triggerDl(await zip.generateAsync({ type: 'blob' }), `${label}-id-cards.zip`);
};
