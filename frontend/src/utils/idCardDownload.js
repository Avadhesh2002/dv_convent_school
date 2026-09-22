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
// LAYOUT — total = 87mm exactly
//  ribbon   =  6mm  white space
//  header   = 20mm  blue
//  photo    = 20mm  white, smaller photo
//  name+uid =  9mm  name + uid pill
//  info     = 23mm  5 rows
//  sigfoot  =  9mm  class + sign
//  TOTAL    = 87mm ✓
// ══════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, personName, idLine, rows, classVal } = opts;

  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // section heights
  const RH  = p(6);
  const HH  = p(20);
  const PZH = p(20);
  const NUH = p(9);
  const IH  = p(23);
  const SFH = p(9);

  const HY  = RH;
  const PZY = HY + HH;
  const NUY = PZY + PZH;
  const IY  = NUY + NUH;
  const SFY = IY + IH;
  // bottom strip = remaining
  const BTSY = SFY + SFH;
  const BTSH = CH - BTSY;

  // white base
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH);

  // ── 1. RIBBON (plain white) ───────────────────────────────────────────

  // ── 2. HEADER ─────────────────────────────────────────────────────────
  const hg = ctx.createLinearGradient(0, HY, 0, HY + HH);
  hg.addColorStop(0, '#1565c0'); hg.addColorStop(1, '#1976d2');
  ctx.fillStyle = hg; ctx.fillRect(0, HY, CW, HH);

  // logo
  const LSZ = p(13), LX = p(3), LY = HY + (HH - LSZ) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(LX + LSZ/2, LY + LSZ/2, LSZ/2, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, LX, LY, LSZ, LSZ);
  ctx.restore();

  // text
  const TX = LX + LSZ + p(2.5), TW = CW - TX - p(2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';

  let nfs = p(4.2);
  ctx.font = `900 ${nfs}px Arial`;
  while (ctx.measureText(settings.schoolName || 'D V Convent School').width > TW && nfs > p(2.8)) {
    nfs--; ctx.font = `900 ${nfs}px Arial`;
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillText(settings.schoolName || 'D V Convent School', TX, HY + p(1.5));

  ctx.font = `400 ${p(2.3)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText('(Govt. Recognised)', TX, HY + p(1.5) + nfs + p(0.8));

  ctx.font = `400 ${p(2.2)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(ell(ctx, settings.schoolAddress || 'Vill-Akodha,Post-Rohi,Dist-Bhadohi,221308', TW), TX, HY + p(1.5) + nfs + p(4.5));

  ctx.font = `700 ${p(2.6)}px Arial`; ctx.fillStyle = '#ffffff';
  ctx.fillText(`Phone No.: ${settings.contactNumber || '—'}`, TX, HY + p(1.5) + nfs + p(8));

  // ── 3. PHOTO ZONE ─────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, PZY, CW, PZH);

  // smaller photo — 3:4, fits in 20mm zone
  const PW2 = p(22), PHGT = p(27);
  const PX = (CW - PW2) / 2;
  const PY = PZY + (PZH - PHGT) / 2;

  // blue border
  ctx.strokeStyle = color; ctx.lineWidth = p(0.7);
  ctx.strokeRect(PX - p(0.7), PY - p(0.7), PW2 + p(1.4), PHGT + p(1.4));

  if (photoImg) {
    cropDraw(ctx, photoImg, PX, PY, PW2, PHGT);
  } else {
    ctx.fillStyle = '#dbeafe'; ctx.fillRect(PX, PY, PW2, PHGT);
    ctx.font = `900 ${p(10)}px Arial`; ctx.fillStyle = color + '66';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((personName || '?').charAt(0).toUpperCase(), PX + PW2/2, PY + PHGT/2);
  }

  // ── 4. NAME + UID ─────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, NUY, CW, NUH);

  let fnfs = p(3.8);
  ctx.font = `700 ${fnfs}px Arial`;
  while (ctx.measureText(personName || '').width > CW - p(10) && fnfs > p(2.5)) {
    fnfs--; ctx.font = `700 ${fnfs}px Arial`;
  }
  ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(personName || '', CW / 2, NUY + p(0.8));

  const UIDT = idLine;
  ctx.font = `800 ${p(2.6)}px Arial`;
  const UW = ctx.measureText(UIDT).width + p(7), UH = p(4.2);
  const UX = (CW - UW) / 2, UY = NUY + fnfs + p(1.5);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(UX, UY, UW, UH, UH/2);
  else {
    const r = UH/2;
    ctx.moveTo(UX+r,UY); ctx.lineTo(UX+UW-r,UY);
    ctx.quadraticCurveTo(UX+UW,UY,UX+UW,UY+r);
    ctx.lineTo(UX+UW,UY+UH-r); ctx.quadraticCurveTo(UX+UW,UY+UH,UX+UW-r,UY+UH);
    ctx.lineTo(UX+r,UY+UH); ctx.quadraticCurveTo(UX,UY+UH,UX,UY+UH-r);
    ctx.lineTo(UX,UY+r); ctx.quadraticCurveTo(UX,UY,UX+r,UY);
    ctx.closePath();
  }
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(UIDT, CW/2, UY + UH/2);

  // ── 5. INFO TABLE ─────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, IY, CW, IH);
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = p(0.3);
  ctx.beginPath(); ctx.moveTo(0, IY); ctx.lineTo(CW, IY); ctx.stroke();

  const LXI = p(3.5), VXI = p(22), VW = CW - VXI - p(3);
  // measure each row height dynamically
  const tc = document.createElement('canvas'); tc.width = CW; tc.height = 10;
  const mc = tc.getContext('2d'); mc.font = `400 ${p(2.4)}px Arial`;

  const rowHeights = rows.map(([, val]) => {
    const lines = wrapText(mc, val, VW);
    return lines.length > 1 ? lines.length * p(3.2) + p(2) : p(4.6);
  });
  const totalRowH = rowHeights.reduce((a, b) => a + b, 0);
  // scale if overflow
  const scale = Math.min(1, IH / totalRowH);

  let ry = IY;
  rows.forEach(([lbl, val], i) => {
    const lines = wrapText(mc, val, VW);
    const rh = Math.round(rowHeights[i] * scale);

    if (i % 2 === 0) { ctx.fillStyle = '#f5f8ff'; ctx.fillRect(0, ry, CW, rh); }

    ctx.font = `700 ${p(2.4)}px Arial`; ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, LXI, ry + rh / 2);

    ctx.font = `400 ${p(2.4)}px Arial`; ctx.fillStyle = '#1a1a1a';
    ctx.textBaseline = 'top';
    const lnH = p(3.2) * scale;
    lines.forEach((ln, li) => ctx.fillText(ln, VXI, ry + p(1) * scale + li * lnH));

    ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = p(0.3);
    ctx.beginPath(); ctx.moveTo(0, ry + rh); ctx.lineTo(CW, ry + rh); ctx.stroke();
    ry += rh;
  });

  // ── 6. SIGN FOOTER ────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, SFY, CW, SFH);
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = p(0.3);
  ctx.beginPath(); ctx.moveTo(0, SFY); ctx.lineTo(CW, SFY); ctx.stroke();

  ctx.font = `900 ${p(3.2)}px Arial`; ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`Class : ${classVal || '—'}`, p(4), SFY + SFH / 2);

  if (signImg) {
    const sh = Math.min(p(6), SFH - p(1.5));
    const sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - p(4), sy = SFY + (SFH - sh) / 2 - p(0.5);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = '#555'; ctx.lineWidth = p(0.4);
    ctx.beginPath(); ctx.moveTo(sx, sy+sh+p(0.6)); ctx.lineTo(sx+sw, sy+sh+p(0.6)); ctx.stroke();
    ctx.font = `400 ${p(2)}px Arial`; ctx.fillStyle = '#555';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal Sign.', sx + sw/2, sy + sh + p(1));
  }

  // ── 7. BOTTOM STRIP ───────────────────────────────────────────────────
  if (BTSH > 0) {
    ctx.fillStyle = color; ctx.fillRect(0, BTSY, CW, BTSH);
    ctx.font = `500 ${p(2.2)}px Arial`; ctx.fillStyle = '#fff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`If found, please return to school  •  Ph: ${settings.contactNumber || '—'}`, CW/2, BTSY + BTSH/2);
  }
};

const drawStudent = async (canvas, student, settings, assets, color = '#1565c0') => {
  await drawCard(canvas, settings, assets, {
    color,
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

const drawTeacher = async (canvas, teacher, settings, assets) => {
  await drawCard(canvas, settings, assets, {
    color: '#1565c0',
    personName: teacher.name || '',
    idLine: `ID: ${teacher.employeeCode || '—'}`,
    classVal: teacher.designation || 'Teacher',
    rows: [
      ['Designation', teacher.designation || 'Teacher'],
      ['Phone',       teacher.phone || '—'],
      ['Address',     teacher.address || '—'],
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
