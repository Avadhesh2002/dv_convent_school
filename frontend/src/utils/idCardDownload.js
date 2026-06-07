import JSZip from 'jszip';

const CW = 648;   // 216px × 3
const R  = 3;
const s  = (v) => v * R;

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

// Word-wrap text into lines that fit maxW
// Splits on spaces and after commas so comma-separated addresses also wrap
const wrapText = (ctx, text, maxW) => {
  if (!text) return ['—'];
  // tokenize: split on spaces, but also break after commas
  const raw = String(text).replace(/,/g, ', ').replace(/\s+/g, ' ').trim();
  const words = raw.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : ['—'];
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

// ════════════════════════════════════════════════════════════════════════════
// STUDENT CARD
// ════════════════════════════════════════════════════════════════════════════
const drawStudentCard = async (canvas, student, settings, assets, color = '#1565c0') => {
  const { logoImg, signImg, photoImg } = assets;

  // ── Layout constants (same as preview) ───────────────────────────────────
  const hdrH   = s(72);
  const waveH  = s(10);
  const photoW = s(86), photoH = s(94);
  const nameH  = s(18);   // name text
  const uidH   = s(14);   // uid pill
  const lx2    = s(12), vx = lx2 + s(62), valMaxW = CW - vx - lx2;
  const baseRH = s(14);   // single-line row height (matches preview padding: 3px top+bottom + 7px font ≈ 14)
  const lineH  = s(9);    // per extra line height inside a wrapped row
  const ftH    = s(42);   // footer (class + sign area) — increased to fit sign + label
  const noteH  = s(16);   // bottom strip

  // ── Pre-measure rows to get dynamic height ────────────────────────────────
  // We need a ctx to measure — use a temp canvas
  const tmp = document.createElement('canvas');
  tmp.width = CW; tmp.height = 10;
  const mctx = tmp.getContext('2d');

  const rows = [
    ["Father's Name", student.fatherName || '—'],
    ["Mother's Name", student.motherName || '—'],
    ['D.O.B.',        fmtDate(student.dateOfBirth)],
    ['Contact No.',   student.fatherMobile || student.motherMobile || student.guardianMobile || '—'],
    ['Add.',          student.address || '—'],
  ];

  mctx.font = `500 ${s(7)}px Arial`;
  const rowHeights = rows.map(([, val]) => {
    const lines = wrapText(mctx, val, valMaxW);
    return lines.length > 1 ? lines.length * lineH + s(4) : baseRH;
  });
  const totalRowsH = rowHeights.reduce((a, b) => a + b, 0);

  // Total canvas height = header + wave + photo + name + uid + gap + rows + footer + note
  const photoY  = hdrH + waveH - s(2);
  const nameY   = photoY + photoH + s(5);
  const uidY    = nameY + nameH;
  const rsYStart = uidY + uidH + s(5);
  const CH = rsYStart + totalRowsH + s(2) + ftH + noteH;

  // ── Draw ──────────────────────────────────────────────────────────────────
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  ctx.save();
  roundRect(ctx, 0, 0, CW, CH, s(12));
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // Header
  const hg = ctx.createLinearGradient(0, 0, 0, hdrH);
  hg.addColorStop(0, color); hg.addColorStop(1, color + 'dd');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, CW, hdrH);

  const logoSz = s(52), lx = s(10), ly = (hdrH - logoSz) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(lx + logoSz/2, ly + logoSz/2, logoSz/2, 0, Math.PI*2);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = s(2); ctx.stroke(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, lx, ly, logoSz, logoSz);
  else { ctx.fillStyle = '#e0e7ff'; ctx.fillRect(lx, ly, logoSz, logoSz); }
  ctx.restore();

  const tx = lx + logoSz + s(8), tw = CW - tx - s(8);
  const tyStart = ly + s(4);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = `900 ${s(12.5)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(ellipseText(ctx, settings.schoolName || 'D V Convent School', tw), tx + tw/2, tyStart);
  ctx.font = `400 ${s(6.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('(Govt. Recognised)', tx + tw/2, tyStart + s(16));
  ctx.font = `400 ${s(6.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(ellipseText(ctx, settings.schoolAddress || 'Akodha, Rohi, Bhadohi - 221308', tw), tx + tw/2, tyStart + s(26));
  ctx.font = `800 ${s(7)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(`Phone No.: ${settings.contactNumber || '—'}`, tx + tw/2, tyStart + s(37));

  // Wave divider
  const wg = ctx.createLinearGradient(0, hdrH, 0, hdrH + waveH);
  wg.addColorStop(0, color + 'dd'); wg.addColorStop(1, '#ffffff');
  ctx.fillStyle = wg; ctx.fillRect(0, hdrH, CW, waveH);

  // Photo
  const photoX = (CW - photoW) / 2;
  ctx.strokeStyle = color; ctx.lineWidth = s(2.5);
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  if (photoImg) {
    ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
  } else {
    ctx.fillStyle = '#dbeafe'; ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.font = `900 ${s(36)}px Arial`; ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((student.name || '?').charAt(0).toUpperCase(), photoX + photoW/2, photoY + photoH/2);
  }

  // Name
  ctx.font = `700 ${s(13)}px Arial`; ctx.fillStyle = '#111827';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(ellipseText(ctx, student.name || '', CW - s(20)), CW/2, nameY);

  // UID pill
  const uidTxt = `UID: ${student.UID || '—'}`;
  ctx.font = `800 ${s(7.5)}px Arial`;
  const uidW = ctx.measureText(uidTxt).width + s(24);
  const uidX = (CW - uidW) / 2;
  roundRect(ctx, uidX, uidY, uidW, uidH, s(7));
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(uidTxt, CW/2, uidY + uidH/2);

  // Info rows
  let rsY = rsYStart;
  rows.forEach(([lbl, val], i) => {
    const ry  = rsY;
    const rowH = rowHeights[i];

    ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = s(1);
    ctx.beginPath(); ctx.moveTo(lx2, ry); ctx.lineTo(CW - lx2, ry); ctx.stroke();

    ctx.font = `600 ${s(7)}px Arial`; ctx.fillStyle = '#374151';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(lbl, lx2, ry + rowH / 2);

    ctx.font = `500 ${s(7)}px Arial`; ctx.fillStyle = '#111827';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, val, valMaxW);
    lines.forEach((line, li) => {
      ctx.fillText(line, vx, ry + s(3) + li * lineH);
    });

    rsY += rowH;
  });

  // Footer: Class + Sign
  const ftY = rsY + s(2);
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = s(1);
  ctx.beginPath(); ctx.moveTo(lx2, ftY); ctx.lineTo(CW - lx2, ftY); ctx.stroke();

  ctx.font = `800 ${s(10)}px Arial`; ctx.fillStyle = '#111827';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(`Class : ${student.class || '—'}`, lx2, ftY + s(14));

  if (signImg) {
    const sh = s(22), sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - lx2, sy = ftY + s(3);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = '#374151'; ctx.lineWidth = s(1);
    ctx.beginPath(); ctx.moveTo(sx, sy + sh + s(1)); ctx.lineTo(sx + sw, sy + sh + s(1)); ctx.stroke();
    ctx.font = `600 ${s(7)}px Arial`; ctx.fillStyle = '#374151';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal Sign.', sx + sw/2, sy + sh + s(2));
  }

  // Bottom note
  const noteY = CH - noteH;
  ctx.fillStyle = color; ctx.fillRect(0, noteY, CW, noteH);
  ctx.font = `500 ${s(5.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`If found, please return to school  •  Ph: ${settings.contactNumber || '—'}`, CW/2, noteY + noteH/2);

  ctx.restore();
};

// ════════════════════════════════════════════════════════════════════════════
// TEACHER CARD
// ════════════════════════════════════════════════════════════════════════════
const drawTeacherCard = async (canvas, teacher, settings, assets) => {
  const { logoImg, signImg, photoImg } = assets;

  const hdrH   = s(72);
  const photoW = s(96), photoH = s(106);
  const nameH  = s(18);
  const uidH   = s(14);
  const lx2    = s(12), vx = lx2 + s(58), valMaxW = CW - vx - lx2;
  const baseRH = s(15);
  const lineH  = s(9);
  const signH  = s(36);  // sign area
  const stripH = s(20);  // red bottom strip

  // Pre-measure rows
  const tmp = document.createElement('canvas');
  tmp.width = CW; tmp.height = 10;
  const mctx = tmp.getContext('2d');

  const rows = [
    ['Designation', teacher.designation || 'Teacher'],
    ['Phone',       teacher.phone || '—'],
    ['Address',     teacher.address || '—'],
  ];

  mctx.font = `500 ${s(7)}px Arial`;
  const rowHeights = rows.map(([, val]) => {
    const lines = wrapText(mctx, val, valMaxW);
    return lines.length > 1 ? lines.length * lineH + s(4) : baseRH;
  });
  const totalRowsH = rowHeights.reduce((a, b) => a + b, 0);

  const photoY   = hdrH + s(8);
  const nameY    = photoY + photoH + s(5);
  const uidY     = nameY + nameH;
  const rsYStart = uidY + uidH + s(5);
  const CH = rsYStart + totalRowsH + s(4) + signH + stripH;

  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  ctx.save();
  roundRect(ctx, 0, 0, CW, CH, s(12));
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // Header
  const hg = ctx.createLinearGradient(0, 0, 0, hdrH);
  hg.addColorStop(0, '#8b1a1a'); hg.addColorStop(1, '#a52020');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, CW, hdrH);

  const logoSz = s(52), lx = s(10), ly = (hdrH - logoSz) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(lx + logoSz/2, ly + logoSz/2, logoSz/2, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = s(2); ctx.stroke(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, lx, ly, logoSz, logoSz);
  else { ctx.fillStyle = '#fff'; ctx.fillRect(lx, ly, logoSz, logoSz); }
  ctx.restore();

  const tx = lx + logoSz + s(8), tw = CW - tx - s(8);
  const tyStart = ly + s(4);
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = `900 ${s(12.5)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(ellipseText(ctx, settings.schoolName || 'D V Convent School', tw), tx + tw/2, tyStart);
  ctx.font = `400 ${s(6.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('(Govt. Recognised)', tx + tw/2, tyStart + s(16));
  ctx.font = `400 ${s(6.5)}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText(ellipseText(ctx, settings.schoolAddress || 'Akodha, Rohi, Bhadohi - 221308', tw), tx + tw/2, tyStart + s(26));
  ctx.font = `800 ${s(7)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(`Phone No.: ${settings.contactNumber || '—'}`, tx + tw/2, tyStart + s(37));

  // White body
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, hdrH, CW, CH - hdrH);

  // Photo
  const photoX = (CW - photoW) / 2;
  ctx.strokeStyle = '#8b1a1a'; ctx.lineWidth = s(2.5);
  ctx.strokeRect(photoX, photoY, photoW, photoH);
  ctx.save();
  ctx.beginPath(); ctx.rect(photoX, photoY, photoW, photoH); ctx.clip();
  if (photoImg) {
    ctx.drawImage(photoImg, photoX, photoY, photoW, photoH);
  } else {
    ctx.fillStyle = '#f5e0e0'; ctx.fillRect(photoX, photoY, photoW, photoH);
    ctx.font = `900 ${s(40)}px Arial`; ctx.fillStyle = '#8b1a1a';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((teacher.name || '?').charAt(0).toUpperCase(), photoX + photoW/2, photoY + photoH/2);
  }
  ctx.restore();

  // Name
  ctx.font = `900 ${s(13)}px Arial`; ctx.fillStyle = '#111827';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText(ellipseText(ctx, teacher.name || '', CW - s(20)), CW/2, nameY);

  // Emp ID pill
  const uidTxt = `ID: ${teacher.employeeCode || '—'}`;
  ctx.font = `800 ${s(7.5)}px Arial`;
  const uidW = ctx.measureText(uidTxt).width + s(24);
  const uidX = (CW - uidW) / 2;
  roundRect(ctx, uidX, uidY, uidW, uidH, s(7));
  ctx.fillStyle = '#8b1a1a'; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(uidTxt, CW/2, uidY + uidH/2);

  // Info rows
  let rsY = rsYStart;
  ctx.strokeStyle = '#f0e0e0'; ctx.lineWidth = s(1);
  ctx.beginPath(); ctx.moveTo(lx2, rsY); ctx.lineTo(CW - lx2, rsY); ctx.stroke();

  rows.forEach(([lbl, val], i) => {
    const ry   = rsY;
    const rowH = rowHeights[i];

    ctx.font = `700 ${s(7)}px Arial`; ctx.fillStyle = '#8b1a1a';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`${lbl}:`, lx2, ry + rowH / 2);

    ctx.font = `500 ${s(7)}px Arial`; ctx.fillStyle = '#111827';
    ctx.textBaseline = 'top';
    const lines = wrapText(ctx, val, valMaxW);
    lines.forEach((line, li) => {
      ctx.fillText(line, vx, ry + s(3) + li * lineH);
    });

    ctx.strokeStyle = '#f5e0e0'; ctx.lineWidth = s(1);
    ctx.beginPath(); ctx.moveTo(lx2, ry + rowH); ctx.lineTo(CW - lx2, ry + rowH); ctx.stroke();
    rsY += rowH;
  });

  // Principal Sign
  const ftY = rsY + s(4);
  ctx.strokeStyle = '#f0e0e0'; ctx.lineWidth = s(1);
  ctx.beginPath(); ctx.moveTo(lx2, ftY); ctx.lineTo(CW - lx2, ftY); ctx.stroke();
  if (signImg) {
    const sh = s(22), sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - lx2, sy = ftY + s(4);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    ctx.strokeStyle = '#374151'; ctx.lineWidth = s(1);
    ctx.beginPath(); ctx.moveTo(sx, sy + sh + s(1)); ctx.lineTo(sx + sw, sy + sh + s(1)); ctx.stroke();
    ctx.font = `600 ${s(7)}px Arial`; ctx.fillStyle = '#374151';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal Sign.', sx + sw/2, sy + sh + s(2));
  }

  // Red bottom strip
  const stY = CH - stripH;
  ctx.fillStyle = '#8b1a1a'; ctx.fillRect(0, stY, CW, stripH);
  ctx.font = `900 ${s(11)}px Arial`; ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('STAFF ID CARD', CW/2, stY + stripH/2);

  ctx.restore();
};

// ─── Internals ────────────────────────────────────────────────────────────────
const itemToBlob = async (item, type, settings, sharedAssets, studentColor = '#1565c0') => {
  // Resolve profile image URL — Cloudinary images are full https:// URLs
  const resolvePhoto = (profileImage) => {
    if (!profileImage) return null;
    if (profileImage.startsWith('data:')) return profileImage;
    if (profileImage.startsWith('http')) return profileImage;
    const apiBase = import.meta.env?.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${apiBase}${profileImage}`;
  };
  const photoSrc = resolvePhoto(item.profileImage);
  const photoImg = await loadImage(photoSrc);
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

export const downloadCards = async (items, type, settings, schoolLogoSrc, signImageSrc, onProgress, studentColor = '#1565c0') => {
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
    folder.file(`${label}-card-${String(i + 1).padStart(3, '0')}.png`, await itemToBlob(items[i], type, settings, shared, studentColor));
  }
  onProgress?.(items.length, items.length);
  triggerDownload(await zip.generateAsync({ type: 'blob' }), `${label}-id-cards.zip`);
};