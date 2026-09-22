import JSZip from 'jszip';

// ── Exact 57 × 87 mm @ 300 DPI ────────────────────────────────────────────
const MM  = 300 / 25.4;                  // px per mm = 11.811
const CW  = Math.round(57 * MM);        // 673 px
const CH  = Math.round(87 * MM);        // 1028 px
const p   = (mm) => Math.round(mm * MM); // mm → px

// ── Image loader ───────────────────────────────────────────────────────────
const loadImg = (src) => new Promise((res) => {
  if (!src) return res(null);
  const i = new Image(); i.crossOrigin = 'anonymous';
  i.onload = () => res(i); i.onerror = () => res(null); i.src = src;
});

// ── Text helpers ───────────────────────────────────────────────────────────
const clip  = (ctx, txt, maxW) => {
  if (!txt) return '—';
  let t = String(txt);
  while (ctx.measureText(t).width > maxW && t.length > 1) t = t.slice(0, -1);
  return t.length < String(txt).length ? t.slice(0, -1) + '…' : t;
};
const wrap  = (ctx, txt, maxW) => {
  if (!txt) return ['—'];
  const ws = String(txt).replace(/,(\S)/g, ', $1').replace(/\s+/g, ' ').trim().split(' ');
  const ls = []; let l = '';
  for (const w of ws) {
    const t = l ? l + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && l) { ls.push(l); l = w; } else l = t;
  }
  if (l) ls.push(l);
  return ls.length ? ls : ['—'];
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// ── Draw cropped photo ─────────────────────────────────────────────────────
const drawPhoto = (ctx, img, x, y, w, h, fallColor, letter) => {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (img) {
    const ia = img.width/img.height, ba = w/h;
    let sx,sy,sw,sh;
    if (ia>ba){ sh=img.height; sw=sh*ba; sx=(img.width-sw)/2; sy=0; }
    else      { sw=img.width;  sh=sw/ba; sx=0; sy=0; }
    ctx.drawImage(img, sx,sy,sw,sh, x,y,w,h);
  } else {
    ctx.fillStyle=fallColor+'22'; ctx.fillRect(x,y,w,h);
    ctx.font=`900 ${p(9)}px Arial`; ctx.fillStyle=fallColor;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(letter, x+w/2, y+h/2);
  }
  ctx.restore();
};

// ── Rounded rect path ──────────────────────────────────────────────────────
const rrect = (ctx,x,y,w,h,r) => {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
};

// ══════════════════════════════════════════════════════════════════════════
// PREMIUM CARD DRAW
// Layout (top→bottom):
//  [8mm]  Ribbon space — pearl white + metallic hole
//  [26mm] Header — deep navy with gold geometry + school name + logo
//  [35mm] Photo zone — centered large photo, gold frame, name + ID pill
//  [remaining] Info section — clean rows on white
//  [9mm]  Footer — dark strip, phone + sign
// ══════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { themeColor, goldColor, cardLabel, personName, idLine, rows } = opts;

  canvas.width  = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d');

  // ─── geometry ─────────────────────────────────────────────────────────
  const ribbonH = p(8);
  const headerH = p(26);
  const photoZH = p(35);
  const footerH = p(9);
  const infoH   = CH - ribbonH - headerH - photoZH - footerH;

  const hdrY    = ribbonH;
  const pzY     = hdrY + headerH;
  const infoY   = pzY + photoZH;
  const ftY     = CH - footerH;

  // ─── 1. PEARL WHITE BASE ──────────────────────────────────────────────
  ctx.fillStyle = '#f8f9ff'; ctx.fillRect(0, 0, CW, CH);

  // ─── 2. RIBBON SPACE ──────────────────────────────────────────────────
  // gradient tint
  const rg = ctx.createLinearGradient(0,0,0,ribbonH);
  rg.addColorStop(0, themeColor+'28'); rg.addColorStop(1,'#fff');
  ctx.fillStyle = rg; ctx.fillRect(0,0,CW,ribbonH);

  // metallic punch hole
  const hR = p(2.4), hX = CW/2, hY = ribbonH/2;
  // outer metallic ring
  const mGrad = ctx.createRadialGradient(hX-p(0.5),hY-p(0.5),p(0.5), hX,hY,hR+p(0.8));
  mGrad.addColorStop(0,'#e8e0c8'); mGrad.addColorStop(0.5,'#c9b97a'); mGrad.addColorStop(1,'#a08840');
  ctx.beginPath(); ctx.arc(hX,hY,hR+p(0.8),0,Math.PI*2); ctx.fillStyle=mGrad; ctx.fill();
  // hole
  ctx.beginPath(); ctx.arc(hX,hY,hR,0,Math.PI*2);
  ctx.fillStyle='#d4d8e8'; ctx.fill();
  // inner shadow
  const iGrad = ctx.createRadialGradient(hX,hY,p(0.5), hX,hY,hR);
  iGrad.addColorStop(0,'rgba(0,0,0,0.15)'); iGrad.addColorStop(1,'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(hX,hY,hR,0,Math.PI*2); ctx.fillStyle=iGrad; ctx.fill();

  // ─── 3. HEADER BAND ───────────────────────────────────────────────────
  // deep navy gradient
  const hg = ctx.createLinearGradient(0,hdrY,CW,hdrY+headerH);
  hg.addColorStop(0, themeColor);
  hg.addColorStop(1, themeColor+'cc');
  ctx.fillStyle=hg; ctx.fillRect(0,hdrY,CW,headerH);

  // geometric gold lines (decorative)
  ctx.save(); ctx.beginPath(); ctx.rect(0,hdrY,CW,headerH); ctx.clip();
  ctx.strokeStyle = goldColor+'30'; ctx.lineWidth = p(0.4);
  // diagonal grid
  for(let xi=-CW; xi<CW*2; xi+=p(8)){
    ctx.beginPath(); ctx.moveTo(xi,hdrY); ctx.lineTo(xi+p(14),hdrY+headerH); ctx.stroke();
  }
  // horizontal accent lines
  [0.3,0.7].forEach(t => {
    ctx.strokeStyle=goldColor+'25'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(0,hdrY+headerH*t); ctx.lineTo(CW,hdrY+headerH*t); ctx.stroke();
  });
  ctx.restore();

  // Gold top border line
  const topBorderH = p(0.8);
  const topGrad = ctx.createLinearGradient(0,hdrY,CW,hdrY);
  topGrad.addColorStop(0,'transparent'); topGrad.addColorStop(0.2,goldColor);
  topGrad.addColorStop(0.8,goldColor); topGrad.addColorStop(1,'transparent');
  ctx.fillStyle=topGrad; ctx.fillRect(0,hdrY,CW,topBorderH);

  // Gold bottom border line
  const bGrad = ctx.createLinearGradient(0,0,CW,0);
  bGrad.addColorStop(0,'transparent'); bGrad.addColorStop(0.2,goldColor);
  bGrad.addColorStop(0.8,goldColor); bGrad.addColorStop(1,'transparent');
  ctx.fillStyle=bGrad; ctx.fillRect(0,hdrY+headerH-p(0.8),CW,p(0.8));

  // Logo — circular with double gold ring
  const logoSz=p(14), logoX=p(3.5), logoY=hdrY+(headerH-logoSz)/2;
  // outer glow
  ctx.save(); ctx.shadowColor=goldColor+'88'; ctx.shadowBlur=p(2);
  ctx.beginPath(); ctx.arc(logoX+logoSz/2,logoY+logoSz/2,logoSz/2+p(1.5),0,Math.PI*2);
  const lgOuter = ctx.createLinearGradient(logoX,logoY,logoX+logoSz,logoY+logoSz);
  lgOuter.addColorStop(0,'#e8d48a'); lgOuter.addColorStop(0.5,'#c9a94a'); lgOuter.addColorStop(1,'#a07830');
  ctx.fillStyle=lgOuter; ctx.fill(); ctx.restore();
  // inner white ring
  ctx.beginPath(); ctx.arc(logoX+logoSz/2,logoY+logoSz/2,logoSz/2+p(0.6),0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.fill();
  // logo circle clip
  ctx.save(); ctx.beginPath(); ctx.arc(logoX+logoSz/2,logoY+logoSz/2,logoSz/2,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill(); ctx.clip();
  if(logoImg) ctx.drawImage(logoImg,logoX,logoY,logoSz,logoSz);
  ctx.restore();

  // School name text
  const ntx=logoX+logoSz+p(3), ntw=CW-ntx-p(3);
  ctx.textAlign='left'; ctx.textBaseline='top';
  // School name (bold white)
  ctx.font=`900 ${p(4.2)}px Arial`; ctx.fillStyle='#ffffff';
  ctx.fillText(clip(ctx, settings.schoolName||'D V Convent School', ntw), ntx, hdrY+p(3.5));
  // Gold divider line
  const gdY=hdrY+p(10);
  const gdGrad=ctx.createLinearGradient(ntx,0,ntx+ntw,0);
  gdGrad.addColorStop(0,goldColor); gdGrad.addColorStop(1,goldColor+'44');
  ctx.fillStyle=gdGrad; ctx.fillRect(ntx,gdY,ntw*0.8,p(0.5));
  // Sub info
  ctx.font=`400 ${p(2.8)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.fillText(clip(ctx,settings.schoolAddress||'Akodha, Rohi, Bhadohi',ntw), ntx, hdrY+p(13));
  ctx.font=`700 ${p(2.8)}px Arial`; ctx.fillStyle=goldColor+'dd';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, ntx, hdrY+p(18.5));
  // Card type badge
  const badgeTxt = cardLabel;
  ctx.font=`700 ${p(2.4)}px Arial`;
  const bw=ctx.measureText(badgeTxt).width+p(4);
  rrect(ctx,ntx,hdrY+headerH-p(7),bw,p(5),p(2));
  const bbg=ctx.createLinearGradient(ntx,0,ntx+bw,0);
  bbg.addColorStop(0,goldColor); bbg.addColorStop(1,'#e8c84a');
  ctx.fillStyle=bbg; ctx.fill();
  ctx.fillStyle=themeColor; ctx.textBaseline='middle';
  ctx.fillText(badgeTxt, ntx+p(2), hdrY+headerH-p(4.5));

  // ─── 4. PHOTO ZONE ────────────────────────────────────────────────────
  // Soft background
  const pzbg=ctx.createLinearGradient(0,pzY,0,pzY+photoZH);
  pzbg.addColorStop(0,'#f0f3ff'); pzbg.addColorStop(1,'#ffffff');
  ctx.fillStyle=pzbg; ctx.fillRect(0,pzY,CW,photoZH);

  // Large centered photo with premium gold frame
  const pW=p(22), pH=p(27);
  const pX=(CW-pW)/2, pY=pzY+p(3.5);

  // shadow
  ctx.save(); ctx.shadowColor='rgba(0,0,0,0.25)'; ctx.shadowBlur=p(3); ctx.shadowOffsetY=p(1.5);
  rrect(ctx,pX-p(1.5),pY-p(1.5),pW+p(3),pH+p(3),p(2));
  const frameGrad=ctx.createLinearGradient(pX,pY,pX+pW,pY+pH);
  frameGrad.addColorStop(0,'#e8d88a'); frameGrad.addColorStop(0.25,'#c9a94a');
  frameGrad.addColorStop(0.5,'#f0e090'); frameGrad.addColorStop(0.75,'#c9a94a');
  frameGrad.addColorStop(1,'#a07830');
  ctx.fillStyle=frameGrad; ctx.fill(); ctx.restore();

  // photo
  drawPhoto(ctx,photoImg,pX,pY,pW,pH,themeColor,(personName||'?').charAt(0).toUpperCase());

  // Name below photo
  const nameY=pY+pH+p(2);
  ctx.font=`900 ${p(4.2)}px Arial`; ctx.fillStyle=themeColor;
  ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText(clip(ctx,personName||'',CW-p(10)), CW/2, nameY);

  // ID pill below name
  const pillTxt=idLine;
  ctx.font=`700 ${p(2.8)}px Arial`;
  const pillW=ctx.measureText(pillTxt).width+p(8), pillH=p(5);
  const pillX=(CW-pillW)/2, pillY=nameY+p(5.5);
  rrect(ctx,pillX,pillY,pillW,pillH,pillH/2);
  const pg=ctx.createLinearGradient(pillX,pillY,pillX+pillW,pillY);
  pg.addColorStop(0,themeColor); pg.addColorStop(1,themeColor+'bb');
  ctx.fillStyle=pg; ctx.fill();
  // gold border on pill
  rrect(ctx,pillX,pillY,pillW,pillH,pillH/2);
  ctx.strokeStyle=goldColor+'88'; ctx.lineWidth=p(0.5); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(pillTxt, CW/2, pillY+pillH/2);

  // ─── 5. INFO SECTION ──────────────────────────────────────────────────
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,infoY,CW,infoH);

  // top gold accent line
  const topAccGrad=ctx.createLinearGradient(0,infoY,CW,infoY);
  topAccGrad.addColorStop(0,'transparent'); topAccGrad.addColorStop(0.1,goldColor);
  topAccGrad.addColorStop(0.9,goldColor); topAccGrad.addColorStop(1,'transparent');
  ctx.fillStyle=topAccGrad; ctx.fillRect(0,infoY,CW,p(0.6));

  const lx=p(4), vx=p(22), valW=CW-vx-p(4);
  const rowH=p(5), lnH=p(3.5);
  let ry=infoY+p(1.5);

  // measure first
  const tmp=document.createElement('canvas'); tmp.width=CW; tmp.height=10;
  const mctx=tmp.getContext('2d'); mctx.font=`500 ${p(2.8)}px Arial`;

  rows.forEach(([lbl,val],i)=>{
    const lines=wrap(mctx,val,valW);
    const rh=lines.length>1 ? lines.length*lnH+p(2.5) : rowH;

    // alt row bg
    if(i%2===0){
      ctx.fillStyle=themeColor+'06';
      ctx.fillRect(0,ry,CW,rh);
    }

    // left colored accent bar
    const barGrad=ctx.createLinearGradient(0,ry,0,ry+rh);
    barGrad.addColorStop(0,themeColor+'cc'); barGrad.addColorStop(1,themeColor+'44');
    ctx.fillStyle=barGrad; ctx.fillRect(lx-p(1.5),ry+p(1),p(0.8),rh-p(2));

    // label
    ctx.font=`700 ${p(2.8)}px Arial`; ctx.fillStyle=themeColor;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(lbl, lx, ry+rh/2);

    // colon
    ctx.font=`400 ${p(2.8)}px Arial`; ctx.fillStyle='#9ca3af';
    ctx.fillText(':', vx-p(3.5), ry+rh/2);

    // value
    ctx.font=`500 ${p(2.8)}px Arial`; ctx.fillStyle='#111827';
    ctx.textBaseline='top';
    lines.forEach((ln,li)=>ctx.fillText(ln, vx, ry+p(1.2)+li*lnH));

    // divider
    ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(lx,ry+rh); ctx.lineTo(CW-lx,ry+rh); ctx.stroke();
    ry+=rh;
  });

  // ─── 6. FOOTER ────────────────────────────────────────────────────────
  const ftGrad=ctx.createLinearGradient(0,ftY,0,CH);
  ftGrad.addColorStop(0,themeColor+'f0'); ftGrad.addColorStop(1,themeColor);
  ctx.fillStyle=ftGrad; ctx.fillRect(0,ftY,CW,footerH);

  // gold top border on footer
  ctx.fillStyle=topAccGrad; ctx.fillRect(0,ftY,CW,p(0.6));

  // phone
  ctx.font=`700 ${p(2.6)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.9)';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(`📞 ${settings.contactNumber||'—'}`, p(4), ftY+footerH/2);

  // sign + principal
  if(signImg){
    const sh=Math.min(p(6.5),footerH-p(1.5));
    const sw=sh*(signImg.width/signImg.height);
    const sx=CW-sw-p(4), sy=ftY+(footerH-sh)/2;
    ctx.drawImage(signImg,sx,sy,sw,sh);
    // underline
    ctx.strokeStyle=goldColor+'99'; ctx.lineWidth=p(0.4);
    ctx.beginPath(); ctx.moveTo(sx,sy+sh+p(0.5)); ctx.lineTo(sx+sw,sy+sh+p(0.5)); ctx.stroke();
  }
  ctx.font=`700 ${p(2.4)}px Arial`; ctx.fillStyle=goldColor+'ee';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  ctx.fillText('Principal', CW-p(4), ftY+footerH/2);
};

// ════════════════════════════════════════════════════════════════════════════
// STUDENT
// ════════════════════════════════════════════════════════════════════════════
const drawStudent = async (canvas, student, settings, assets, color='#1a3a6b') => {
  const gold = '#c9a94a';
  await drawCard(canvas, settings, assets, {
    themeColor: color, goldColor: gold,
    cardLabel: 'STUDENT ID CARD',
    personName: student.name||'',
    idLine: `UID : ${student.UID||'—'}`,
    rows: [
      ['Name',    student.name||'—'],
      ['F/Name',  student.fatherName||'—'],
      ['Class',   `Class ${student.class||'—'}`],
      ['D.O.B',   fmtDate(student.dateOfBirth)],
      ['Address', student.address||'—'],
    ],
  });
};

// ════════════════════════════════════════════════════════════════════════════
// TEACHER
// ════════════════════════════════════════════════════════════════════════════
const drawTeacher = async (canvas, teacher, settings, assets) => {
  const gold = '#c9a94a';
  await drawCard(canvas, settings, assets, {
    themeColor: '#7b1d1d', goldColor: gold,
    cardLabel: 'STAFF ID CARD',
    personName: teacher.name||'',
    idLine: `ID : ${teacher.employeeCode||'—'}`,
    rows: [
      ['Name',   teacher.name||'—'],
      ['Desig.', teacher.designation||'Teacher'],
      ['Phone',  teacher.phone||'—'],
      ['Addr.',  teacher.address||'—'],
    ],
  });
};

// ── Pipeline ───────────────────────────────────────────────────────────────
const toBlob = async (item, type, settings, shared, sColor) => {
  const rp = (pp) => {
    if(!pp) return null;
    if(pp.startsWith('data:')||pp.startsWith('http')) return pp;
    return `${import.meta.env?.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${pp}`;
  };
  const photoImg = await loadImg(rp(item.profileImage));
  const canvas   = document.createElement('canvas');
  if(type==='student') await drawStudent(canvas, item, settings, {...shared, photoImg}, sColor);
  else                  await drawTeacher(canvas, item, settings, {...shared, photoImg});
  return new Promise((res,rej) => canvas.toBlob(b=>b?res(b):rej(new Error('toBlob failed')),'image/png',1.0));
};

const dl = (blob,name) => {
  const url=URL.createObjectURL(blob);
  const a=Object.assign(document.createElement('a'),{href:url,download:name}); a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
};

export const downloadCards = async (items,type,settings,logoSrc,signSrc,onProgress,sColor='#1a3a6b') => {
  if(!items?.length) throw new Error('No items');
  const label  = type==='student'?'student':'teacher';
  const shared = { logoImg:await loadImg(settings.schoolLogo||logoSrc), signImg:await loadImg(signSrc) };
  if(items.length===1){
    onProgress?.(0,1);
    dl(await toBlob(items[0],type,settings,shared,sColor), `${label}-id-card.png`);
    onProgress?.(1,1); return;
  }
  const zip=new JSZip(), folder=zip.folder(`${label}-id-cards`);
  for(let i=0;i<items.length;i++){
    onProgress?.(i,items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`, await toBlob(items[i],type,settings,shared,sColor));
  }
  onProgress?.(items.length,items.length);
  dl(await zip.generateAsync({type:'blob'}), `${label}-id-cards.zip`);
};
