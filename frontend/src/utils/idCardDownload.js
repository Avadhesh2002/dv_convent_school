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

// Small L-shaped corner ornament, drawn at the 4 corners of a rect
const cornerBrackets = (ctx, x, y, w, h, size, thickness, color) => {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round';
  const draw = (sx, sy, dx, dy) => {
    ctx.beginPath();
    ctx.moveTo(sx, sy + dy*size); ctx.lineTo(sx, sy); ctx.lineTo(sx + dx*size, sy);
    ctx.stroke();
  };
  draw(x, y, 1, 1);           // top-left
  draw(x+w, y, -1, 1);        // top-right
  draw(x, y+h, 1, -1);        // bottom-left
  draw(x+w, y+h, -1, -1);     // bottom-right
  ctx.restore();
};

const cropDraw = (ctx, img, x, y, w, h, radius=p(1)) => {
  ctx.save(); rrect(ctx,x,y,w,h,radius); ctx.clip();
  const ia=img.width/img.height, ba=w/h;
  let sx,sy,sw,sh;
  if(ia>ba){sh=img.height;sw=sh*ba;sx=(img.width-sw)/2;sy=0;}
  else     {sw=img.width; sh=sw/ba;sx=0;sy=0;}
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
  // glass shine overlay on top ~45% of the photo
  const shine = ctx.createLinearGradient(x, y, x, y + h*0.45);
  shine.addColorStop(0, 'rgba(255,255,255,0.30)');
  shine.addColorStop(0.7, 'rgba(255,255,255,0.05)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  ctx.fillRect(x, y, w, h*0.45);
  ctx.restore();
};

// ══════════════════════════════════════════════════════════════════════════
// SECTION HEIGHTS — total MUST = 87mm
//   ribbon  =  7mm  (blank white space + faint gold hairline)
//   header  = 24mm  (school info)
//   photo   = 29mm  (photo + name + uid)
//   info    = 18mm  (5 rows)
//   footer  =  9mm
//   TOTAL   = 87mm ✓
// ══════════════════════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, gold, label, name, idLine, rows } = opts;

  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext('2d');

  const RH = p(7);
  const HH = p(24);
  const PZH= p(29);
  const FH = p(9);
  const IH = CH - RH - HH - PZH - FH;  // = p(18)

  const HY  = RH;
  const PZY = RH + HH;
  const IY  = PZY + PZH;
  const FTY = CH - FH;

  // ── BASE: soft ivory-white ──────────────────────────────────────────────
  const base = ctx.createLinearGradient(0,0,0,CH);
  base.addColorStop(0,'#ffffff'); base.addColorStop(1,'#fdfcf9');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CW, CH);

  // ── 1. RIBBON SPACE — faint gold hairline ───────────────────────────────
  const ribG = ctx.createLinearGradient(CW*0.2,0,CW*0.8,0);
  ribG.addColorStop(0,'transparent'); ribG.addColorStop(0.5, gold+'66'); ribG.addColorStop(1,'transparent');
  ctx.fillStyle = ribG;
  ctx.fillRect(CW*0.2, p(3.4), CW*0.6, p(0.3));

  // ── 2. HEADER ────────────────────────────────────────────────────────────
  const hg = ctx.createLinearGradient(0, HY, CW, HY+HH);
  hg.addColorStop(0, color);
  hg.addColorStop(0.42, color+'f0');
  hg.addColorStop(1, color+'cc');
  ctx.fillStyle = hg;
  ctx.fillRect(0, HY, CW, HH);

  // diagonal grid
  ctx.save(); ctx.beginPath(); ctx.rect(0,HY,CW,HH); ctx.clip();
  ctx.strokeStyle = gold+'22'; ctx.lineWidth = p(0.32);
  for(let xi=-CW; xi<CW*2; xi+=p(7)){
    ctx.beginPath(); ctx.moveTo(xi,HY); ctx.lineTo(xi+p(13),HY+HH); ctx.stroke();
  }
  // foil shine sweep
  const shineG = ctx.createLinearGradient(CW*-0.1, HY, CW*0.35, HY);
  shineG.addColorStop(0,'rgba(255,255,255,0)');
  shineG.addColorStop(0.55,'rgba(255,255,255,0.18)');
  shineG.addColorStop(0.75,'rgba(255,255,255,0.04)');
  shineG.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle = shineG;
  ctx.fillRect(0, HY, CW, HH);
  ctx.restore();

  // gold border lines top/bottom
  const gline = (y) => {
    const g=ctx.createLinearGradient(0,0,CW,0);
    g.addColorStop(0,'transparent'); g.addColorStop(0.1,gold);
    g.addColorStop(0.9,gold); g.addColorStop(1,'transparent');
    ctx.fillStyle=g; ctx.fillRect(0,y,CW,p(0.75));
  };
  gline(HY); gline(HY+HH-p(0.75));

  // LOGO (double ring for depth)
  const LSZ=p(14), LX=p(3), LY=HY+(HH-LSZ)/2;
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=p(2.2); ctx.shadowOffsetY=p(0.6);
  ctx.beginPath(); ctx.arc(LX+LSZ/2,LY+LSZ/2,LSZ/2+p(1.6),0,Math.PI*2);
  ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fill(); ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(LX+LSZ/2,LY+LSZ/2,LSZ/2+p(1.2),0,Math.PI*2);
  const lgr=ctx.createLinearGradient(LX,LY,LX+LSZ,LY+LSZ);
  lgr.addColorStop(0,'#fef3c0'); lgr.addColorStop(0.45,gold); lgr.addColorStop(1,'#78500a');
  ctx.fillStyle=lgr; ctx.fill(); ctx.restore();
  ctx.save();
  ctx.beginPath(); ctx.arc(LX+LSZ/2,LY+LSZ/2,LSZ/2,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill(); ctx.clip();
  if(logoImg) ctx.drawImage(logoImg,LX,LY,LSZ,LSZ);
  ctx.restore();

  // school text — start right after logo
  const TX=LX+LSZ+p(3), TW=CW-TX-p(2);

  // school name — fit in 1 line, auto-shrink font, subtle embossed shadow
  let nfs=p(4.5);
  ctx.font=`900 ${nfs}px Georgia,"Times New Roman",serif`;
  while(ctx.measureText(settings.schoolName||'D V Convent School').width>TW && nfs>p(3)){
    nfs--; ctx.font=`900 ${nfs}px Georgia,"Times New Roman",serif`;
  }
  ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.35)'; ctx.shadowBlur=p(0.6); ctx.shadowOffsetY=p(0.4);
  ctx.fillStyle='#fff';
  ctx.fillText(settings.schoolName||'D V Convent School', TX, HY+p(2.5));
  ctx.restore();

  // gold divider
  ctx.fillStyle=gold+'cc';
  ctx.fillRect(TX, HY+p(2.5)+nfs/p(1)+p(1), TW*0.7, p(0.6));

  const divY=HY+p(2.5)+nfs/p(1)+p(2.5);

  // address (italic feel via font style)
  ctx.font=`italic 400 ${p(2.6)}px Georgia,serif`; ctx.fillStyle='rgba(255,255,255,0.78)';
  ctx.fillText(ell(ctx,settings.schoolAddress||'Akodha, Rohi, Bhadohi',TW), TX, divY);

  // phone
  ctx.font=`700 ${p(2.9)}px Arial`; ctx.fillStyle=gold+'ee';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, TX, divY+p(4.5));

  // badge — small, inline, with star glyph + glossy gradient
  const BT=`\u2726 ${label}`;
  ctx.font=`800 ${p(2.4)}px Arial`;
  const BW=ctx.measureText(BT).width+p(5), BH=p(4.8);
  const BX=TX, BY=divY+p(9);
  rrect(ctx,BX,BY,BW,BH,p(2.4));
  const bbg=ctx.createLinearGradient(BX,BY,BX+BW,BY);
  bbg.addColorStop(0,'#fef3c0'); bbg.addColorStop(0.5,gold); bbg.addColorStop(1,'#f5d050');
  ctx.fillStyle=bbg; ctx.fill();
  ctx.save();
  rrect(ctx,BX,BY,BW,BH,p(2.4)); ctx.clip();
  const bshine=ctx.createLinearGradient(BX,BY,BX,BY+BH*0.5);
  bshine.addColorStop(0,'rgba(255,255,255,0.5)'); bshine.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=bshine; ctx.fillRect(BX,BY,BW,BH*0.5);
  ctx.restore();
  ctx.fillStyle=color; ctx.textBaseline='middle';
  ctx.fillText(BT,BX+p(2.5),BY+BH/2);

  // ── 3. PHOTO ZONE ────────────────────────────────────────────────────────
  const pzbg=ctx.createRadialGradient(CW/2,PZY,p(2),CW/2,PZY,PZH*1.3);
  pzbg.addColorStop(0,'#eef1f9'); pzbg.addColorStop(0.6,'#f7f8fc'); pzbg.addColorStop(1,'#ffffff');
  ctx.fillStyle=pzbg; ctx.fillRect(0,PZY,CW,PZH);

  // photo — compact 3:4
  const PW2=p(20), PHGT=p(24);
  const PX=(CW-PW2)/2, PY=PZY+p(2);

  // gold frame
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.22)'; ctx.shadowBlur=p(3.2); ctx.shadowOffsetY=p(1.6);
  rrect(ctx,PX-p(1.8),PY-p(1.8),PW2+p(3.6),PHGT+p(3.6),p(2));
  const pfg=ctx.createLinearGradient(PX,PY,PX+PW2,PY+PHGT);
  pfg.addColorStop(0,'#fef3c0'); pfg.addColorStop(0.3,gold);
  pfg.addColorStop(0.65,'#fef0a0'); pfg.addColorStop(1,'#78500a');
  ctx.fillStyle=pfg; ctx.fill(); ctx.restore();
  // thin dark inner ring for depth
  ctx.save();
  rrect(ctx,PX-p(0.5),PY-p(0.5),PW2+p(1),PHGT+p(1),p(1.4));
  ctx.strokeStyle='rgba(0,0,0,0.22)'; ctx.lineWidth=p(0.35); ctx.stroke();
  ctx.restore();

  if(photoImg){
    cropDraw(ctx,photoImg,PX,PY,PW2,PHGT,p(1));
  } else {
    ctx.save(); rrect(ctx,PX,PY,PW2,PHGT,p(1)); ctx.clip();
    ctx.fillStyle=color+'18'; ctx.fillRect(PX,PY,PW2,PHGT);
    ctx.font=`900 ${p(10)}px Georgia,serif`; ctx.fillStyle=color+'55';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText((name||'?').charAt(0).toUpperCase(),PX+PW2/2,PY+PHGT/2);
    ctx.restore();
  }

  // photo corner brackets (security-card feel)
  cornerBrackets(ctx, PX-p(3), PY-p(3), PW2+p(6), PHGT+p(6), p(2.4), p(0.5), color+'99');

  // name — auto shrink, stays inside photo zone
  const NY=PY+PHGT+p(1.8);
  let fnfs=p(3.6);
  ctx.font=`900 ${fnfs}px Georgia,serif`;
  while(ctx.measureText(name||'').width>CW-p(10) && fnfs>p(2.4)){
    fnfs--; ctx.font=`900 ${fnfs}px Georgia,serif`;
  }
  ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='top';
  ctx.fillText(name||'', CW/2, NY);

  // gold underline accent beneath name
  const ulY=NY+fnfs+p(0.6);
  const ulG=ctx.createLinearGradient(CW*0.32,0,CW*0.68,0);
  ulG.addColorStop(0,'transparent'); ulG.addColorStop(0.5,gold); ulG.addColorStop(1,'transparent');
  ctx.fillStyle=ulG; ctx.fillRect(CW*0.32, ulY, CW*0.36, p(0.4));

  // UID pill
  const PILLY=ulY+p(1.6);
  const idText=`\u2756 ${idLine}`;
  ctx.font=`700 ${p(2.6)}px Arial`;
  const PLW=ctx.measureText(idText).width+p(8), PLH=p(4.6);
  const PLX=(CW-PLW)/2;
  rrect(ctx,PLX,PILLY,PLW,PLH,PLH/2);
  const plg=ctx.createLinearGradient(PLX,PILLY,PLX+PLW,PILLY);
  plg.addColorStop(0,color); plg.addColorStop(0.5,color+'dd'); plg.addColorStop(1,color+'aa');
  ctx.fillStyle=plg; ctx.fill();
  rrect(ctx,PLX,PILLY,PLW,PLH,PLH/2);
  ctx.strokeStyle=gold+'88'; ctx.lineWidth=p(0.55); ctx.stroke();
  ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(idText,CW/2,PILLY+PLH/2);

  // ── 4. INFO ROWS ──────────────────────────────────────────────────────────
  ctx.fillStyle='#fff'; ctx.fillRect(0,IY,CW,IH);

  // faint watermark logo centered in info block
  if (logoImg) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    const wmS = p(20);
    ctx.drawImage(logoImg, CW/2 - wmS/2, IY + IH/2 - wmS/2, wmS, wmS);
    ctx.restore();
  }

  gline(IY);  // gold top line

  const LXI=p(3.5), VX=p(21), VW=CW-VX-p(3);
  const totalRows=rows.length;
  const rowH=IH/totalRows;

  // pre-measure for any wrapping
  const tc=document.createElement('canvas'); tc.width=CW; tc.height=10;
  const mc=tc.getContext('2d'); mc.font=`500 ${p(2.5)}px Arial`;

  let ry=IY;
  rows.forEach(([lbl,val],i)=>{
    const lns=wrapText(mc,val,VW);
    if(i%2===0){ ctx.fillStyle=color+'09'; ctx.fillRect(0,ry,CW,rowH); }

    // accent bar (gold-to-color gradient)
    const barG=ctx.createLinearGradient(0,ry+rowH*0.2,0,ry+rowH*0.8);
    barG.addColorStop(0,gold); barG.addColorStop(1,color);
    ctx.fillStyle=barG;
    ctx.fillRect(LXI-p(1.2),ry+rowH*0.2,p(0.9),rowH*0.6);

    // label (uppercase, letter-spaced)
    ctx.font=`700 ${p(2.3)}px Arial`; ctx.fillStyle=color;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(String(lbl).toUpperCase(),LXI,ry+rowH/2);

    // colon
    ctx.font=`400 ${p(2.5)}px Arial`; ctx.fillStyle='#c7ccd6';
    ctx.fillText(':',VX-p(3.5),ry+rowH/2);

    // value — max 1 line ellipsis to keep rows even
    ctx.font=`500 ${p(2.5)}px Arial`; ctx.fillStyle='#1f2937';
    ctx.textBaseline='middle';
    ctx.fillText(ell(ctx,val,VW),VX,ry+rowH/2);

    // divider
    ctx.strokeStyle='#e5e7eb'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(0,ry+rowH); ctx.lineTo(CW,ry+rowH); ctx.stroke();
    ry+=rowH;
  });

  // ── 5. FOOTER ─────────────────────────────────────────────────────────────
  const ftg=ctx.createLinearGradient(0,FTY,CW,FTY);
  ftg.addColorStop(0,color+'f5'); ftg.addColorStop(0.5,color); ftg.addColorStop(1,color+'f0');
  ctx.fillStyle=ftg; ctx.fillRect(0,FTY,CW,FH);
  gline(FTY);

  // vertical gold divider mid-footer
  const fdG=ctx.createLinearGradient(0,FTY,0,FTY+FH);
  fdG.addColorStop(0,'transparent'); fdG.addColorStop(0.5,gold+'88'); fdG.addColorStop(1,'transparent');
  ctx.fillStyle=fdG; ctx.fillRect(CW/2-0.4, FTY+FH*0.2, 0.8, FH*0.6);

  ctx.font=`700 ${p(2.6)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.92)';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(`📞 ${settings.contactNumber||'—'}`,p(4),FTY+FH/2);

  if(signImg){
    const sh=Math.min(p(6.5),FH-p(1.5));
    const sw=sh*(signImg.width/signImg.height);
    const sx=CW-sw-p(4), sy=FTY+(FH-sh)/2 - p(0.8);
    ctx.drawImage(signImg,sx,sy,sw,sh);
    ctx.strokeStyle=gold+'88'; ctx.lineWidth=p(0.4);
    ctx.beginPath(); ctx.moveTo(sx,sy+sh+p(0.6)); ctx.lineTo(sx+sw,sy+sh+p(0.6)); ctx.stroke();
  }
  ctx.font=`700 ${p(2.3)}px Arial`; ctx.fillStyle=gold+'ee';
  ctx.textAlign='right'; ctx.textBaseline='middle';
  ctx.fillText('\u2605 Principal \u2605',CW-p(4),FTY+FH/2+p(2.2));

  // ── Outer premium card border + corner ornaments ────────────────────────
  ctx.save();
  rrect(ctx,p(0.6),p(0.6),CW-p(1.2),CH-p(1.2),p(1.4));
  ctx.strokeStyle=gold+'70'; ctx.lineWidth=p(0.4); ctx.stroke();
  ctx.restore();
  cornerBrackets(ctx, p(2), p(2), CW-p(4), CH-p(4), p(4.2), p(0.55), gold+'cc');
};

const drawStudent=async(canvas,student,settings,assets,color='#1a3a6b')=>{
  await drawCard(canvas,settings,assets,{
    color, gold:'#c9a94a', label:'STUDENT ID CARD',
    name:student.name||'', idLine:`UID : ${student.UID||'—'}`,
    rows:[
      ['Name',   student.name||'—'],
      ['F/Name', student.fatherName||'—'],
      ['Class',  `Class ${student.class||'—'}`],
      ['D.O.B',  fmtDate(student.dateOfBirth)],
      ['Address',student.address||'—'],
    ],
  });
};

const drawTeacher=async(canvas,teacher,settings,assets)=>{
  await drawCard(canvas,settings,assets,{
    color:'#7b1d1d', gold:'#c9a94a', label:'STAFF ID CARD',
    name:teacher.name||'', idLine:`ID : ${teacher.employeeCode||'—'}`,
    rows:[
      ['Name',   teacher.name||'—'],
      ['Desig.', teacher.designation||'Teacher'],
      ['Phone',  teacher.phone||'—'],
      ['Addr.',  teacher.address||'—'],
    ],
  });
};

const resolvePhotoUrl=(pp)=>{
  if(!pp) return null;
  if(pp.startsWith('data:')||pp.startsWith('http')) return pp;
  return `${import.meta.env?.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${pp}`;
};

const toBlob=(item,type,settings,shared,sc)=>new Promise(async(res,rej)=>{
  const photoImg=await loadImg(resolvePhotoUrl(item.profileImage));
  const canvas=document.createElement('canvas');
  if(type==='student') await drawStudent(canvas,item,settings,{...shared,photoImg},sc);
  else                  await drawTeacher(canvas,item,settings,{...shared,photoImg});
  canvas.toBlob(b=>b?res(b):rej(new Error('toBlob failed')),'image/png',1.0);
});

const triggerDl=(blob,name)=>{
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
    triggerDl(await toBlob(items[0],type,settings,shared,sc),`${label}-id-card.png`);
    onProgress?.(1,1); return;
  }
  const zip=new JSZip(), folder=zip.folder(`${label}-id-cards`);
  for(let i=0;i<items.length;i++){
    onProgress?.(i,items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`,await toBlob(items[i],type,settings,shared,sc));
  }
  onProgress?.(items.length,items.length);
  triggerDl(await zip.generateAsync({type:'blob'}),`${label}-id-cards.zip`);
};