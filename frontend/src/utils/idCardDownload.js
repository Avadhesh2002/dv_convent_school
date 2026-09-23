import JSZip from 'jszip';

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
  const words = String(txt).replace(/,(\S)/g,', $1').replace(/\s+/g,' ').trim().split(' ');
  const lines=[]; let line='';
  for(const w of words){
    const t=line?`${line} ${w}`:w;
    if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;
  }
  if(line)lines.push(line);
  return lines.length?lines:['—'];
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
  : '—';

const cropDraw = (ctx, img, x, y, w, h) => {
  ctx.save(); ctx.beginPath(); ctx.rect(x,y,w,h); ctx.clip();
  const ia=img.width/img.height, ba=w/h;
  let sx,sy,sw,sh;
  if(ia>ba){sh=img.height;sw=sh*ba;sx=(img.width-sw)/2;sy=0;}
  else     {sw=img.width; sh=sw/ba;sx=0;sy=0;}
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
  ctx.restore();
};

// ═══════════════════════════════════════════════════════════════
// DRAW CARD — single function used for BOTH preview and download
// Layout (mm, total=87):
//   ribbon  = 5   blue
//   header  = 19  blue — logo top-center, school name, addr, ph
//   body    = 46  white — left photo | right name+uid+rows
//   sigfoot = 9   white — class + sign
//   bottom  = 8   blue
// ═══════════════════════════════════════════════════════════════
export const drawCardToCanvas = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, personName, idLine, rows, classVal } = opts;

  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  const RH  = p(5);
  const HH  = p(19);
  const SFH = p(9);
  const BSH = p(8);
  const BY  = RH + HH;
  const BH  = CH - RH - HH - SFH - BSH;   // 46mm
  const SFY = BY + BH;
  const BTSY = SFY + SFH;

  // ── Base white ────────────────────────────────────────────
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, CW, CH);

  // ── 1. Ribbon ─────────────────────────────────────────────
  ctx.fillStyle = color; ctx.fillRect(0, 0, CW, RH);

  // ── 2. Header ─────────────────────────────────────────────
  ctx.fillStyle = '#1565c0'; ctx.fillRect(0, RH, CW, HH);

  // header layout: logo on left (vertically centered), text on right
  const LSZ = p(14);                      // logo size
  const LX  = p(3);                       // logo left margin
  const LY  = RH + (HH - LSZ) / 2;       // logo vertically centered

  // logo circle
  ctx.save();
  ctx.beginPath(); ctx.arc(LX+LSZ/2, LY+LSZ/2, LSZ/2, 0, Math.PI*2);
  ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, LX, LY, LSZ, LSZ);
  ctx.restore();

  // right text block — centered vertically
  const TX  = LX + LSZ + p(3);
  const TW  = CW - TX - p(2);
  const TY0 = RH + p(2);

  ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = '#fff';

  // school name — font size fits in 1 line
  let nfs = p(3.4);
  ctx.font = `900 ${nfs}px Arial`;
  while (ctx.measureText(settings.schoolName||'D V Convent School').width > TW && nfs > p(2.2)) {
    nfs -= 1; ctx.font = `900 ${nfs}px Arial`;
  }
  ctx.fillText(settings.schoolName||'D V Convent School', TX, TY0);

  // (Govt. Recognised) italic
  ctx.font = `italic 400 ${p(2)}px Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillText('(Govt. Recognised)', TX, TY0 + nfs + p(0.8));

  // address — 2 lines so full address shows
  ctx.font = `400 ${p(1.85)}px Arial`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const addrLines = wrapText(ctx, settings.schoolAddress||'Vill-Akodha,Post-Rohi,Dist-Bhadohi,221308', TW);
  addrLines.slice(0, 2).forEach((ln, i) =>
    ctx.fillText(ln, TX, TY0 + nfs + p(4) + i * p(2.6))
  );

  // phone — bold white (after address)
  ctx.font = `700 ${p(2.1)}px Arial`; ctx.fillStyle = '#fff';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, TX,
    TY0 + nfs + p(4) + Math.min(addrLines.length, 2) * p(2.6) + p(0.5));

  // ── 3. Body ───────────────────────────────────────────────
  ctx.fillStyle = '#fff'; ctx.fillRect(0, BY, CW, BH);

  // --- Photo LEFT, vertically centered ---
  const pad    = p(3);
  const PW2    = p(23);
  const PHGT   = Math.round(PW2 * 4 / 3);  // 3:4
  const PX     = pad;
  const PY     = BY + Math.round((BH - PHGT) / 2);

  ctx.strokeStyle = color; ctx.lineWidth = p(0.8);
  ctx.strokeRect(PX - p(0.8), PY - p(0.8), PW2 + p(1.6), PHGT + p(1.6));

  if (photoImg) {
    cropDraw(ctx, photoImg, PX, PY, PW2, PHGT);
  } else {
    ctx.fillStyle = '#dbeafe'; ctx.fillRect(PX, PY, PW2, PHGT);
    ctx.font = `900 ${p(10)}px Arial`; ctx.fillStyle = color+'55';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((personName||'?').charAt(0).toUpperCase(), PX+PW2/2, PY+PHGT/2);
  }

  // --- Right: name + UID + rows ---
  const RX  = PX + PW2 + p(3.5);
  const RW  = CW - RX - p(2);
  let   curY = BY + p(2.5);

  // name
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  let fnfs = p(3.8);
  ctx.font = `700 ${fnfs}px Arial`; ctx.fillStyle = '#111';
  while (ctx.measureText(personName||'').width > RW && fnfs > p(2.2)) {
    fnfs -= 1; ctx.font = `700 ${fnfs}px Arial`;
  }
  ctx.fillText(personName||'', RX, curY);
  curY += fnfs + p(1.8);

  // UID pill
  ctx.font = `800 ${p(2.4)}px Arial`;
  const uw = ctx.measureText(idLine).width + p(7), uh = p(4);
  const ur = uh / 2;
  ctx.beginPath();
  ctx.moveTo(RX+ur,curY); ctx.lineTo(RX+uw-ur,curY);
  ctx.quadraticCurveTo(RX+uw,curY,RX+uw,curY+ur);
  ctx.lineTo(RX+uw,curY+uh-ur); ctx.quadraticCurveTo(RX+uw,curY+uh,RX+uw-ur,curY+uh);
  ctx.lineTo(RX+ur,curY+uh); ctx.quadraticCurveTo(RX,curY+uh,RX,curY+uh-ur);
  ctx.lineTo(RX,curY+ur); ctx.quadraticCurveTo(RX,curY,RX+ur,curY); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(idLine, RX + p(3.5), curY + uh/2);
  curY += uh + p(2.5);

  // rows — label + value (value wraps if needed)
  const rowsH  = BY + BH - p(2) - curY;
  const lblSz  = p(2), valSz = p(2);
  const lblH   = lblSz + p(0.3);
  const valLH  = valSz + p(0.6);

  const tc = document.createElement('canvas'); tc.width=CW; tc.height=10;
  const mc = tc.getContext('2d'); mc.font=`400 ${valSz}px Arial`;

  const rDefs = rows.map(([lbl,val]) => {
    // Address row — max 3 lines
    const maxLines = lbl === 'Add.' ? 3 : 2;
    const lines = wrapText(mc, val, RW).slice(0, maxLines);
    return { lbl, val, lines, rh: lblH + lines.length * valLH + p(1) };
  });
  const totalH = rDefs.reduce((a,r) => a+r.rh, 0);
  const sc     = Math.min(1, rowsH / totalH);

  rDefs.forEach(({ lbl, lines, rh }, i) => {
    const ah = Math.round(rh * sc);
    if (i%2===0) { ctx.fillStyle=color+'10'; ctx.fillRect(RX-p(1), curY, RW+p(1), ah); }
    // label
    ctx.font=`700 ${lblSz}px Arial`; ctx.fillStyle=color;
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText(lbl, RX, curY + p(0.5));
    // value
    ctx.font=`400 ${valSz}px Arial`; ctx.fillStyle='#111';
    const scaledLH = valLH * sc;
    lines.forEach((ln,li) =>
      ctx.fillText(ln, RX, curY + (lblH + p(0.5)) * sc + li * scaledLH)
    );
    // divider
    ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(RX-p(1),curY+ah); ctx.lineTo(CW-p(2),curY+ah); ctx.stroke();
    curY += ah;
  });

  // ── 4. Sign footer ────────────────────────────────────────
  ctx.fillStyle = '#fff'; ctx.fillRect(0, SFY, CW, SFH);
  ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = p(0.3);
  ctx.beginPath(); ctx.moveTo(0,SFY); ctx.lineTo(CW,SFY); ctx.stroke();

  ctx.font = `900 ${p(3.4)}px Arial`; ctx.fillStyle = '#111';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  // classVal is empty string for teachers — show nothing or designation
  if (classVal) {
    ctx.fillText(`Class : ${classVal}`, p(4), SFY + SFH/2);
  }

  if (signImg) {
    const sh = Math.min(p(5), SFH - p(3.5));   // ensure space for label below
    const sw = sh * (signImg.width / signImg.height);
    const sx = CW - sw - p(4);
    const sy = SFY + p(0.8);
    ctx.drawImage(signImg, sx, sy, sw, sh);
    // underline
    ctx.strokeStyle = '#555'; ctx.lineWidth = p(0.4);
    ctx.beginPath(); ctx.moveTo(sx, sy+sh+p(0.4)); ctx.lineTo(sx+sw, sy+sh+p(0.4)); ctx.stroke();
    // label — guaranteed inside footer
    ctx.font = `400 ${p(1.9)}px Arial`; ctx.fillStyle = '#555';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Principal Sign.', sx + sw/2, sy + sh + p(0.7));
  }

  // ── 5. Bottom strip ───────────────────────────────────────
  ctx.fillStyle = color; ctx.fillRect(0, BTSY, CW, BSH);
  ctx.font = `500 ${p(2.2)}px Arial`; ctx.fillStyle = '#fff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(
    `If found, please return to school  •  Ph: ${settings.contactNumber||'—'}`,
    CW/2, BTSY + BSH/2
  );
};

// ─── Student / Teacher wrappers ───────────────────────────────
export const buildStudentOpts = (student) => {
  // Compress address: join parts with comma, fits in 2 lines
  const addr = student.address || '—';

  return {
    color:      '#1565c0',
    personName: student.name || '',
    idLine:     `UID: ${student.UID || '—'}`,
    classVal:   student.class || '—',
    rows: [
      ["Father's Name", student.fatherName  || '—'],
      ["Mother's Name", student.motherName  || '—'],
      ['D.O.B.',        fmtDate(student.dateOfBirth)],
      ['Contact No.',   student.fatherMobile || student.motherMobile || student.guardianMobile || '—'],
      ['Add.',          addr],
    ],
  };
};

export const buildTeacherOpts = (teacher) => ({
  color:      '#1565c0',
  personName: teacher.name || '',
  idLine:     `ID: ${teacher.employeeCode || '—'}`,
  classVal:   '',   // teachers ke liye "Class :" section nahi dikhana
  rows: [
    ['Designation', teacher.designation || 'Teacher'],
    ['Phone',       teacher.phone       || '—'],
    ['Address',     teacher.address     || '—'],
  ],
});

// ─── Download helpers ─────────────────────────────────────────
const rpu = (pp) => {
  if (!pp) return null;
  if (pp.startsWith('data:') || pp.startsWith('http')) return pp;
  return `${import.meta.env?.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${pp}`;
};

const toBlob = (item, type, settings, shared, sc) =>
  new Promise(async (res, rej) => {
    const photoImg = await loadImg(rpu(item.profileImage));
    const canvas   = document.createElement('canvas');
    const opts     = type === 'student'
      ? { ...buildStudentOpts(item), color: sc || '#1565c0' }
      : buildTeacherOpts(item);
    await drawCardToCanvas(canvas, settings, { ...shared, photoImg }, opts);
    canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/png', 1.0);
  });

const dl = (blob, name) => {
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const downloadCards = async (items, type, settings, logoSrc, signSrc, onProgress, sc = '#1565c0') => {
  if (!items?.length) throw new Error('No items');
  const label  = type === 'student' ? 'student' : 'teacher';
  const shared = {
    logoImg: await loadImg(settings.schoolLogo || logoSrc),
    signImg: await loadImg(signSrc),
  };
  if (items.length === 1) {
    onProgress?.(0, 1);
    dl(await toBlob(items[0], type, settings, shared, sc), `${label}-id-card.png`);
    onProgress?.(1, 1); return;
  }
  const zip = new JSZip(), folder = zip.folder(`${label}-id-cards`);
  for (let i = 0; i < items.length; i++) {
    onProgress?.(i, items.length);
    folder.file(
      `${label}-card-${String(i+1).padStart(3,'0')}.png`,
      await toBlob(items[i], type, settings, shared, sc)
    );
  }
  onProgress?.(items.length, items.length);
  dl(await zip.generateAsync({ type: 'blob' }), `${label}-id-cards.zip`);
};
