import JSZip from 'jszip';

// ── Exact 57mm × 87mm @ 300 DPI ───────────────────────────────────────────
// 1 inch = 25.4mm  →  300px/inch
const PPI  = 300;
const MM   = PPI / 25.4;          // px per mm  = 11.811...
const CW   = Math.round(57 * MM); // 673 px  (width  = 57mm)
const CH   = Math.round(87 * MM); // 1028 px (height = 87mm)
const p    = (mm) => Math.round(mm * MM); // mm → px helper

// ── Helpers ────────────────────────────────────────────────────────────────
const loadImage = (src) =>
  new Promise((resolve) => {
    if (!src) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

const ellipsis = (ctx, text, maxW) => {
  if (!text) return '—';
  let t = String(text);
  while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1);
  return t.length < String(text).length ? t.slice(0, -1) + '…' : t;
};

const wrapLines = (ctx, text, maxW) => {
  if (!text) return ['—'];
  const words = String(text).replace(/,/g, ', ').replace(/\s+/g, ' ').trim().split(' ');
  const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['—'];
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// Clip + draw photo inside a rectangle
const drawPhoto = (ctx, img, x, y, w, h, fallColor, letter) => {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (img) {
    const ia = img.width / img.height, ba = w / h;
    let sx, sy, sw, sh;
    if (ia > ba) { sh = img.height; sw = sh * ba; sx = (img.width - sw) / 2; sy = 0; }
    else         { sw = img.width;  sh = sw / ba; sx = 0; sy = 0; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = fallColor + '33'; ctx.fillRect(x, y, w, h);
    ctx.font = `900 ${p(9)}px Arial`; ctx.fillStyle = fallColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, x + w / 2, y + h / 2);
  }
  ctx.restore();
};

// ════════════════════════════════════════════════════════════════════════════
// DRAW CARD  — layout matching reference image
//
//  ┌──────────────────────────────────┐
//  │  RIBBON HOLE  (top 8mm)          │  ← white strip, punch hole center
//  ├──────────────────────────────────┤
//  │ HEADER (27mm)                    │  ← gradient bg, diagonal cut
//  │  Logo + School Name   │  PHOTO   │
//  │  Address / Phone      │  (right) │
//  ├──────────────────────────────────┤
//  │ "STUDENT ID CARD" vertical strip │  ← right 8mm, full body height
//  │ INFO ROWS (left)                 │
//  │  Name, F/Name, Class, DOB, Addr  │
//  ├──────────────────────────────────┤
//  │ FOOTER (phone + principal sign)  │
//  └──────────────────────────────────┘
// ════════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, person, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, accentColor, cardLabel, rows, personName, idVal } = opts;

  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // ── White base ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // ── SECTION HEIGHTS ─────────────────────────────────────────────────────
  const ribbonH = p(8);           // top ribbon space
  const headerH = p(28);          // gradient header
  const footerH = p(9);           // bottom footer
  const sideW   = p(8);           // right "ID CARD" strip width
  const bodyY   = ribbonH + headerH;
  const bodyH   = CH - ribbonH - headerH - footerH;
  const infoW   = CW - sideW;     // info area width

  // ══════════════════════════════════════════════════════════════
  // 1. RIBBON STRIP
  // ══════════════════════════════════════════════════════════════
  // subtle tint
  const rg = ctx.createLinearGradient(0, 0, 0, ribbonH);
  rg.addColorStop(0, color + '22'); rg.addColorStop(1, '#fff');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, CW, ribbonH);

  // punch hole
  const hR = p(2.2);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = p(1);
  ctx.beginPath(); ctx.arc(CW / 2, ribbonH / 2, hR, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(CW / 2, ribbonH / 2, hR, 0, Math.PI * 2);
  ctx.strokeStyle = color + '55'; ctx.lineWidth = p(0.4); ctx.stroke();

  // ══════════════════════════════════════════════════════════════
  // 2. HEADER BAND  (gradient + diagonal accent + logo + photo)
  // ══════════════════════════════════════════════════════════════
  // main gradient fill
  const hg = ctx.createLinearGradient(0, ribbonH, CW, ribbonH + headerH);
  hg.addColorStop(0,   color);
  hg.addColorStop(0.65, color);
  hg.addColorStop(1,   accentColor);
  ctx.fillStyle = hg; ctx.fillRect(0, ribbonH, CW, headerH);

  // diagonal yellow/accent wedge (right side like reference image)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CW * 0.52, ribbonH);
  ctx.lineTo(CW, ribbonH);
  ctx.lineTo(CW, ribbonH + headerH);
  ctx.lineTo(CW * 0.32, ribbonH + headerH);
  ctx.closePath();
  ctx.fillStyle = accentColor + 'bb';
  ctx.fill();
  ctx.restore();

  // shimmer lines on header
  ctx.save();
  ctx.beginPath(); ctx.rect(0, ribbonH, CW, headerH); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = p(4);
  for (let xi = -CW; xi < CW * 2; xi += p(11)) {
    ctx.beginPath(); ctx.moveTo(xi, ribbonH); ctx.lineTo(xi + p(8), ribbonH + headerH); ctx.stroke();
  }
  ctx.restore();

  // PHOTO in header (right side)
  const photoW = p(20), photoH = p(24);
  const photoX = CW - photoW - p(2.5), photoY = ribbonH + (headerH - photoH) / 2;

  // white border around photo
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(photoX - p(1), photoY - p(1), photoW + p(2), photoH + p(2));

  drawPhoto(ctx, photoImg, photoX, photoY, photoW, photoH, color, (personName||'?').charAt(0).toUpperCase());

  // logo circle
  const logoSz = p(11), logoX = p(3), logoY2 = ribbonH + p(3);
  ctx.save();
  ctx.beginPath(); ctx.arc(logoX + logoSz/2, logoY2 + logoSz/2, logoSz/2 + p(0.8), 0, Math.PI*2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(logoX + logoSz/2, logoY2 + logoSz/2, logoSz/2, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, logoX, logoY2, logoSz, logoSz);
  ctx.restore();

  // school name + address in header
  const tx = logoX + logoSz + p(2), tw = photoX - tx - p(2);
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.font = `900 ${p(4)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(ellipsis(ctx, settings.schoolName || 'D V Convent School', tw), tx, ribbonH + p(3));
  ctx.font = `700 ${p(3.2)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText(ellipsis(ctx, settings.schoolName || 'D V Convent School', tw), tx, ribbonH + p(9));
  ctx.font = `400 ${p(2.8)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const addrLines = wrapLines(ctx, settings.schoolAddress || 'Akodha, Rohi, Bhadohi', tw);
  addrLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, tx, ribbonH + p(14) + i * p(4)));
  ctx.font = `700 ${p(2.8)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(`Ph: ${settings.contactNumber || '—'}`, tx, ribbonH + p(23));

  // ══════════════════════════════════════════════════════════════
  // 3. RIGHT SIDE STRIP  "STUDENT ID CARD" vertical
  // ══════════════════════════════════════════════════════════════
  ctx.fillStyle = color;
  ctx.fillRect(CW - sideW, bodyY, sideW, bodyH);

  // vertical text
  ctx.save();
  ctx.translate(CW - sideW / 2, bodyY + bodyH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `900 ${p(3.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${p(1.5)}px`;
  ctx.fillText(cardLabel, 0, 0);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // ══════════════════════════════════════════════════════════════
  // 4. INFO ROWS  (left of right strip)
  // ══════════════════════════════════════════════════════════════
  const lx  = p(3), vx = p(3) + p(17), valW = infoW - vx - p(2);
  const rowH = p(5.5), lineH2 = p(3.5);
  const rowBorderColor = '#e5e7eb';

  let ry = bodyY + p(2);

  rows.forEach(([lbl, val], i) => {
    // measure wrap
    ctx.font = `500 ${p(2.8)}px Arial`;
    const lines = wrapLines(ctx, val, valW);
    const thisH = lines.length > 1 ? lines.length * lineH2 + p(2) : rowH;

    if (i % 2 === 0) {
      ctx.fillStyle = color + '07';
      ctx.fillRect(0, ry, infoW, thisH);
    }

    // label
    ctx.font = `700 ${p(2.8)}px Arial`; ctx.fillStyle = color + 'cc';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx, ry + thisH / 2);

    // colon
    ctx.font = `500 ${p(2.8)}px Arial`; ctx.fillStyle = '#9ca3af';
    ctx.fillText(':', lx + p(15), ry + thisH / 2);

    // value
    ctx.font = `500 ${p(2.8)}px Arial`; ctx.fillStyle = '#1f2937';
    ctx.textBaseline = 'top';
    lines.forEach((line, li) => ctx.fillText(line, vx, ry + p(1) + li * lineH2));

    // divider
    ctx.strokeStyle = rowBorderColor; ctx.lineWidth = p(0.3);
    ctx.beginPath(); ctx.moveTo(0, ry + thisH); ctx.lineTo(infoW, ry + thisH); ctx.stroke();

    ry += thisH;
  });

  // ══════════════════════════════════════════════════════════════
  // 5. FOOTER  (phone icon + principal sign)
  // ══════════════════════════════════════════════════════════════
  const footY = CH - footerH;

  // footer bg — light tint
  const fg = ctx.createLinearGradient(0, footY, 0, CH);
  fg.addColorStop(0, '#f9fafb'); fg.addColorStop(1, '#f0f4ff');
  ctx.fillStyle = fg; ctx.fillRect(0, footY, CW - sideW, footerH);

  // top border line
  ctx.strokeStyle = color + '30'; ctx.lineWidth = p(0.3);
  ctx.beginPath(); ctx.moveTo(0, footY); ctx.lineTo(CW - sideW, footY); ctx.stroke();

  // phone icon area
  ctx.font = `600 ${p(2.5)}px Arial`; ctx.fillStyle = color + 'bb';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('📞', lx, footY + footerH / 2);
  ctx.font = `700 ${p(2.5)}px Arial`; ctx.fillStyle = '#374151';
  ctx.fillText(settings.contactNumber || '—', lx + p(5), footY + footerH / 2);

  // principal sign
  if (signImg) {
    const sh = Math.min(p(7), footerH - p(1));
    const sw = sh * (signImg.width / signImg.height);
    const sx = infoW - sw - p(2), sy = footY + (footerH - sh) / 2;
    ctx.drawImage(signImg, sx, sy, sw, sh);
  }
  ctx.font = `700 ${p(2.4)}px Arial`; ctx.fillStyle = '#374151';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText('Principal', infoW - p(2), footY + footerH / 2);

  // extend right strip into footer
  ctx.fillStyle = color + 'dd';
  ctx.fillRect(CW - sideW, footY, sideW, footerH);
};

// ════════════════════════════════════════════════════════════════
// STUDENT CARD
// ════════════════════════════════════════════════════════════════
const drawStudentCard = async (canvas, student, settings, assets, color = '#1a3a6b') => {
  const accent = color === '#1a3a6b' ? '#f59e0b' : color + 'aa';
  await drawCard(canvas, student, settings, assets, {
    color, accentColor: accent,
    cardLabel:  'STUDENT ID CARD',
    personName: student.name || '',
    idVal:      student.UID || '—',
    rows: [
      ['Name',    student.name || '—'],
      ['F/Name',  student.fatherName || '—'],
      ['Class',   `Class ${student.class || '—'}`],
      ['D.O.B',   fmtDate(student.dateOfBirth)],
      ['Address', student.address || '—'],
    ],
  });
};

// ════════════════════════════════════════════════════════════════
// TEACHER CARD
// ════════════════════════════════════════════════════════════════
const drawTeacherCard = async (canvas, teacher, settings, assets) => {
  const color = '#7b1d1d', accent = '#f59e0b';
  await drawCard(canvas, teacher, settings, assets, {
    color, accentColor: accent,
    cardLabel:  'STAFF ID CARD',
    personName: teacher.name || '',
    idVal:      teacher.employeeCode || '—',
    rows: [
      ['Name',   teacher.name || '—'],
      ['Desig.', teacher.designation || 'Teacher'],
      ['Phone',  teacher.phone || '—'],
      ['Addr.',  teacher.address || '—'],
    ],
  });
};

// ── Download pipeline ──────────────────────────────────────────────────────
const itemToBlob = async (item, type, settings, sharedAssets, studentColor) => {
  const resolvePhoto = (pp) => {
    if (!pp) return null;
    if (pp.startsWith('data:') || pp.startsWith('http')) return pp;
    const base = import.meta.env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${base}${pp}`;
  };
  const photoImg = await loadImage(resolvePhoto(item.profileImage));
  const canvas   = document.createElement('canvas');
  if (type === 'student') await drawStudentCard(canvas, item, settings, { ...sharedAssets, photoImg }, studentColor);
  else                     await drawTeacherCard(canvas, item, settings, { ...sharedAssets, photoImg });
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png', 1.0)
  );
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const downloadCards = async (items, type, settings, schoolLogoSrc, signImageSrc, onProgress, studentColor = '#1a3a6b') => {
  if (!items?.length) throw new Error('No items to download');
  const label  = type === 'student' ? 'student' : 'teacher';
  const shared = {
    logoImg: await loadImage(settings.schoolLogo || schoolLogoSrc),
    signImg: await loadImage(signImageSrc),
  };
  if (items.length === 1) {
    onProgress?.(0, 1);
    triggerDownload(await itemToBlob(items[0], type, settings, shared, studentColor), `${label}-id-card.png`);
    onProgress?.(1, 1);
    return;
  }
  const zip = new JSZip();
  const folder = zip.folder(`${label}-id-cards`);
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i, items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`,
      await itemToBlob(items[i], type, settings, shared, studentColor));
  }
  onProgress?.(items.length, items.length);
  triggerDownload(await zip.generateAsync({ type: 'blob' }), `${label}-id-cards.zip`);
};
