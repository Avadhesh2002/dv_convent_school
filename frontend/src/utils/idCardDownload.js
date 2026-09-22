import JSZip from 'jszip';

// ── Physical size: 57mm × 87mm @ 300 DPI ──────────────────────────────────
// 57mm = 2.244in → 2.244 × 300 = 673px
// 87mm = 3.425in → 3.425 × 300 = 1028px
const R   = 3.125;           // px-per-"design-unit"  (design at 96dpi equivalent)
const CW  = Math.round(57  * 300 / 25.4);   // 673
const CH  = Math.round(87  * 300 / 25.4);   // 1028

const s   = (v) => Math.round(v * R);

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

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const ellipseText = (ctx, text, maxW) => {
  if (!text) return '—';
  let t = String(text);
  while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1);
  if (t.length < String(text).length) t = t.slice(0, -1) + '…';
  return t;
};

const wrapText = (ctx, text, maxW) => {
  if (!text) return ['—'];
  const raw   = String(text).replace(/,/g, ', ').replace(/\s+/g, ' ').trim();
  const words = raw.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['—'];
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// draw a centered circle (hole for ribbon)
const drawHole = (ctx, x, y, r, bg = '#e5e7eb') => {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = s(1); ctx.stroke();
  ctx.restore();
};

// draw photo with smart crop
const drawPhoto = (ctx, img, x, y, w, h, fallbackColor, fallbackLetter) => {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (img) {
    const ia = img.width / img.height, ba = w / h;
    let sx, sy, sw, sh;
    if (ia > ba) { sh = img.height; sw = sh * ba; sx = (img.width - sw) / 2; sy = 0; }
    else         { sw = img.width;  sh = sw / ba; sx = 0; sy = 0; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = fallbackColor + '22'; ctx.fillRect(x, y, w, h);
    ctx.font = `900 ${s(36)}px Arial`; ctx.fillStyle = fallbackColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fallbackLetter, x + w / 2, y + h / 2);
  }
  ctx.restore();
};

// ════════════════════════════════════════════════════════════════════════════
// STUDENT CARD  — Modern lanyard card  57×87mm
// Layout (top → bottom):
//   [ribbon strip]  top 28px transparent + hole
//   [header band]   school name + logo
//   [photo]         centered portrait
//   [name + UID]
//   [info rows]     DOB · Contact · Class · Address
//   [footer strip]  principal sign + "Student ID Card"
// ════════════════════════════════════════════════════════════════════════════
const drawStudentCard = async (canvas, student, settings, assets, color = '#1a3a6b') => {
  const { logoImg, signImg, photoImg } = assets;

  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // ── Background ─────────────────────────────────────────────────────────
  ctx.save();
  roundRect(ctx, 0, 0, CW, CH, s(10));
  ctx.clip();

  // white card bg
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // subtle dot-grid watermark
  ctx.fillStyle = color + '0a';
  for (let gx = s(12); gx < CW; gx += s(14))
    for (let gy = s(40); gy < CH - s(40); gy += s(14)) {
      ctx.beginPath(); ctx.arc(gx, gy, s(1), 0, Math.PI * 2); ctx.fill();
    }

  // ── Ribbon strip at top ─────────────────────────────────────────────────
  const ribbonH = s(22);
  ctx.fillStyle = color + 'cc';
  ctx.fillRect(0, 0, CW, ribbonH);

  // dashed lanyard lines
  ctx.setLineDash([s(4), s(4)]);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = s(1.5);
  ctx.beginPath(); ctx.moveTo(CW * 0.38, 0); ctx.lineTo(CW * 0.38, ribbonH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW * 0.62, 0); ctx.lineTo(CW * 0.62, ribbonH); ctx.stroke();
  ctx.setLineDash([]);

  // Ribbon hole
  drawHole(ctx, CW / 2, ribbonH / 2, s(7), '#ffffff');

  // ── Header band ────────────────────────────────────────────────────────
  const hdrY = ribbonH;
  const hdrH = s(62);
  const hg   = ctx.createLinearGradient(0, hdrY, 0, hdrY + hdrH);
  hg.addColorStop(0, color); hg.addColorStop(1, color + 'ee');
  ctx.fillStyle = hg; ctx.fillRect(0, hdrY, CW, hdrH);

  // diagonal accent stripe
  ctx.save();
  ctx.beginPath(); ctx.rect(0, hdrY, CW, hdrH); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = s(12);
  ctx.beginPath(); ctx.moveTo(-s(20), hdrY + hdrH); ctx.lineTo(CW * 0.6, hdrY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW * 0.4, hdrY + hdrH); ctx.lineTo(CW + s(20), hdrY); ctx.stroke();
  ctx.restore();

  // Logo circle
  const logoSz = s(36), logoX = s(10), logoY = hdrY + (hdrH - logoSz) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(logoX + logoSz/2, logoY + logoSz/2, logoSz/2, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = s(2); ctx.stroke(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, logoX, logoY, logoSz, logoSz);
  else { ctx.fillStyle = color + '33'; ctx.fillRect(logoX, logoY, logoSz, logoSz); }
  ctx.restore();

  // School text
  const tx = logoX + logoSz + s(8), tw = CW - tx - s(8);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = `900 ${s(9.5)}px Arial`; ctx.fillStyle = '#fff';
  const sName = ellipseText(ctx, settings.schoolName || 'D V Convent School', tw);
  ctx.fillText(sName, tx, hdrY + s(8));
  ctx.font = `400 ${s(6)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('(Govt. Recognised)', tx, hdrY + s(21));
  ctx.font = `400 ${s(5.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const addr = ellipseText(ctx, settings.schoolAddress || 'Akodha, Rohi, Bhadohi', tw);
  ctx.fillText(addr, tx, hdrY + s(31));
  ctx.font = `700 ${s(6)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(`Ph: ${settings.contactNumber || '—'}`, tx, hdrY + s(43));

  // ── "STUDENT ID CARD" label ─────────────────────────────────────────────
  const labelY = hdrY + hdrH;
  const labelH = s(16);
  ctx.fillStyle = color + '18';
  ctx.fillRect(0, labelY, CW, labelH);
  ctx.font = `900 ${s(7)}px Arial`; ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('STUDENT  IDENTITY  CARD', CW/2, labelY + labelH/2);

  // ── Photo ──────────────────────────────────────────────────────────────
  const photoW = s(72), photoH = s(88);
  const photoX = (CW - photoW) / 2;
  const photoY = labelY + labelH + s(6);

  // shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = s(6); ctx.shadowOffsetY = s(3);
  ctx.strokeStyle = color; ctx.lineWidth = s(2.5);
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  ctx.restore();

  drawPhoto(ctx, photoImg, photoX, photoY, photoW, photoH, color, (student.name||'?').charAt(0).toUpperCase());

  // small colored bar below photo
  ctx.fillStyle = color;
  ctx.fillRect(photoX, photoY + photoH, photoW, s(3));

  // ── Name ───────────────────────────────────────────────────────────────
  const nameY2 = photoY + photoH + s(10);
  ctx.font = `900 ${s(10.5)}px Arial`; ctx.fillStyle = '#111827';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(ellipseText(ctx, student.name || '', CW - s(16)), CW/2, nameY2);

  // ── UID pill ───────────────────────────────────────────────────────────
  const uidTxt = `UID : ${student.UID || '—'}`;
  ctx.font = `800 ${s(6.5)}px Arial`;
  const uidW2 = ctx.measureText(uidTxt).width + s(20);
  const uidX2 = (CW - uidW2) / 2;
  const uidY2 = nameY2 + s(14);
  const uidH2 = s(13);
  roundRect(ctx, uidX2, uidY2, uidW2, uidH2, s(6));
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(uidTxt, CW/2, uidY2 + uidH2/2);

  // ── Info rows ──────────────────────────────────────────────────────────
  const rowStartY = uidY2 + uidH2 + s(6);
  const lx = s(10), vx2 = lx + s(52), valMaxW = CW - vx2 - s(8);
  const baseRH = s(13), lineH = s(8);

  const rows = [
    ["Class",    `Class ${student.class || '—'}`],
    ["D.O.B.",   fmtDate(student.dateOfBirth)],
    ["Contact",  student.fatherMobile || student.motherMobile || student.guardianMobile || '—'],
    ["Address",  student.address || '—'],
  ];

  const tmp = document.createElement('canvas');
  tmp.width = CW; tmp.height = 10;
  const mctx = tmp.getContext('2d');
  mctx.font = `500 ${s(6.5)}px Arial`;
  const rowHeights = rows.map(([, val]) => {
    const lines = wrapText(mctx, val, valMaxW);
    return lines.length > 1 ? lines.length * lineH + s(3) : baseRH;
  });

  let ry = rowStartY;
  rows.forEach(([lbl, val], i) => {
    const rowH = rowHeights[i];
    // alternating row bg
    if (i % 2 === 0) {
      ctx.fillStyle = color + '08';
      ctx.fillRect(0, ry, CW, rowH);
    }
    ctx.font = `700 ${s(6.5)}px Arial`; ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx, ry + rowH / 2);

    ctx.font = `500 ${s(6.5)}px Arial`; ctx.fillStyle = '#1f2937';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, val, valMaxW);
    lines.forEach((line, li) => ctx.fillText(line, vx2, ry + s(2.5) + li * lineH));

    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = s(0.8);
    ctx.beginPath(); ctx.moveTo(0, ry + rowH); ctx.lineTo(CW, ry + rowH); ctx.stroke();
    ry += rowH;
  });

  // ── Footer strip ───────────────────────────────────────────────────────
  const footH = CH - ry;
  const signAreaH = footH - s(16);

  // principal sign
  if (signImg) {
    const sh = Math.min(s(20), signAreaH - s(6));
    const sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - s(10), sy = ry + s(4);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = '#6b7280'; ctx.lineWidth = s(0.8);
    ctx.beginPath(); ctx.moveTo(sx, sy+sh+s(1)); ctx.lineTo(sx+sw, sy+sh+s(1)); ctx.stroke();
    ctx.font = `500 ${s(5.5)}px Arial`; ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal', sx + sw/2, sy + sh + s(2));
  }

  // bottom colored strip
  ctx.fillStyle = color;
  ctx.fillRect(0, CH - s(16), CW, s(16));
  ctx.font = `600 ${s(5.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`If found, return to school  •  Ph: ${settings.contactNumber || '—'}`, CW/2, CH - s(8));

  ctx.restore();
};

// ════════════════════════════════════════════════════════════════════════════
// TEACHER CARD  — same size, dark red theme
// ════════════════════════════════════════════════════════════════════════════
const drawTeacherCard = async (canvas, teacher, settings, assets) => {
  const { logoImg, signImg, photoImg } = assets;
  const color = '#7b1d1d';

  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  ctx.save();
  roundRect(ctx, 0, 0, CW, CH, s(10));
  ctx.clip();

  // white bg
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, CW, CH);

  // dot watermark
  ctx.fillStyle = color + '0a';
  for (let gx = s(12); gx < CW; gx += s(14))
    for (let gy = s(40); gy < CH - s(40); gy += s(14)) {
      ctx.beginPath(); ctx.arc(gx, gy, s(1), 0, Math.PI * 2); ctx.fill();
    }

  // ── Ribbon strip ───────────────────────────────────────────────────────
  const ribbonH = s(22);
  ctx.fillStyle = color + 'cc'; ctx.fillRect(0, 0, CW, ribbonH);
  ctx.setLineDash([s(4), s(4)]);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = s(1.5);
  ctx.beginPath(); ctx.moveTo(CW*0.38, 0); ctx.lineTo(CW*0.38, ribbonH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW*0.62, 0); ctx.lineTo(CW*0.62, ribbonH); ctx.stroke();
  ctx.setLineDash([]);
  drawHole(ctx, CW/2, ribbonH/2, s(7), '#ffffff');

  // ── Header band ────────────────────────────────────────────────────────
  const hdrY = ribbonH, hdrH = s(62);
  const hg   = ctx.createLinearGradient(0, hdrY, 0, hdrY + hdrH);
  hg.addColorStop(0, color); hg.addColorStop(1, '#b91c1c');
  ctx.fillStyle = hg; ctx.fillRect(0, hdrY, CW, hdrH);

  ctx.save();
  ctx.beginPath(); ctx.rect(0, hdrY, CW, hdrH); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = s(12);
  ctx.beginPath(); ctx.moveTo(-s(20), hdrY+hdrH); ctx.lineTo(CW*0.6, hdrY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(CW*0.4, hdrY+hdrH); ctx.lineTo(CW+s(20), hdrY); ctx.stroke();
  ctx.restore();

  // Logo
  const logoSz = s(36), logoX = s(10), logoY = hdrY + (hdrH - logoSz) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(logoX+logoSz/2, logoY+logoSz/2, logoSz/2, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = s(2); ctx.stroke(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, logoX, logoY, logoSz, logoSz);
  ctx.restore();

  const tx = logoX+logoSz+s(8), tw = CW-tx-s(8);
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.font = `900 ${s(9.5)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(ellipseText(ctx, settings.schoolName||'D V Convent School', tw), tx, hdrY+s(8));
  ctx.font = `400 ${s(6)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('(Govt. Recognised)', tx, hdrY+s(21));
  ctx.font = `400 ${s(5.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(ellipseText(ctx, settings.schoolAddress||'Akodha, Rohi, Bhadohi', tw), tx, hdrY+s(31));
  ctx.font = `700 ${s(6)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, tx, hdrY+s(43));

  // ── "STAFF ID CARD" label ───────────────────────────────────────────────
  const labelY = hdrY + hdrH, labelH = s(16);
  ctx.fillStyle = color + '18'; ctx.fillRect(0, labelY, CW, labelH);
  ctx.font = `900 ${s(7)}px Arial`; ctx.fillStyle = color;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('STAFF  IDENTITY  CARD', CW/2, labelY+labelH/2);

  // ── Photo ──────────────────────────────────────────────────────────────
  const photoW = s(72), photoH = s(88);
  const photoX = (CW - photoW) / 2;
  const photoY = labelY + labelH + s(6);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = s(6); ctx.shadowOffsetY = s(3);
  ctx.strokeStyle = color; ctx.lineWidth = s(2.5); ctx.strokeRect(photoX, photoY, photoW, photoH);
  ctx.restore();
  drawPhoto(ctx, photoImg, photoX, photoY, photoW, photoH, color, (teacher.name||'?').charAt(0).toUpperCase());
  ctx.fillStyle = color; ctx.fillRect(photoX, photoY+photoH, photoW, s(3));

  // ── Name ───────────────────────────────────────────────────────────────
  const nameY2 = photoY+photoH+s(10);
  ctx.font = `900 ${s(10.5)}px Arial`; ctx.fillStyle = '#111827';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(ellipseText(ctx, teacher.name||'', CW-s(16)), CW/2, nameY2);

  // Emp ID pill
  const uidTxt = `ID : ${teacher.employeeCode||'—'}`;
  ctx.font = `800 ${s(6.5)}px Arial`;
  const uidW2 = ctx.measureText(uidTxt).width + s(20);
  const uidX2 = (CW-uidW2)/2, uidY2 = nameY2+s(14), uidH2 = s(13);
  roundRect(ctx, uidX2, uidY2, uidW2, uidH2, s(6));
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(uidTxt, CW/2, uidY2+uidH2/2);

  // ── Info rows ──────────────────────────────────────────────────────────
  const rowStartY = uidY2+uidH2+s(6);
  const lx = s(10), vx2 = lx+s(60), valMaxW = CW-vx2-s(8);
  const baseRH = s(13), lineH = s(8);

  const rows = [
    ['Designation', teacher.designation||'Teacher'],
    ['Phone',       teacher.phone||'—'],
    ['Address',     teacher.address||'—'],
  ];

  const tmp = document.createElement('canvas');
  tmp.width = CW; tmp.height = 10;
  const mctx = tmp.getContext('2d');
  mctx.font = `500 ${s(6.5)}px Arial`;
  const rowHeights = rows.map(([,val]) => {
    const lines = wrapText(mctx, val, valMaxW);
    return lines.length > 1 ? lines.length*lineH+s(3) : baseRH;
  });

  let ry = rowStartY;
  rows.forEach(([lbl, val], i) => {
    const rowH = rowHeights[i];
    if (i % 2 === 0) { ctx.fillStyle = color+'08'; ctx.fillRect(0, ry, CW, rowH); }
    ctx.font = `700 ${s(6.5)}px Arial`; ctx.fillStyle = color;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx, ry+rowH/2);
    ctx.font = `500 ${s(6.5)}px Arial`; ctx.fillStyle = '#1f2937';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, val, valMaxW);
    lines.forEach((line, li) => ctx.fillText(line, vx2, ry+s(2.5)+li*lineH));
    ctx.strokeStyle = '#f0e0e0'; ctx.lineWidth = s(0.8);
    ctx.beginPath(); ctx.moveTo(0, ry+rowH); ctx.lineTo(CW, ry+rowH); ctx.stroke();
    ry += rowH;
  });

  // Footer
  if (signImg) {
    const sh = Math.min(s(20), CH-ry-s(20));
    const sw = sh * (signImg.width / signImg.height);
    const sx = CW-sw-s(10), sy = ry+s(4);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = '#9ca3af'; ctx.lineWidth = s(0.8);
    ctx.beginPath(); ctx.moveTo(sx, sy+sh+s(1)); ctx.lineTo(sx+sw, sy+sh+s(1)); ctx.stroke();
    ctx.font = `500 ${s(5.5)}px Arial`; ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal', sx+sw/2, sy+sh+s(2));
  }

  ctx.fillStyle = color; ctx.fillRect(0, CH-s(16), CW, s(16));
  ctx.font = `600 ${s(5.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`If found, return to school  •  Ph: ${settings.contactNumber||'—'}`, CW/2, CH-s(8));

  ctx.restore();
};

// ── Download helpers ───────────────────────────────────────────────────────
const itemToBlob = async (item, type, settings, sharedAssets, studentColor = '#1a3a6b') => {
  const resolvePhoto = (p) => {
    if (!p) return null;
    if (p.startsWith('data:') || p.startsWith('http')) return p;
    const base = import.meta.env?.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';
    return `${base}${p}`;
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
  const zip    = new JSZip();
  const folder = zip.folder(`${label}-id-cards`);
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i, items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`, await itemToBlob(items[i], type, settings, shared, studentColor));
  }
  onProgress?.(items.length, items.length);
  triggerDownload(await zip.generateAsync({ type: 'blob' }), `${label}-id-cards.zip`);
};
