import JSZip from 'jszip';

// Exact 57 × 87 mm @ 300 DPI
const MM = 300 / 25.4;
const CW = Math.round(57 * MM);  // 673px
const CH = Math.round(87 * MM);  // 1028px
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

const rrect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
};

const cropDraw = (ctx, img, x, y, w, h) => {
  ctx.save(); rrect(ctx, x, y, w, h, p(1)); ctx.clip();
  const ia = img.width/img.height, ba = w/h;
  let sx, sy, sw, sh;
  if (ia > ba) { sh=img.height; sw=sh*ba; sx=(img.width-sw)/2; sy=0; }
  else         { sw=img.width;  sh=sw/ba; sx=0; sy=0; }
  ctx.drawImage(img, sx,sy,sw,sh, x,y,w,h);
  ctx.restore();
};

// ══════════════════════════════════════════════════════════════════════════
// SECTION HEIGHTS (mm) — must total 87mm exactly
//  ribbon  =  8
//  header  = 26   ← bigger so 1-line name + all info fits
//  photo   = 30   ← photo 22×26 + name + pill
//  info    = 14   ← 5 rows
//  footer  =  9
//  TOTAL   = 87 ✓
// ══════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, gold, label, name, idLine, rows } = opts;

  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  const RH = p(8);   // ribbon
  const HH = p(26);  // header
  const PH = p(30);  // photo zone
  const FH = p(9);   // footer
  const IH = CH - RH - HH - PH - FH; // info  ≈ p(14)

  const HY  = RH;
  const PZY = RH + HH;
  const IY  = PZY + PH;
  const FTY = CH - FH;

  // ── BASE ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#f4f6fb'; ctx.fillRect(0,0,CW,CH);

  // ── 1. RIBBON ──────────────────────────────────────────────────────────
  const rg = ctx.createLinearGradient(0,0,0,RH);
  rg.addColorStop(0, color+'28'); rg.addColorStop(1, '#f4f6fb');
  ctx.fillStyle = rg; ctx.fillRect(0,0,CW,RH);

  // metallic hole
  const hx=CW/2, hy=RH/2, hr=p(2.4);
  const mg = ctx.createRadialGradient(hx-p(0.5),hy-p(0.5),p(0.3), hx,hy,hr+p(1.2));
  mg.addColorStop(0,'#fef3c0'); mg.addColorStop(0.45,gold); mg.addColorStop(1,'#78500a');
  ctx.beginPath(); ctx.arc(hx,hy,hr+p(1.2),0,Math.PI*2); ctx.fillStyle=mg; ctx.fill();
  ctx.beginPath(); ctx.arc(hx,hy,hr,0,Math.PI*2);
  const ig = ctx.createRadialGradient(hx,hy,p(0.4),hx,hy,hr);
  ig.addColorStop(0,'#b8bdd0'); ig.addColorStop(1,'#d4d8ea');
  ctx.fillStyle=ig; ctx.fill();

  // ── 2. HEADER ──────────────────────────────────────────────────────────
  // gradient fill
  const hg = ctx.createLinearGradient(0,HY,CW,HY+HH);
  hg.addColorStop(0, color); hg.addColorStop(1, color+'cc');
  ctx.fillStyle=hg; ctx.fillRect(0,HY,CW,HH);

  // subtle diagonal pattern
  ctx.save(); ctx.beginPath(); ctx.rect(0,HY,CW,HH); ctx.clip();
  ctx.strokeStyle=gold+'1e'; ctx.lineWidth=p(0.4);
  for(let xi=-CW; xi<CW*2; xi+=p(8)){
    ctx.beginPath(); ctx.moveTo(xi,HY); ctx.lineTo(xi+p(14),HY+HH); ctx.stroke();
  }
  ctx.restore();

  // gold border lines
  const gbg = ctx.createLinearGradient(0,0,CW,0);
  gbg.addColorStop(0,'transparent'); gbg.addColorStop(0.12,gold);
  gbg.addColorStop(0.88,gold); gbg.addColorStop(1,'transparent');
  ctx.fillStyle=gbg;
  ctx.fillRect(0,HY,CW,p(0.8));
  ctx.fillRect(0,HY+HH-p(0.8),CW,p(0.8));

  // LOGO — with gold ring
  const LSZ=p(14), LX=p(3.5), LY=HY+(HH-LSZ)/2;
  ctx.save();
  ctx.shadowColor=gold+'88'; ctx.shadowBlur=p(2);
  ctx.beginPath(); ctx.arc(LX+LSZ/2,LY+LSZ/2,LSZ/2+p(1.4),0,Math.PI*2);
  const lgr=ctx.createLinearGradient(LX,LY,LX+LSZ,LY+LSZ);
  lgr.addColorStop(0,'#fef3c0'); lgr.addColorStop(0.4,gold); lgr.addColorStop(1,'#78500a');
  ctx.fillStyle=lgr; ctx.fill(); ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(LX+LSZ/2,LY+LSZ/2,LSZ/2,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill(); ctx.clip();
  if(logoImg) ctx.drawImage(logoImg,LX,LY,LSZ,LSZ);
  ctx.restore();

  // school name — single line, ellipsis
  const TX=LX+LSZ+p(3), TW=CW-TX-p(2.5);
  ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.font=`900 ${p(4.2)}px Arial`; ctx.fillStyle='#fff';
  ctx.fillText(ell(ctx, settings.schoolName||'D V Convent School', TW), TX, HY+p(3));

  // gold divider
  const GDY=HY+p(10);
  ctx.fillStyle=gold+'cc';
  ctx.fillRect(TX,GDY,TW*0.72,p(0.7));

  // address — single line ellipsis
  ctx.font=`400 ${p(2.7)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.fillText(ell(ctx, settings.schoolAddress||'Akodha, Rohi, Bhadohi', TW), TX, GDY+p(1.8));

  // phone
  ctx.font=`700 ${p(2.9)}px Arial`; ctx.fillStyle=gold+'ee';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, TX, GDY+p(6));

  // badge
  ctx.font=`800 ${p(2.5)}px Arial`;
  const BW=ctx.measureText(label).width+p(5), BH=p(5);
  const BX=TX, BY=GDY+p(10.5);
  rrect(ctx,BX,BY,BW,BH,p(2.5));
  const bbg=ctx.createLinearGradient(BX,BY,BX+BW,BY);
  bbg.addColorStop(0,gold); bbg.addColorStop(1,'#f5d050');
  ctx.fillStyle=bbg; ctx.fill();
  ctx.fillStyle=color; ctx.textBaseline='middle';
  ctx.fillText(label, BX+p(2.5), BY+BH/2);

  // ── 3. PHOTO ZONE ──────────────────────────────────────────────────────
  const pzbg=ctx.createLinearGradient(0,PZY,0,PZY+PH);
  pzbg.addColorStop(0,'#edf0f8'); pzbg.addColorStop(0.5,'#f8f9ff'); pzbg.addColorStop(1,'#fff');
  ctx.fillStyle=pzbg; ctx.fillRect(0,PZY,CW,PH);

  // photo dimensions — 3:4 portrait, compact
  const PW2=p(20), PHGT=p(24);
  const PX=(CW-PW2)/2, PY=PZY+p(2);

  // gold frame
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.2)'; ctx.shadowBlur=p(3); ctx.shadowOffsetY=p(1.5);
  rrect(ctx,PX-p(1.8),PY-p(1.8),PW2+p(3.6),PHGT+p(3.6),p(2.2));
  const pfg=ctx.createLinearGradient(PX,PY,PX+PW2,PY+PHGT);
  pfg.addColorStop(0,'#fef3c0'); pfg.addColorStop(0.3,gold);
  pfg.addColorStop(0.65,'#fef0a0'); pfg.addColorStop(1,'#78500a');
  ctx.fillStyle=pfg; ctx.fill(); ctx.restore();

  // photo or placeholder
  if(photoImg){
    cropDraw(ctx,photoImg,PX,PY,PW2,PHGT);
  } else {
    ctx.save(); rrect(ctx,PX,PY,PW2,PHGT,p(1)); ctx.clip();
    ctx.fillStyle=color+'18'; ctx.fillRect(PX,PY,PW2,PHGT);
    ctx.font=`900 ${p(10)}px Arial`; ctx.fillStyle=color+'50';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText((name||'?').charAt(0).toUpperCase(), PX+PW2/2, PY+PHGT/2);
    ctx.restore();
  }

  // name below photo — auto-shrink font
  const NY=PY+PHGT+p(2);
  let nfs=p(3.6);
  ctx.font=`900 ${nfs}px Arial`;
  while(ctx.measureText(name||'').width>CW-p(8) && nfs>p(2.4)){
    nfs--; ctx.font=`900 ${nfs}px Arial`;
  }
  ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText(name||'', CW/2, NY);

  // UID pill
  const PILLY=NY+nfs+p(1.5);
  ctx.font=`700 ${p(2.6)}px Arial`;
  const PLW=ctx.measureText(idLine).width+p(8), PLH=p(4.8);
  const PLX=(CW-PLW)/2;
  rrect(ctx,PLX,PILLY,PLW,PLH,PLH/2);
  const plg=ctx.createLinearGradient(PLX,PILLY,PLX+PLW,PILLY);
  plg.addColorStop(0,color); plg.addColorStop(1,color+'aa');
  ctx.fillStyle=plg; ctx.fill();
  rrect(ctx,PLX,PILLY,PLW,PLH,PLH/2);
  ctx.strokeStyle=gold+'66'; ctx.lineWidth=p(0.5); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(idLine, CW/2, PILLY+PLH/2);

  // ── 4. INFO ────────────────────────────────────────────────────────────
  ctx.fillStyle='#fff'; ctx.fillRect(0,IY,CW,IH);
  ctx.fillStyle=gbg; ctx.fillRect(0,IY,CW,p(0.7)); // gold top line

  const LXI=p(3.5), VX=p(20), VW=CW-VX-p(3);
  const ROWH=p(2.8), LNH=p(3.2);
  // measure wrapping
  const tc=document.createElement('canvas'); tc.width=CW; tc.height=10;
  const mc=tc.getContext('2d'); mc.font=`500 ${p(2.5)}px Arial`;

  let ry=IY+p(1);
  rows.forEach(([lbl,val],i)=>{
    const lns=wrapText(mc,val,VW);
    const rh=lns.length>1 ? lns.length*LNH+p(1.5) : ROWH+p(1.8);
    if(i%2===0){ ctx.fillStyle=color+'07'; ctx.fillRect(0,ry,CW,rh); }
    // accent bar
    const ab=ctx.createLinearGradient(0,ry,0,ry+rh);
    ab.addColorStop(0,color+'cc'); ab.addColorStop(1,color+'33');
    ctx.fillStyle=ab; ctx.fillRect(LXI-p(1.2),ry+p(0.6),p(0.9),rh-p(1.2));
    // label
    ctx.font=`700 ${p(2.5)}px Arial`; ctx.fillStyle=color;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(lbl,LXI,ry+rh/2);
    // colon
    ctx.font=`400 ${p(2.5)}px Arial`; ctx.fillStyle='#9ca3af';
    ctx.fillText(':',VX-p(3.5),ry+rh/2);
    // value
    ctx.font=`500 ${p(2.5)}px Arial`; ctx.fillStyle='#111827';
    ctx.textBaseline='top';
    lns.forEach((ln,li)=>ctx.fillText(ln,VX,ry+p(0.9)+li*LNH));
    // divider
    ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(0,ry+rh); ctx.lineTo(CW,ry+rh); ctx.stroke();
    ry+=rh;
  });

  // ── 5. FOOTER ──────────────────────────────────────────────────────────
  const ftg=ctx.createLinearGradient(0,FTY,CW,FTY);
  ftg.addColorStop(0,color+'f5'); ftg.addColorStop(1,color);
  ctx.fillStyle=ftg; ctx.fillRect(0,FTY,CW,FH);
  ctx.fillStyle=gbg; ctx.fillRect(0,FTY,CW,p(0.7));

  ctx.font=`700 ${p(2.6)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.92)';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(`📞 ${settings.contactNumber||'—'}`,p(4),FTY+FH/2);

  if(signImg){
    const sh=Math.min(p(6.5),FH-p(1.5));
    const sw=sh*(signImg.width/signImg.height);
    const sx=CW-sw-p(4), sy=FTY+(FH-sh)/2;
    ctx.drawImage(signImg,sx,sy,sw,sh);
    ctx.strokeStyle=gold+'88'; ctx.lineWidth=p(0.4);
    ctx.beginPath(); ctx.moveTo(sx,sy+sh+p(0.6)); ctx.lineTo(sx+sw,sy+sh+p(0.6)); ctx.stroke();
  }
  ctx.font=`700 ${p(2.5)}px Arial`; ctx.fillStyle=gold+'ee';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  ctx.fillText('Principal',CW-p(4),FTY+FH/2);
};

// Student
const drawStudent = async (canvas,student,settings,assets,color='#1a3a6b') => {
  await drawCard(canvas,settings,assets,{
    color, gold:'#c9a94a',
    label:'STUDENT ID CARD',
    name:student.name||'',
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

// Teacher
const drawTeacher = async (canvas,teacher,settings,assets) => {
  await drawCard(canvas,settings,assets,{
    color:'#7b1d1d', gold:'#c9a94a',
    label:'STAFF ID CARD',
    name:teacher.name||'',
    idLine:`ID : ${teacher.employeeCode||'—'}`,
    rows:[
      ['Name',   teacher.name||'—'],
      ['Desig.', teacher.designation||'Teacher'],
      ['Phone',  teacher.phone||'—'],
      ['Addr.',  teacher.address||'—'],
    ],
  });
};

const rp = (pp) => {
  if(!pp) return null;
  if(pp.startsWith('data:')||pp.startsWith('http')) return pp;
  return `${import.meta.env?.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${pp}`;
};

const toBlob=(item,type,settings,shared,sc)=>new Promise(async(res,rej)=>{
  const photoImg=await loadImg(rp(item.profileImage));
  const canvas=document.createElement('canvas');
  if(type==='student') await drawStudent(canvas,item,settings,{...shared,photoImg},sc);
  else await drawTeacher(canvas,item,settings,{...shared,photoImg});
  canvas.toBlob(b=>b?res(b):rej(new Error('toBlob failed')),'image/png',1.0);
});

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
    onProgress?.(0,1); dl(await toBlob(items[0],type,settings,shared,sc),`${label}-id-card.png`);
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
