import JSZip from 'jszip';

// 57mm × 87mm @ 300 DPI
const CW = Math.round(57  * 300 / 25.4);   // 673px
const CH = Math.round(87  * 300 / 25.4);   // 1028px
const R  = CW / 57;                         // px per mm  ≈ 11.81

const mm  = (v) => Math.round(v * R);       // mm → px
const s   = mm;

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

const roundRectPath = (ctx, x, y, w, h, r) => {
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
};

const ellipsis = (ctx, text, maxW) => {
  if (!text) return '—';
  let t = String(text);
  while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1);
  return t.length < String(text).length ? t.slice(0, -1) + '…' : t;
};

const wrap = (ctx, text, maxW) => {
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

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// Draw photo with smart crop inside clipped rect
const drawCroppedPhoto = (ctx, img, x, y, w, h, fallColor, letter) => {
  ctx.save();
  roundRectPath(ctx, x, y, w, h, mm(1));
  ctx.clip();
  if (img) {
    const ia = img.width / img.height, ba = w / h;
    let sx, sy, sw, sh;
    if (ia > ba) { sh = img.height; sw = sh * ba; sx = (img.width - sw) / 2; sy = 0; }
    else         { sw = img.width; sh = sw / ba; sx = 0; sy = 0; }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = fallColor + '22'; ctx.fillRect(x, y, w, h);
    ctx.font = `900 ${mm(9)}px Arial`; ctx.fillStyle = fallColor;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(letter, x + w / 2, y + h / 2);
  }
  ctx.restore();
};

// ════════════════════════════════════════════════════════════════
// DRAW CARD — shared base for student + teacher
// ════════════════════════════════════════════════════════════════
const drawCard = async (canvas, data, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, accentColor, cardLabel, rows, idLine, personName } = opts;

  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // ── Outer card shape ───────────────────────────────────────────
  ctx.save();
  roundRectPath(ctx, 0, 0, CW, CH, mm(3));
  ctx.clip();

  // ── White base ─────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // ── RIBBON SPACE (top 9mm — pure white, just punch hole) ───────
  const ribbonH = mm(9);

  // subtle top-edge tint so ribbon area is visible
  const rtg = ctx.createLinearGradient(0, 0, 0, ribbonH);
  rtg.addColorStop(0, color + '18');
  rtg.addColorStop(1, '#ffffff');
  ctx.fillStyle = rtg;
  ctx.fillRect(0, 0, CW, ribbonH);

  // two thin guide lines showing lanyard slot
  ctx.strokeStyle = color + '30';
  ctx.lineWidth = mm(0.4);
  [[CW * 0.35, CW * 0.35], [CW * 0.65, CW * 0.65]].forEach(([x]) => {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ribbonH); ctx.stroke();
  });

  // Punch hole — clean circle
  const holeR = mm(2.2);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = mm(1);
  ctx.beginPath(); ctx.arc(CW / 2, ribbonH / 2, holeR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
  ctx.beginPath(); ctx.arc(CW / 2, ribbonH / 2, holeR, 0, Math.PI * 2);
  ctx.strokeStyle = color + '60'; ctx.lineWidth = mm(0.5); ctx.stroke();

  // ── HEADER BAND ────────────────────────────────────────────────
  const hdrY = ribbonH;
  const hdrH = mm(19);

  const hg = ctx.createLinearGradient(0, hdrY, CW, hdrY + hdrH);
  hg.addColorStop(0,   color);
  hg.addColorStop(0.6, color);
  hg.addColorStop(1,   accentColor);
  ctx.fillStyle = hg;
  ctx.fillRect(0, hdrY, CW, hdrH);

  // diagonal shimmer overlay
  ctx.save();
  ctx.beginPath(); ctx.rect(0, hdrY, CW, hdrH); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = mm(5);
  for (let xi = -CW; xi < CW * 2; xi += mm(12)) {
    ctx.beginPath();
    ctx.moveTo(xi, hdrY); ctx.lineTo(xi + mm(18), hdrY + hdrH);
    ctx.stroke();
  }
  ctx.restore();

  // Logo — circle with white ring
  const logoSz = mm(12), logoX = mm(3), logoY = hdrY + (hdrH - logoSz) / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = mm(1.5);
  ctx.beginPath(); ctx.arc(logoX + logoSz / 2, logoY + logoSz / 2, logoSz / 2 + mm(0.8), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(logoX + logoSz / 2, logoY + logoSz / 2, logoSz / 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, logoX, logoY, logoSz, logoSz);
  else { ctx.fillStyle = color + '22'; ctx.fillRect(logoX, logoY, logoSz, logoSz); }
  ctx.restore();

  // School text
  const tx = logoX + logoSz + mm(2.5), tw = CW - tx - mm(2);
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  ctx.font = `900 ${mm(4.2)}px Arial`; ctx.fillStyle = '#ffffff';
  const sn = ellipsis(ctx, settings.schoolName || 'D V Convent School', tw);
  ctx.fillText(sn, tx, hdrY + mm(2.5));
  ctx.font = `400 ${mm(2.6)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.fillText('Govt. Recognised School', tx, hdrY + mm(8));
  ctx.font = `400 ${mm(2.4)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.72)';
  const addr = ellipsis(ctx, settings.schoolAddress || 'Akodha, Rohi, Bhadohi', tw);
  ctx.fillText(addr, tx, hdrY + mm(12));
  ctx.font = `600 ${mm(2.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(`Ph: ${settings.contactNumber || '—'}`, tx, hdrY + mm(15.5));

  // ── CARD LABEL BAR ─────────────────────────────────────────────
  const labY = hdrY + hdrH;
  const labH = mm(5.5);
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, labY, CW, labH);
  ctx.font = `900 ${mm(2.8)}px Arial`; ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${mm(1)}px`;
  ctx.fillText(cardLabel, CW / 2, labY + labH / 2);
  ctx.letterSpacing = '0px';

  // ── PHOTO ──────────────────────────────────────────────────────
  const photoW = mm(22), photoH = mm(27);
  const photoX = (CW - photoW) / 2;
  const photoY2 = labY + labH + mm(3);

  // drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = mm(2); ctx.shadowOffsetY = mm(1);
  roundRectPath(ctx, photoX, photoY2, photoW, photoH, mm(1));
  ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();

  // colored left-edge accent on photo
  ctx.fillStyle = color;
  ctx.fillRect(photoX, photoY2, mm(1), photoH);

  // actual photo
  drawCroppedPhoto(ctx, photoImg, photoX, photoY2, photoW, photoH, color, (personName || '?').charAt(0).toUpperCase());

  // bottom color bar under photo
  ctx.fillStyle = color;
  roundRectPath(ctx, photoX, photoY2 + photoH - mm(1.5), photoW, mm(1.5), 0);
  ctx.fill();

  // ── NAME ───────────────────────────────────────────────────────
  const nameY = photoY2 + photoH + mm(2.5);
  ctx.font = `900 ${mm(4)}px Arial`; ctx.fillStyle = '#1a1a2e';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(ellipsis(ctx, personName || '', CW - mm(6)), CW / 2, nameY);

  // ── ID PILL ────────────────────────────────────────────────────
  const pillY = nameY + mm(5.5);
  const pillH = mm(4.5);
  ctx.font = `700 ${mm(2.5)}px Arial`;
  const pillW = ctx.measureText(idLine).width + mm(6);
  const pillX = (CW - pillW) / 2;
  roundRectPath(ctx, pillX, pillY, pillW, pillH, mm(2.2));
  const pg = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY);
  pg.addColorStop(0, color); pg.addColorStop(1, accentColor);
  ctx.fillStyle = pg; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(idLine, CW / 2, pillY + pillH / 2);

  // ── INFO ROWS ──────────────────────────────────────────────────
  const infoY = pillY + pillH + mm(2.5);
  const lx = mm(3), vx = lx + mm(16), valW = CW - vx - mm(3);
  const rowH = mm(5), lineH = mm(3.2);

  // measure rows for wrapping
  const tmp = document.createElement('canvas');
  tmp.width = CW; tmp.height = 10;
  const mctx = tmp.getContext('2d');
  mctx.font = `500 ${mm(2.6)}px Arial`;

  let ry = infoY;
  rows.forEach(([lbl, val], i) => {
    const lines   = wrap(mctx, val, valW);
    const thisRow = lines.length > 1 ? lines.length * lineH + mm(1) : rowH;

    // alternate row bg
    if (i % 2 === 0) {
      ctx.fillStyle = color + '08';
      roundRectPath(ctx, 0, ry, CW, thisRow, 0);
      ctx.fill();
    }

    // label dot
    ctx.beginPath(); ctx.arc(lx + mm(0.8), ry + thisRow / 2, mm(0.8), 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();

    // label text
    ctx.font = `700 ${mm(2.6)}px Arial`; ctx.fillStyle = color + 'cc';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx + mm(2.5), ry + thisRow / 2);

    // value text
    ctx.font = `500 ${mm(2.6)}px Arial`; ctx.fillStyle = '#1f2937';
    ctx.textBaseline = 'top';
    lines.forEach((line, li) => ctx.fillText(line, vx, ry + mm(1) + li * lineH));

    // divider
    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = mm(0.3);
    ctx.beginPath(); ctx.moveTo(lx, ry + thisRow); ctx.lineTo(CW - lx, ry + thisRow); ctx.stroke();

    ry += thisRow;
  });

  // ── PRINCIPAL SIGN ─────────────────────────────────────────────
  const signY = ry + mm(1.5);
  if (signImg) {
    const sh = Math.min(mm(8), CH - signY - mm(9));
    const sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - mm(3), sy = signY;
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = color + '80'; ctx.lineWidth = mm(0.4);
    ctx.beginPath(); ctx.moveTo(sx, sy + sh + mm(0.5)); ctx.lineTo(sx + sw, sy + sh + mm(0.5)); ctx.stroke();
    ctx.font = `500 ${mm(2.2)}px Arial`; ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal', sx + sw / 2, sy + sh + mm(1));
  }

  // ── BOTTOM STRIP ───────────────────────────────────────────────
  const stripH = mm(6);
  const stripY = CH - stripH;

  const sg = ctx.createLinearGradient(0, stripY, CW, stripY);
  sg.addColorStop(0, color); sg.addColorStop(1, accentColor);
  ctx.fillStyle = sg; ctx.fillRect(0, stripY, CW, stripH);

  // diagonal accents on strip
  ctx.save();
  ctx.beginPath(); ctx.rect(0, stripY, CW, stripH); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = mm(4);
  for (let xi = -CW; xi < CW * 2; xi += mm(10)) {
    ctx.beginPath(); ctx.moveTo(xi, stripY); ctx.lineTo(xi + mm(8), stripY + stripH); ctx.stroke();
  }
  ctx.restore();

  ctx.font = `500 ${mm(2.1)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`If found, return to school  •  ${settings.schoolName || ''}`, CW / 2, stripY + stripH / 2);

  ctx.restore(); // un-clip card shape
};

// ════════════════════════════════════════════════════════════════
// STUDENT CARD
// ════════════════════════════════════════════════════════════════
const drawStudentCard = async (canvas, student, settings, assets, color = '#1a3a6b') => {
  const accentColor = color === '#1a3a6b' ? '#2563eb' : color + 'bb';
  await drawCard(canvas, student, settings, assets, {
    color,
    accentColor,
    cardLabel:  'STUDENT  IDENTITY  CARD',
    personName: student.name || '',
    idLine:     `UID : ${student.UID || '—'}`,
    rows: [
      ['Class',    `Class ${student.class || '—'}`],
      ['DOB',      fmtDate(student.dateOfBirth)],
      ['Father',   student.fatherName || '—'],
      ['Contact',  student.fatherMobile || student.motherMobile || student.guardianMobile || '—'],
      ['Address',  student.address || '—'],
    ],
  });
};

// ════════════════════════════════════════════════════════════════
// TEACHER CARD
// ════════════════════════════════════════════════════════════════
const drawTeacherCard = async (canvas, teacher, settings, assets) => {
  const color = '#7b1d1d';
  const accentColor = '#b91c1c';
  await drawCard(canvas, teacher, settings, assets, {
    color,
    accentColor,
    cardLabel:  'STAFF  IDENTITY  CARD',
    personName: teacher.name || '',
    idLine:     `ID : ${teacher.employeeCode || '—'}`,
    rows: [
      ['Desig.',  teacher.designation || 'Teacher'],
      ['Phone',   teacher.phone || '—'],
      ['Address', teacher.address || '—'],
    ],
  });
};

// ── Download pipeline ──────────────────────────────────────────────────────
const itemToBlob = async (item, type, settings, sharedAssets, studentColor) => {
  const resolvePhoto = (p) => {
    if (!p) return null;
    if (p.startsWith('data:') || p.startsWith('http')) return p;
    const base = import.meta.env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
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
  const zip = new JSZip();
  const folder = zip.folder(`${label}-id-cards`);
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i, items.length);
    folder.file(`${label}-card-${String(i + 1).padStart(3, '0')}.png`, await itemToBlob(items[i], type, settings, shared, studentColor));
  }
  onProgress?.(items.length, items.length);
  triggerDownload(await zip.generateAsync({ type: 'blob' }), `${label}-id-cards.zip`);
};
