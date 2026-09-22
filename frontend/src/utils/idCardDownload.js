import JSZip from 'jszip';

// ── Exact 57 × 87 mm @ 300 DPI ────────────────────────────────────────────
const MM = 300 / 25.4;
const CW = Math.round(57 * MM);   // 673 px
const CH = Math.round(87 * MM);   // 1028 px
const p  = (mm) => Math.round(mm * MM);

const loadImg = (src) => new Promise((res) => {
  if (!src) return res(null);
  const i = new Image(); i.crossOrigin = 'anonymous';
  i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

const ellipsis = (ctx, txt, maxW) => {
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

const rrect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
};

const drawCroppedImg = (ctx, img, x, y, w, h) => {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const ia = img.width / img.height, ba = w / h;
  let sx, sy, sw, sh;
  if (ia > ba) { sh = img.height; sw = sh*ba; sx = (img.width-sw)/2; sy = 0; }
  else         { sw = img.width;  sh = sw/ba; sx = 0; sy = 0; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
};

// ══════════════════════════════════════════════════════════════════════════
// PREMIUM CARD
// Sections (mm):  ribbon=8 | header=22 | photo=28 | info=20 | footer=9
// Total = 87mm ✓
// ══════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, gold, label, name, idLine, rows } = opts;

  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // Section heights
  const rH = p(8);   // ribbon
  const hH = p(22);  // header
  const pzH= p(28);  // photo zone
  const fH = p(9);   // footer
  const iH = CH - rH - hH - pzH - fH; // info  ≈ p(20)

  const hY  = rH;
  const pzY = rH + hH;
  const iY  = pzY + pzH;
  const ftY = CH - fH;

  // ── base white ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#f8f9ff'; ctx.fillRect(0, 0, CW, CH);

  // ── 1. RIBBON ────────────────────────────────────────────────────────────
  const rg = ctx.createLinearGradient(0,0,0,rH);
  rg.addColorStop(0, color+'20'); rg.addColorStop(1, '#ffffff');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, CW, rH);

  // metallic hole
  const hx = CW/2, hy = rH/2, hr = p(2.3);
  const mg = ctx.createRadialGradient(hx-p(0.4),hy-p(0.4),p(0.3), hx,hy,hr+p(1));
  mg.addColorStop(0,'#f0e0a0'); mg.addColorStop(0.5, gold); mg.addColorStop(1,'#8a6820');
  ctx.beginPath(); ctx.arc(hx,hy,hr+p(1),0,Math.PI*2); ctx.fillStyle=mg; ctx.fill();
  ctx.beginPath(); ctx.arc(hx,hy,hr,0,Math.PI*2);
  ctx.fillStyle='#cdd0e0'; ctx.fill();
  const ig = ctx.createRadialGradient(hx,hy,p(0.5),hx,hy,hr);
  ig.addColorStop(0,'rgba(0,0,0,0.2)'); ig.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(hx,hy,hr,0,Math.PI*2); ctx.fillStyle=ig; ctx.fill();

  // ── 2. HEADER ────────────────────────────────────────────────────────────
  const hg2 = ctx.createLinearGradient(0,hY,CW,hY+hH);
  hg2.addColorStop(0, color); hg2.addColorStop(1, color+'cc');
  ctx.fillStyle = hg2; ctx.fillRect(0, hY, CW, hH);

  // diagonal grid overlay
  ctx.save(); ctx.beginPath(); ctx.rect(0,hY,CW,hH); ctx.clip();
  ctx.strokeStyle = gold+'22'; ctx.lineWidth = p(0.35);
  for (let xi = -CW; xi < CW*2; xi += p(7)) {
    ctx.beginPath(); ctx.moveTo(xi,hY); ctx.lineTo(xi+p(12),hY+hH); ctx.stroke();
  }
  ctx.restore();

  // gold border lines top/bottom
  const gb = ctx.createLinearGradient(0,0,CW,0);
  gb.addColorStop(0,'transparent'); gb.addColorStop(0.15,gold);
  gb.addColorStop(0.85,gold); gb.addColorStop(1,'transparent');
  ctx.fillStyle = gb;
  ctx.fillRect(0, hY, CW, p(0.7));
  ctx.fillRect(0, hY+hH-p(0.7), CW, p(0.7));

  // LOGO — smaller so text has space
  const lsz = p(11), lx = p(3), ly = hY + (hH-lsz)/2;
  // gold ring
  ctx.save();
  ctx.shadowColor = gold+'99'; ctx.shadowBlur = p(1.5);
  ctx.beginPath(); ctx.arc(lx+lsz/2, ly+lsz/2, lsz/2+p(1.2), 0, Math.PI*2);
  const lgr = ctx.createLinearGradient(lx,ly,lx+lsz,ly+lsz);
  lgr.addColorStop(0,'#f0e0a0'); lgr.addColorStop(0.4,gold); lgr.addColorStop(1,'#8a6820');
  ctx.fillStyle = lgr; ctx.fill(); ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(lx+lsz/2, ly+lsz/2, lsz/2, 0, Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill(); ctx.clip();
  if (logoImg) ctx.drawImage(logoImg, lx, ly, lsz, lsz);
  ctx.restore();

  // Text next to logo — more width now
  const tx = lx+lsz+p(2.5), tw = CW-tx-p(2.5);
  ctx.textAlign='left'; ctx.textBaseline='top';

  // School name — wrap into 2 lines if needed
  ctx.font = `900 ${p(3.8)}px Arial`; ctx.fillStyle='#fff';
  const snLines = wrapText(ctx, settings.schoolName||'D V Convent School', tw);
  snLines.slice(0,2).forEach((ln,i) => ctx.fillText(ln, tx, hY+p(2)+i*p(4.5)));

  // gold divider
  const gdivY = hY + p(2) + Math.min(snLines.length,2)*p(4.5) + p(1);
  ctx.fillStyle = gold+'cc';
  ctx.fillRect(tx, gdivY, tw*0.75, p(0.5));

  // address (1 line, ellipsis)
  ctx.font = `400 ${p(2.6)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.78)';
  ctx.fillText(ellipsis(ctx, settings.schoolAddress||'Akodha, Rohi, Bhadohi', tw), tx, gdivY+p(1.5));

  // phone
  ctx.font = `700 ${p(2.7)}px Arial`; ctx.fillStyle = gold+'ee';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, tx, gdivY+p(5.5));

  // card label badge
  ctx.font = `800 ${p(2.4)}px Arial`;
  const bw = ctx.measureText(label).width + p(4);
  rrect(ctx, tx, gdivY+p(9.5), bw, p(4.5), p(2));
  const bg2 = ctx.createLinearGradient(tx,0,tx+bw,0);
  bg2.addColorStop(0,gold); bg2.addColorStop(1,'#f0d060');
  ctx.fillStyle=bg2; ctx.fill();
  ctx.fillStyle=color; ctx.textBaseline='middle';
  ctx.fillText(label, tx+p(2), gdivY+p(9.5)+p(2.25));

  // ── 3. PHOTO ZONE ────────────────────────────────────────────────────────
  const pzbg = ctx.createLinearGradient(0,pzY,0,pzY+pzH);
  pzbg.addColorStop(0,'#eef0f8'); pzbg.addColorStop(1,'#ffffff');
  ctx.fillStyle=pzbg; ctx.fillRect(0,pzY,CW,pzH);

  // photo dimensions — portrait 3:4 ratio
  const photoW = p(20), photoH = p(24);
  const photoX = (CW-photoW)/2, photoY = pzY+p(2);

  if (photoImg) {
    // gold frame
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.22)'; ctx.shadowBlur=p(2.5); ctx.shadowOffsetY=p(1);
    rrect(ctx,photoX-p(1.5),photoY-p(1.5),photoW+p(3),photoH+p(3),p(1.8));
    const fg = ctx.createLinearGradient(photoX,photoY,photoX+photoW,photoY+photoH);
    fg.addColorStop(0,'#f0e0a0'); fg.addColorStop(0.3,gold);
    fg.addColorStop(0.6,'#f5e8a0'); fg.addColorStop(1,'#8a6820');
    ctx.fillStyle=fg; ctx.fill(); ctx.restore();
    // photo
    ctx.save(); rrect(ctx,photoX,photoY,photoW,photoH,p(0.8)); ctx.clip();
    drawCroppedImg(ctx,photoImg,photoX,photoY,photoW,photoH);
    ctx.restore();
  } else {
    // no photo — show placeholder cleanly
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,0.15)'; ctx.shadowBlur=p(2);
    rrect(ctx,photoX-p(1.5),photoY-p(1.5),photoW+p(3),photoH+p(3),p(1.8));
    ctx.fillStyle=color+'22'; ctx.fill(); ctx.restore();
    rrect(ctx,photoX,photoY,photoW,photoH,p(0.8));
    ctx.fillStyle=color+'15'; ctx.fill();
    ctx.font=`900 ${p(10)}px Arial`; ctx.fillStyle=color+'55';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText((name||'?').charAt(0).toUpperCase(), photoX+photoW/2, photoY+photoH/2);
  }

  // Name below photo — auto font-size to fit
  const nameY2 = photoY + photoH + p(2.5);
  let nameFontSize = p(3.8);
  ctx.font = `900 ${nameFontSize}px Arial`;
  while (ctx.measureText(name||'').width > CW - p(8) && nameFontSize > p(2.5)) {
    nameFontSize -= 1;
    ctx.font = `900 ${nameFontSize}px Arial`;
  }
  ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText(name||'', CW/2, nameY2);

  // UID pill
  const pidTxt = idLine;
  ctx.font=`700 ${p(2.5)}px Arial`;
  const pw2=ctx.measureText(pidTxt).width+p(7), ph2=p(4.5);
  const px2=(CW-pw2)/2, py2=nameY2+nameFontSize/p(1)+p(2);
  rrect(ctx,px2,py2,pw2,ph2,ph2/2);
  const pg2=ctx.createLinearGradient(px2,py2,px2+pw2,py2);
  pg2.addColorStop(0,color); pg2.addColorStop(1,color+'bb');
  ctx.fillStyle=pg2; ctx.fill();
  rrect(ctx,px2,py2,pw2,ph2,ph2/2);
  ctx.strokeStyle=gold+'77'; ctx.lineWidth=p(0.4); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(pidTxt, CW/2, py2+ph2/2);

  // ── 4. INFO ──────────────────────────────────────────────────────────────
  ctx.fillStyle='#fff'; ctx.fillRect(0,iY,CW,iH);
  // gold top line
  ctx.fillStyle=gb; ctx.fillRect(0,iY,CW,p(0.6));

  const lxI=p(4), vxI=p(22), valW=CW-vxI-p(3);
  const baseRH=p(4.8), lnH=p(3.3);
  const tmpC=document.createElement('canvas'); tmpC.width=CW; tmpC.height=10;
  const mc=tmpC.getContext('2d'); mc.font=`500 ${p(2.6)}px Arial`;

  let ry=iY+p(1.2);
  rows.forEach(([lbl,val],i)=>{
    const lines=wrapText(mc,val,valW);
    const rh=lines.length>1?lines.length*lnH+p(2):baseRH;
    if(i%2===0){ ctx.fillStyle=color+'07'; ctx.fillRect(0,ry,CW,rh); }
    // accent bar
    const ab=ctx.createLinearGradient(0,ry,0,ry+rh);
    ab.addColorStop(0,color+'cc'); ab.addColorStop(1,color+'33');
    ctx.fillStyle=ab; ctx.fillRect(lxI-p(1.5),ry+p(0.8),p(0.8),rh-p(1.6));
    // label
    ctx.font=`700 ${p(2.6)}px Arial`; ctx.fillStyle=color;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(lbl,lxI,ry+rh/2);
    // colon
    ctx.font=`400 ${p(2.6)}px Arial`; ctx.fillStyle='#9ca3af';
    ctx.fillText(':',vxI-p(3.5),ry+rh/2);
    // value
    ctx.font=`500 ${p(2.6)}px Arial`; ctx.fillStyle='#111827';
    ctx.textBaseline='top';
    lines.forEach((ln,li)=>ctx.fillText(ln,vxI,ry+p(1)+li*lnH));
    ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(0,ry+rh); ctx.lineTo(CW,ry+rh); ctx.stroke();
    ry+=rh;
  });

  // ── 5. FOOTER ────────────────────────────────────────────────────────────
  const ftg=ctx.createLinearGradient(0,ftY,CW,ftY);
  ftg.addColorStop(0,color+'f2'); ftg.addColorStop(1,color);
  ctx.fillStyle=ftg; ctx.fillRect(0,ftY,CW,fH);
  ctx.fillStyle=gb; ctx.fillRect(0,ftY,CW,p(0.6));

  // phone
  ctx.font=`700 ${p(2.5)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(`📞 ${settings.contactNumber||'—'}`, p(4), ftY+fH/2);

  // sign
  if(signImg){
    const sh=Math.min(p(6.5),fH-p(1.5));
    const sw=sh*(signImg.width/signImg.height);
    const sx=CW-sw-p(4), sy=ftY+(fH-sh)/2;
    ctx.drawImage(signImg,sx,sy,sw,sh);
    ctx.strokeStyle=gold+'99'; ctx.lineWidth=p(0.4);
    ctx.beginPath(); ctx.moveTo(sx,sy+sh+p(0.5)); ctx.lineTo(sx+sw,sy+sh+p(0.5)); ctx.stroke();
  }
  ctx.font=`700 ${p(2.4)}px Arial`; ctx.fillStyle=gold+'ee';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  ctx.fillText('Principal',CW-p(4),ftY+fH/2);
};

// ── Student ────────────────────────────────────────────────────────────────
const drawStudent = async (canvas, student, settings, assets, color='#1a3a6b') => {
  await drawCard(canvas, settings, assets, {
    color, gold:'#c9a94a',
    label:'STUDENT ID CARD',
    name: student.name||'',
    idLine:`UID : ${student.UID||'—'}`,
    rows:[
      ['Name',   student.name||'—'],
      ['F/Name', student.fatherName||'—'],
      ['Class',  `Class ${student.class||'—'}`],
      ['D.O.B',  fmtDate(student.dateOfBirth)],
      ['Address',student.address||'—'],
    ],
  });
};

// ── Teacher ────────────────────────────────────────────────────────────────
const drawTeacher = async (canvas, teacher, settings, assets) => {
  await drawCard(canvas, settings, assets, {
    color:'#7b1d1d', gold:'#c9a94a',
    label:'STAFF ID CARD',
    name: teacher.name||'',
    idLine:`ID : ${teacher.employeeCode||'—'}`,
    rows:[
      ['Name',   teacher.name||'—'],
      ['Desig.', teacher.designation||'Teacher'],
      ['Phone',  teacher.phone||'—'],
      ['Addr.',  teacher.address||'—'],
    ],
  });
};

// ── Pipeline ───────────────────────────────────────────────────────────────
const toBlob = async (item, type, settings, shared, sc) => {
  const rp=(pp)=>{
    if(!pp) return null;
    if(pp.startsWith('data:')||pp.startsWith('http')) return pp;
    return `${import.meta.env?.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${pp}`;
  };
  const photoImg=await loadImg(rp(item.profileImage));
  const canvas=document.createElement('canvas');
  if(type==='student') await drawStudent(canvas,item,settings,{...shared,photoImg},sc);
  else                  await drawTeacher(canvas,item,settings,{...shared,photoImg});
  return new Promise((res,rej)=>canvas.toBlob(b=>b?res(b):rej(new Error('toBlob failed')),'image/png',1.0));
};

const dl=(blob,name)=>{
  const url=URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:name}).click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
};

export const downloadCards=async(items,type,settings,logoSrc,signSrc,onProgress,sc='#1a3a6b')=>{
  if(!items?.length) throw new Error('No items');
  const label=type==='student'?'student':'teacher';
  const shared={logoImg:await loadImg(settings.schoolLogo||logoSrc),signImg:await loadImg(signSrc)};
  if(items.length===1){
    onProgress?.(0,1);
    dl(await toBlob(items[0],type,settings,shared,sc),`${label}-id-card.png`);
    onProgress?.(1,1); return;
  }
  const zip=new JSZip(), folder=zip.folder(`${label}-id-cards`);
  for(let i=0;i<items.length;i++){
    onProgress?.(i,items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`,await toBlob(items[i],type,settings,shared,sc));
  }
  onProgress?.(items.length,items.length);
  dl(await zip.generateAsync({type:'blob'}),`${label}-id-cards.zip`);
};
