/**
 * printAdmissionForm — Single-column A4 layout matching the reference image
 */

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const DOC_LABELS = {
    transferCertificate:  'Transfer Certificate',
    migrationCertificate: 'Migration Certificate',
    characterCertificate: 'Character Certificate',
    casteCertificate:     'Caste Certificate',
    birthCertificate:     'Birth Certificate',
    markSheet:            'Previous Class Result',
    fivePhotos:           '5 Photograph (Passport Size)',
    studentAadhar:        'Student Aadhar Copy',
    fatherAadhar:         'Father Aadhar Copy',
    motherAadhar:         'Mother Aadhar Copy',
    aadharPhotoCopy:      'Aadhar Photo Copy',
};

export const printAdmissionForm = (student, settings = {}) => {
    if (!student) return;

    const schoolName    = settings.schoolName    || 'DV Convent School';
    const schoolAddress = settings.schoolAddress || 'Vill-Akodha, Post-Rohi, Dist-Bhadohi';
    const schoolPhone   = settings.contactNumber || '';
    const schoolEmail   = settings.schoolEmail   || '';
    const udiseCode     = settings.udiseCode     || '';
    const schoolCode    = settings.schoolCode    || '';
    const affiliation   = settings.schoolAffiliation || '';
    const affiliationNo = settings.affiliationNumber || '';

    // Logo — use settings logo (base64) else fallback
    const logoSrc = settings.schoolLogo
        ? (settings.schoolLogo.startsWith('data:')
            ? settings.schoolLogo
            : `data:image/png;base64,${settings.schoolLogo}`)
        : null;

    const photoSrc = student.profileImage || null;

    const dob     = fmtDate(student.dateOfBirth);
    const admDate = fmtDate(student.admissionDate);

    // Documents rows — single column as in image
    const docs    = student.documents || {};
    const docRows = Object.entries(DOC_LABELS).map(([key, label]) => {
        const received = docs[key] === true;
        return `<tr>
            <td class="doc-name">${label}</td>
            <td class="doc-tick">${received ? '&#10003;' : '&#9744;'}</td>
        </tr>`;
    }).join('');

    // Extra badge line for school identity
    const identityParts = [
        udiseCode     ? `UDISE: ${udiseCode}`        : '',
        schoolCode    ? `School Code: ${schoolCode}` : '',
        affiliation   ? affiliation                  : '',
        affiliationNo ? `Affil. No: ${affiliationNo}`: '',
    ].filter(Boolean);
    const identityLine = identityParts.length
        ? `<div class="school-identity">${identityParts.map(p => `<span class="id-badge">${p}</span>`).join('')}</div>`
        : '';

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Admission Form — ${student.name || ''}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }

@page { size: A4 portrait; margin: 0; }

html, body {
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    font-family: 'Times New Roman', Times, serif;
    background: #fff;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* ── Strict A4 page ── */
.page {
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
    background: #fff;
}

/* ── Decorative borders (matching image) ── */
.border-outer {
    position: absolute;
    inset: 5mm;
    border: 2.5px double #1a3a6b;
    pointer-events: none;
    z-index: 0;
}
.border-inner {
    position: absolute;
    inset: 7.5mm;
    border: 1px solid #1a3a6b;
    pointer-events: none;
    z-index: 0;
}

/* ── Content area strictly inside borders ── */
.content {
    position: absolute;
    top: 9mm; bottom: 8mm;
    left: 10mm; right: 10mm;
    z-index: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* ══════════════════════════════════
   HEADER
══════════════════════════════════ */
.header {
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 2px solid #1a3a6b;
    padding-bottom: 5px;
    margin-bottom: 4px;
    flex-shrink: 0;
}
.logo-wrap {
    width: 62px; height: 62px;
    flex-shrink: 0;
}
.logo-wrap img {
    width: 62px; height: 62px;
    border-radius: 50%;
    border: 2px solid #1a3a6b;
    object-fit: contain;
}
.logo-wrap .no-logo {
    width: 62px; height: 62px;
    border-radius: 50%;
    border: 2px solid #1a3a6b;
    background: #f0f4ff;
    display: flex; align-items: center; justify-content: center;
    font-size: 6pt; color: #1a3a6b; text-align: center;
}
.school-center {
    flex: 1;
    text-align: center;
}
.school-name {
    font-size: 17pt;
    font-weight: bold;
    color: #1a3a6b;
    line-height: 1.1;
}
.school-addr {
    font-size: 7.5pt;
    color: #444;
    margin-top: 2px;
}
.school-identity {
    margin-top: 3px;
}
.id-badge {
    display: inline-block;
    background: #1a3a6b;
    color: #fff;
    font-size: 6.5pt;
    padding: 1px 7px;
    border-radius: 20px;
    margin: 1px 2px;
}
.photo-box {
    width: 62px; height: 76px;
    border: 1.5px solid #1a3a6b;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 7pt; color: #888; text-align: center;
    background: #f9f9f9; overflow: hidden;
    line-height: 1.5;
}
.photo-box img { width: 100%; height: 100%; object-fit: cover; }

/* ══════════════════════════════════
   FORM TITLE
══════════════════════════════════ */
.title-wrap {
    text-align: center;
    margin: 3px 0 3px;
    flex-shrink: 0;
}
.form-title {
    font-size: 11pt;
    font-weight: bold;
    color: #1a3a6b;
    letter-spacing: 5px;
    text-transform: uppercase;
    border-bottom: 1.5px solid #1a3a6b;
    padding-bottom: 1px;
}

/* ══════════════════════════════════
   META BAR (SR No | UID | Date | Type)
══════════════════════════════════ */
.meta-bar {
    display: flex;
    justify-content: space-between;
    background: #eef2ff;
    border: 1px solid #c7d7f5;
    border-radius: 2px;
    padding: 2.5px 10px;
    font-size: 7.5pt;
    font-weight: bold;
    color: #1a3a6b;
    margin-bottom: 3px;
    flex-shrink: 0;
}

/* ══════════════════════════════════
   SECTION HEADING (dark blue bar as in image)
══════════════════════════════════ */
.sec-head {
    background: #1a3a6b;
    color: #fff;
    font-size: 7.5pt;
    font-weight: bold;
    padding: 2.5px 7px;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 3px;
    margin-bottom: 0;
}

/* ══════════════════════════════════
   INFO TABLE (label : value — full width)
══════════════════════════════════ */
.info-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
}
.info-tbl tr { border-bottom: 1px dashed #dde4f0; }
.info-tbl tr:nth-child(even) td { background: #f7f9ff; }
.info-tbl td { padding: 2.2px 6px; vertical-align: top; line-height: 1.35; }
.info-tbl .lbl  { width: 35%; font-weight: bold; color: #1a3a6b; }
.info-tbl .col  { width: 3%;  color: #888; text-align: center; }
.info-tbl .val  { width: 62%; color: #111; }

/* ══════════════════════════════════
   DOCUMENTS TABLE — single column as in image
══════════════════════════════════ */
.doc-tbl {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
}
.doc-tbl tr { border-bottom: 1px dashed #e0e0e0; }
.doc-tbl td { padding: 2px 6px; line-height: 1.3; vertical-align: middle; }
.doc-name { color: #333; }
.doc-tick {
    width: 30px;
    text-align: center;
    font-size: 9.5pt;
    color: #1a3a6b;
    font-weight: bold;
}

/* ══════════════════════════════════
   DECLARATION
══════════════════════════════════ */
.declaration {
    font-size: 7pt;
    font-style: italic;
    color: #444;
    line-height: 1.55;
    padding: 4px 8px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 2px;
    margin-top: 4px;
    flex-shrink: 0;
}

/* ══════════════════════════════════
   SIGNATURES
══════════════════════════════════ */
.sig-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 5px;
    flex-shrink: 0;
}
.sig-block { text-align: center; }
.sig-line {
    width: 120px;
    border-bottom: 1px solid #1a3a6b;
    height: 24px;
    margin: 0 auto 2px;
}
.sig-lbl { font-size: 7.5pt; font-weight: bold; color: #1a3a6b; }
.sig-sub { font-size: 6.5pt; color: #666; margin-top: 1px; }

/* ══════════════════════════════════
   FOOTER
══════════════════════════════════ */
.footer {
    text-align: center;
    font-size: 6.5pt;
    color: #aaa;
    font-style: italic;
    border-top: 1px dashed #ccc;
    padding-top: 3px;
    margin-top: 4px;
    flex-shrink: 0;
}

@media print {
    html, body { overflow: hidden; }
    .page { page-break-after: avoid; }
}
</style>
</head>
<body>
<div class="page">
    <div class="border-outer"></div>
    <div class="border-inner"></div>

    <div class="content">

        <!-- ── HEADER ── -->
        <div class="header">
            <div class="logo-wrap">
                ${logoSrc
                    ? `<img src="${logoSrc}" alt="School Logo" onerror="this.style.display='none'" />`
                    : `<div class="no-logo">School<br/>Logo</div>`
                }
            </div>

            <div class="school-center">
                <div class="school-name">${schoolName}</div>
                <div class="school-addr">
                    ${schoolAddress}${schoolPhone ? ' &nbsp;|&nbsp; Ph: ' + schoolPhone : ''}${schoolEmail ? ' &nbsp;|&nbsp; ' + schoolEmail : ''}
                </div>
                ${identityLine}
            </div>

            <div class="photo-box">
                ${photoSrc
                    ? `<img src="${photoSrc}" alt="Student Photo" />`
                    : 'Paste<br/>Photo<br/>Here'
                }
            </div>
        </div>

        <!-- ── ADMISSION FORM TITLE ── -->
        <div class="title-wrap">
            <span class="form-title">Admission Form</span>
        </div>

        <!-- ── META BAR ── -->
        <div class="meta-bar">
            <span>SR No: ${student.srNo || '—'}</span>
            <span>UID: ${student.UID || '—'}</span>
            <span>Admission Date: ${admDate}</span>
            <span>Admission Type: ${student.admissionType === 'New' ? 'Fresh Admission' : 'Promoted'}</span>
        </div>

        <!-- ── STUDENT DETAILS ── -->
        <div class="sec-head">&#9658; Student Details</div>
        <table class="info-tbl">
            <tr><td class="lbl">Full Name</td>        <td class="col">:</td><td class="val"><b>${student.name || '—'}</b></td></tr>
            <tr><td class="lbl">Date of Birth</td>    <td class="col">:</td><td class="val">${dob}</td></tr>
            <tr><td class="lbl">Gender</td>           <td class="col">:</td><td class="val">${student.gender || '—'}</td></tr>
            <tr><td class="lbl">Category</td>         <td class="col">:</td><td class="val">${student.category || '—'}</td></tr>
            <tr><td class="lbl">Class Admitted</td>   <td class="col">:</td><td class="val">Class ${student.class || '—'}</td></tr>
            <tr><td class="lbl">Aadhar Number</td>    <td class="col">:</td><td class="val">${student.aadharNumber || '—'}</td></tr>
            <tr><td class="lbl">PEN Number</td>       <td class="col">:</td><td class="val">${student.penNumber || '—'}</td></tr>
        </table>

        <!-- ── PARENT / GUARDIAN DETAILS ── -->
        <div class="sec-head">&#9658; Parent / Guardian Details</div>
        <table class="info-tbl">
            <tr><td class="lbl">Father's Name</td>    <td class="col">:</td><td class="val">${student.fatherName || '—'}</td></tr>
            <tr><td class="lbl">Father's Mobile</td>  <td class="col">:</td><td class="val">${student.fatherMobile || '—'}</td></tr>
            <tr><td class="lbl">Mother's Name</td>    <td class="col">:</td><td class="val">${student.motherName || '—'}</td></tr>
            <tr><td class="lbl">Mother's Mobile</td>  <td class="col">:</td><td class="val">${student.motherMobile || '—'}</td></tr>
            ${student.guardianName   ? `<tr><td class="lbl">Guardian's Name</td>  <td class="col">:</td><td class="val">${student.guardianName}</td></tr>` : ''}
            ${student.guardianMobile ? `<tr><td class="lbl">Guardian's Mobile</td><td class="col">:</td><td class="val">${student.guardianMobile}</td></tr>` : ''}
            <tr><td class="lbl">Parent Email</td>     <td class="col">:</td><td class="val">${student.parentEmail || '—'}</td></tr>
            <tr><td class="lbl">Residential Address</td><td class="col">:</td><td class="val">${student.address || '—'}${student.pincode ? ', ' + student.pincode : ''}</td></tr>
        </table>

        <!-- ── DOCUMENTS RECEIVED ── -->
        <div class="sec-head">&#9658; Documents Received</div>
        <table class="doc-tbl">
            ${docRows}
        </table>

        <!-- ── DECLARATION ── -->
        <div class="declaration">
            I/We hereby declare that the above information is true and correct to the best of my/our knowledge.
            I/We agree to abide by the rules and regulations of the school and undertake to pay the fees regularly.
            I/We understand that in case of any false information, the admission may be cancelled at any time.
        </div>

        <!-- ── SIGNATURES ── -->
        <div class="sig-row">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-lbl">Parent / Guardian Signature</div>
                <div class="sig-sub">Date: ________________</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-lbl">Class Teacher</div>
                <div class="sig-sub">Signature &amp; Stamp</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-lbl">Principal / Head of School</div>
                <div class="sig-sub">Signature &amp; Seal</div>
            </div>
        </div>

        <!-- ── FOOTER ── -->
        <div class="footer">
            Computer-generated Admission Form &nbsp;|&nbsp; ${schoolName} &nbsp;|&nbsp;
            Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>

    </div>
</div>
<script>
window.onload = function() { setTimeout(function(){ window.print(); }, 400); };
</script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) {
        alert('Popup block ho raha hai. Please popup allow karein aur dobara try karein.');
        return;
    }
    win.document.write(html);
    win.document.close();
};
