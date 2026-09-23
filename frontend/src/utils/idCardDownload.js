import JSZip from 'jszip';

const MM = 300 / 25.4;
const CW = Math.round(57 * MM);
const CH = Math.round(87 * MM);
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
    const test=line?`${line} ${w}`:w;
    if(ctx.measureText(test).width>maxW&&line){lines.push(line);line=w;}else line=test;
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

// ══════════════════════════════════════════════════════════
// LAYOUT  57×87mm
//  ribbon  = 5mm  blue
//  header  = 20mm  blue — logo small left, school info right (compact)
//  body    = ?mm   white — left: photo centered | right: name+uid+rows
//  sigfoot = 9mm   white — class + sign
//  bottom  = 8mm   blue
// ══════════════════════════════════════════════════════════
const drawCard = async (canvas, settings, assets, opts) => {
  const { logoImg, signImg, photoImg } = assets;
  const { color, personName, idLine, rows, classVal } = opts;

  canvas.width=CW; canvas.height=CH;
  const ctx=canvas.getContext('2d');

  const RH =p(5), HH=p(17), SFH=p(9), BSH=p(8);
  const BY =RH+HH;
  const BH =CH-RH-HH-SFH-BSH;
  const SFY=BY+BH;
  const BTSY=SFY+SFH;

  // white base
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,CW,CH);

  // ── 1. RIBBON ───────────────────────────────────────────
  ctx.fillStyle=color; ctx.fillRect(0,0,CW,RH);

  // ── 2. HEADER — logo LEFT small + text RIGHT compact ────
  const hg=ctx.createLinearGradient(0,RH,0,RH+HH);
  hg.addColorStop(0,'#1565c0'); hg.addColorStop(1,'#1976d2');
  ctx.fillStyle=hg; ctx.fillRect(0,RH,CW,HH);

  // Logo — smaller
  const LSZ=p(10), LX=p(2.5), LY=RH+(HH-LSZ)/2;
  ctx.save();
  ctx.beginPath(); ctx.arc(LX+LSZ/2,LY+LSZ/2,LSZ/2,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill(); ctx.clip();
  if(logoImg) ctx.drawImage(logoImg,LX,LY,LSZ,LSZ);
  ctx.restore();

  // School info — right of logo, compact
  const TX=LX+LSZ+p(2), TW=CW-TX-p(2);
  ctx.textAlign='left'; ctx.textBaseline='top';

  // school name — smaller, auto-shrink
  let nfs=p(3);
  ctx.font=`900 ${nfs}px Arial`;
  while(ctx.measureText(settings.schoolName||'D V Convent School').width>TW && nfs>p(2)){
    nfs--; ctx.font=`900 ${nfs}px Arial`;
  }
  ctx.fillStyle='#fff';
  ctx.fillText(settings.schoolName||'D V Convent School', TX, RH+p(1.2));

  // Govt Recognised
  ctx.font=`italic 400 ${p(1.8)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.88)';
  ctx.fillText('(Govt. Recognised)', TX, RH+p(1.2)+nfs+p(0.4));

  // address — 1 line ellipsis
  ctx.font=`400 ${p(1.75)}px Arial`; ctx.fillStyle='rgba(255,255,255,0.8)';
  ctx.fillText(ell(ctx,settings.schoolAddress||'Vill-Akodha,Post-Rohi,Bhadohi',TW),
    TX, RH+p(1.2)+nfs+p(3));

  // phone bold
  ctx.font=`700 ${p(2)}px Arial`; ctx.fillStyle='#fff';
  ctx.fillText(`Ph: ${settings.contactNumber||'—'}`, TX, RH+p(1.2)+nfs+p(5.8));

  // ── 3. BODY ─────────────────────────────────────────────
  ctx.fillStyle='#fff'; ctx.fillRect(0,BY,CW,BH);

  // LEFT — photo centered vertically
  const photoPad=p(2.5);
  const PW2=p(22), PHGT=Math.round(PW2*4/3);  // 3:4 ratio
  const PX=photoPad;
  const PY=BY+(BH-PHGT)/2;  // vertically centered

  // border
  ctx.strokeStyle=color; ctx.lineWidth=p(0.7);
  ctx.strokeRect(PX-p(0.7),PY-p(0.7),PW2+p(1.4),PHGT+p(1.4));

  if(photoImg){
    cropDraw(ctx,photoImg,PX,PY,PW2,PHGT);
  } else {
    ctx.fillStyle='#dbeafe'; ctx.fillRect(PX,PY,PW2,PHGT);
    ctx.font=`900 ${p(10)}px Arial`; ctx.fillStyle=color+'55';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText((personName||'?').charAt(0).toUpperCase(),PX+PW2/2,PY+PHGT/2);
  }

  // RIGHT — name + uid + rows
  const RX=PX+PW2+p(3), RW=CW-RX-p(2);
  let curY=BY+p(2);

  // name
  ctx.textAlign='left'; ctx.textBaseline='top';
  let fnfs=p(3.4);
  ctx.font=`700 ${fnfs}px Arial`;
  while(ctx.measureText(personName||'').width>RW && fnfs>p(2)){
    fnfs--; ctx.font=`700 ${fnfs}px Arial`;
  }
  ctx.fillStyle='#1a1a1a';
  ctx.fillText(personName||'',RX,curY);
  curY+=fnfs+p(1.5);

  // UID pill
  ctx.font=`800 ${p(2.2)}px Arial`;
  const UW=ctx.measureText(idLine).width+p(6), UH=p(3.5), ur=UH/2;
  ctx.beginPath();
  ctx.moveTo(RX+ur,curY); ctx.lineTo(RX+UW-ur,curY);
  ctx.quadraticCurveTo(RX+UW,curY,RX+UW,curY+ur);
  ctx.lineTo(RX+UW,curY+UH-ur); ctx.quadraticCurveTo(RX+UW,curY+UH,RX+UW-ur,curY+UH);
  ctx.lineTo(RX+ur,curY+UH); ctx.quadraticCurveTo(RX,curY+UH,RX,curY+UH-ur);
  ctx.lineTo(RX,curY+ur); ctx.quadraticCurveTo(RX,curY,RX+ur,curY); ctx.closePath();
  ctx.fillStyle=color; ctx.fill();
  ctx.fillStyle='#fff'; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(idLine,RX+p(3),curY+UH/2);
  curY+=UH+p(2);

  // rows — label on own line, value wraps if needed
  const rowsAvail=BY+BH-p(1.5)-curY;
  const tc=document.createElement('canvas'); tc.width=CW; tc.height=10;
  const mc=tc.getContext('2d'); mc.font=`400 ${p(2)}px Arial`;

  const LBH=p(2.2); // label line height
  const VLH=p(2.2); // value line height
  const SEP=p(0.6);

  // pre-measure
  const rowDefs=rows.map(([lbl,val])=>{
    const lines=wrapText(mc,val,RW);
    const rh=LBH+lines.length*VLH+SEP;
    return {lbl,val,lines,rh};
  });
  const totalNeed=rowDefs.reduce((a,r)=>a+r.rh,0);
  const rscale=Math.min(1,rowsAvail/totalNeed);

  rowDefs.forEach(({lbl,val,lines,rh},i)=>{
    const actualRH=Math.round(rh*rscale);
    if(i%2===0){ ctx.fillStyle=color+'0d'; ctx.fillRect(RX-p(1),curY,RW+p(1),actualRH); }
    // label
    ctx.font=`700 ${p(2)}px Arial`; ctx.fillStyle=color;
    ctx.textAlign='left'; ctx.textBaseline='top';
    ctx.fillText(lbl,RX,curY+p(0.3));
    // value lines
    ctx.font=`400 ${p(2)}px Arial`; ctx.fillStyle='#1a1a1a';
    const scaledVLH=VLH*rscale;
    lines.forEach((ln,li)=>ctx.fillText(ln,RX,curY+LBH*rscale+p(0.3)+li*scaledVLH));
    // divider
    ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=p(0.3);
    ctx.beginPath(); ctx.moveTo(RX-p(1),curY+actualRH); ctx.lineTo(CW-p(2),curY+actualRH); ctx.stroke();
    curY+=actualRH;
  });

  // ── 4. SIGN FOOTER ──────────────────────────────────────
  ctx.fillStyle='#fff'; ctx.fillRect(0,SFY,CW,SFH);
  ctx.strokeStyle='#e0e0e0'; ctx.lineWidth=p(0.3);
  ctx.beginPath(); ctx.moveTo(0,SFY); ctx.lineTo(CW,SFY); ctx.stroke();

  ctx.font=`900 ${p(3.2)}px Arial`; ctx.fillStyle='#1a1a1a';
  ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(`Class : ${classVal||'—'}`,p(3.5),SFY+SFH/2);

  if(signImg){
    const sh=Math.min(p(5.5),SFH-p(1.5));
    const sw=sh*(signImg.width/signImg.height);
    const sx=CW-sw-p(3.5), sy=SFY+p(0.8);
    ctx.drawImage(signImg,sx,sy,sw,sh);
    ctx.strokeStyle='#555'; ctx.lineWidth=p(0.4);
    ctx.beginPath(); ctx.moveTo(sx,sy+sh+p(0.5)); ctx.lineTo(sx+sw,sy+sh+p(0.5)); ctx.stroke();
    ctx.font=`400 ${p(1.8)}px Arial`; ctx.fillStyle='#555';
    ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText('Principal Sign.',sx+sw/2,sy+sh+p(0.8));
  }

  // ── 5. BOTTOM STRIP ─────────────────────────────────────
  ctx.fillStyle=color; ctx.fillRect(0,BTSY,CW,BSH);
  ctx.font=`500 ${p(2)}px Arial`; ctx.fillStyle='#fff';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(`If found, please return to school  •  Ph: ${settings.contactNumber||'—'}`,CW/2,BTSY+BSH/2);
};

const drawStudent=async(canvas,student,settings,assets,color='#1565c0')=>{
  await drawCard(canvas,settings,assets,{
    color, personName:student.name||'',
    idLine:`UID: ${student.UID||'—'}`,
    classVal:student.class||'—',
    rows:[
      ["Father's Name",student.fatherName||'—'],
      ["Mother's Name",student.motherName||'—'],
      ['D.O.B.',       fmtDate(student.dateOfBirth)],
      ['Contact No.',  student.fatherMobile||student.motherMobile||student.guardianMobile||'—'],
      ['Add.',         student.address||'—'],
    ],
  });
};

const drawTeacher=async(canvas,teacher,settings,assets)=>{
  await drawCard(canvas,settings,assets,{
    color:'#1565c0', personName:teacher.name||'',
    idLine:`ID: ${teacher.employeeCode||'—'}`,
    classVal:teacher.designation||'Teacher',
    rows:[
      ['Designation',teacher.designation||'Teacher'],
      ['Phone',      teacher.phone||'—'],
      ['Address',    teacher.address||'—'],
    ],
  });
};

const rpu=(pp)=>{
  if(!pp)return null;
  if(pp.startsWith('data:')||pp.startsWith('http'))return pp;
  return `${import.meta.env?.VITE_API_URL?.replace('/api','')||'http://localhost:5000'}${pp}`;
};

const toBlob=(item,type,settings,shared,sc)=>new Promise(async(res,rej)=>{
  const photoImg=await loadImg(rpu(item.profileImage));
  const canvas=document.createElement('canvas');
  if(type==='student')await drawStudent(canvas,item,settings,{...shared,photoImg},sc);
  else await drawTeacher(canvas,item,settings,{...shared,photoImg});
  canvas.toBlob(b=>b?res(b):rej(new Error('toBlob failed')),'image/png',1.0);
});

const dl=(blob,name)=>{
  const url=URL.createObjectURL(blob);
  Object.assign(document.createElement('a'),{href:url,download:name}).click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
};

export const downloadCards=async(items,type,settings,logoSrc,signSrc,onProgress,sc='#1565c0')=>{
  if(!items?.length)throw new Error('No items');
  const label=type==='student'?'student':'teacher';
  const shared={logoImg:await loadImg(settings.schoolLogo||logoSrc),signImg:await loadImg(signSrc)};
  if(items.length===1){
    onProgress?.(0,1);
    dl(await toBlob(items[0],type,settings,shared,sc),`${label}-id-card.png`);
    onProgress?.(1,1);return;
  }
  const zip=new JSZip(),folder=zip.folder(`${label}-id-cards`);
  for(let i=0;i<items.length;i++){
    onProgress?.(i,items.length);
    folder.file(`${label}-card-${String(i+1).padStart(3,'0')}.png`,await toBlob(items[i],type,settings,shared,sc));
  }
  onProgress?.(items.length,items.length);
  dl(await zip.generateAsync({type:'blob'}),`${label}-id-cards.zip`);
};
