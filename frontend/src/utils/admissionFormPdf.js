/**
 * printAdmissionForm — Strict single-page A4 admission form
 */

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const docLabel = (key) => ({
    transferCertificate:  'Transfer Certificate',
    migrationCertificate: 'Migration Certificate',
    characterCertificate: 'Character Certificate',
    casteCertificate:     'Caste Certificate',
    birthCertificate:     'Birth Certificate',
    markSheet:            'Prev. Class Result',
    fivePhotos:           '5 Photographs (Passport)',
    studentAadhar:        'Student Aadhar Copy',
    fatherAadhar:         'Father Aadhar Copy',
    motherAadhar:         'Mother Aadhar Copy',
    aadharPhotoCopy:      'Aadhar Photo Copy',
}[key] || key);

export const printAdmissionForm = (student, settings = {}) => {
    if (!student) return;

    const schoolName    = settings.schoolName    || 'DV CONVENT SCHOOL';
    const schoolAddress = settings.schoolAddress || 'Akodha, Rohi, Bhadohi - 221308';
    const schoolPhone   = settings.contactNumber || '';
    const schoolEmail   = settings.schoolEmail   || '';
    const udiseCode     = settings.udiseCode     || '';
    const schoolCode    = settings.schoolCode    || '';
    const affiliation   = settings.schoolAffiliation || '';
    const affiliationNo = settings.affiliationNumber || '';
    const logoSrc       = settings.schoolLogo
        ? (settings.schoolLogo.startsWith('data:') ? settings.schoolLogo : `data:image/png;base64,${settings.schoolLogo}`)
        : '';

    const photoSrc = student.profileImage || null;

    // Documents — split into 2 columns
    const docs     = student.documents || {};
    const docKeys  = Object.keys(docs);
    const half     = Math.ceil(docKeys.length / 2);
    const leftDocs = docKeys.slice(0, half);
    const rightDocs= docKeys.slice(half);

    const docPairs = [];
    for (let i = 0; i < half; i++) {
        docPairs.push({ left: leftDocs[i], right: rightDocs[i] });
    }

    const docRows = docPairs.map(({ left, right }) => `
        <tr>
            <td class="doc-label">${docLabel(left)}</td>
            <td class="doc-check">${docs[left] ? '&#10003;' : '&#9744;'}</td>
            <td class="doc-sep"></td>
            ${right
                ? `<td class="doc-label">${docLabel(right)}</td>
                   <td class="doc-check">${docs[right] ? '&#10003;' : '&#9744;'}</td>`
                : `<td class="doc-label"></td><td class="doc-check"></td>`
            }
        </tr>`).join('');

    const dob     = fmtDate(student.dateOfBirth);
    const admDate = fmtDate(student.admissionDate);

    const metaBadges = [
        udiseCode     ? `UDISE: ${udiseCode}`            : '',
        schoolCode    ? `Code: ${schoolCode}`            : '',
        affiliation   ? affiliation                      : '',
        affiliationNo ? `Affil: ${affiliationNo}`        : '',
    ].filter(Boolean).map(t => `<span class="badge">${t}</span>`).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Admission Form — ${student.name || ''}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }

@page {
    size: A4 portrait;
    margin: 0;
}

html, body {
    width: 210mm;
    height: 297mm;
    overflow: hidden;
    font-family: 'Times New Roman', Times, serif;
    font-size: 9pt;
    background: #fff;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

/* ── Page shell — exactly A4, no overflow ── */
.page {
    width: 210mm;
    height: 297mm;
    position: relative;
    overflow: hidden;
    background: #fff;
}

.outer-border {
    position: absolute;
    inset: 5mm;
    border: 2.5px double #1a3a6b;
    pointer-events: none;
    z-index: 0;
}
.inner-border {
    position: absolute;
    inset: 7.5mm;
    border: 1px solid #1a3a6b;
    pointer-events: none;
    z-index: 0;
}

/* ── Content box — stays inside borders ── */
.content {
    position: absolute;
    inset: 9mm 10mm 9mm 10mm;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
}

/* ── Header ── */
.header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 5px;
    border-bottom: 2px solid #1a3a6b;
    margin-bottom: 4px;
    flex-shrink: 0;
}
.logo {
    width: 58px; height: 58px;
    object-fit: contain;
    border-radius: 50%;
    border: 2px solid #1a3a6b;
    flex-shrink: 0;
}
.school-info { flex: 1; text-align: center; }
.school-name {
    font-size: 15pt;
    font-weight: bold;
    color: #1a3a6b;
    letter-spacing: 0.3px;
    line-height: 1.1;
}
.school-meta {
    font-size: 7.5pt;
    color: #333;
    margin-top: 2px;
    line-height: 1.5;
}
.affil-badges { margin-top: 2px; }
.badge {
    display: inline-block;
    background: #1a3a6b; color: #fff;
    font-size: 6.5pt; padding: 1px 6px;
    border-radius: 20px; margin: 1px;
}
.photo-box {
    width: 58px; height: 72px;
    border: 1.5px solid #1a3a6b;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 6.5pt; color: #888; text-align: center;
    background: #f9f9f9; overflow: hidden;
    line-height: 1.4;
}
.photo-box img { width: 100%; height: 100%; object-fit: cover; }

/* ── Form title ── */
.form-title-wrap {
    text-align: center;
    margin: 3px 0;
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

/* ── Meta bar ── */
.meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 7.5pt;
    font-weight: bold;
    color: #1a3a6b;
    padding: 2px 8px;
    background: #eef2ff;
    border: 1px solid #c7d7f5;
    border-radius: 2px;
    margin-bottom: 3px;
    flex-shrink: 0;
}

/* ── Two-column body layout ── */
.body-cols {
    display: flex;
    gap: 6px;
    flex: 1;
    min-height: 0;
    overflow: hidden;
}
.col-left  { flex: 1.1; min-width: 0; overflow: hidden; }
.col-right { flex: 0.9; min-width: 0; overflow: hidden; }

/* ── Section heading ── */
.sec-heading {
    font-size: 7.5pt;
    font-weight: bold;
    color: #fff;
    background: #1a3a6b;
    padding: 2px 6px;
    margin: 4px 0 2px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
}
.sec-heading:first-child { margin-top: 0; }

/* ── Info table ── */
.info-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 8pt;
}
.info-grid td {
    padding: 2px 4px;
    border-bottom: 1px dashed #dde4f0;
    vertical-align: top;
    line-height: 1.35;
}
.info-grid .lbl { width: 42%; font-weight: bold; color: #1a3a6b; }
.info-grid .colon { width: 4%; color: #888; text-align: center; }
.info-grid .val { width: 54%; color: #111; }
.info-grid tr:nth-child(even) td { background: #f7f9ff; }

/* ── Documents 2-col table ── */
.doc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 7.5pt;
}
.doc-table td {
    padding: 1.8px 4px;
    border-bottom: 1px dashed #e0e0e0;
    line-height: 1.3;
}
.doc-label { width: 38%; color: #333; }
.doc-check { width: 10%; text-align: center; font-size: 9pt; color: #1a3a6b; font-weight: bold; }
.doc-sep   { width: 4%;  border-bottom: none !important; }

/* ── Declaration ── */
.declaration {
    font-size: 7pt;
    color: #444;
    line-height: 1.5;
    padding: 3px 7px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 2px;
    margin: 3px 0 2px;
    font-style: italic;
    flex-shrink: 0;
}

/* ── Signatures ── */
.sig-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 4px;
    flex-shrink: 0;
}
.sig-block { text-align: center; }
.sig-line {
    width: 110px;
    border-bottom: 1px solid #1a3a6b;
    margin: 0 auto 2px;
    height: 22px;
}
.sig-label { font-size: 7pt; font-weight: bold; color: #1a3a6b; }
.sig-sub   { font-size: 6.5pt; color: #666; }

/* ── Footer ── */
.footer {
    text-align: center;
    font-size: 6.5pt;
    color: #aaa;
    font-style: italic;
    padding-top: 3px;
    border-top: 1px dashed #ddd;
    flex-shrink: 0;
    margin-top: 2px;
}

@media print {
    html, body { margin:0; padding:0; overflow:hidden; }
    .page { page-break-after: avoid; }
}
</style>
</head>
<body>
<div class="page">
    <div class="outer-border"></div>
    <div class="inner-border"></div>

    <div class="content">

        <!-- HEADER -->
        <div class="header">
            ${logoSrc
                ? `<img src="${logoSrc}" class="logo" alt="Logo" onerror="this.style.display='none'" />`
                : `<div class="logo" style="background:#f0f4ff;display:flex;align-items:center;justify-content:center;font-size:6pt;color:#1a3a6b;text-align:center;">School<br>Logo</div>`
            }
            <div class="school-info">
                <div class="school-name">${schoolName}</div>
                <div class="school-meta">
                    ${schoolAddress}
                    ${schoolPhone ? ' &nbsp;|&nbsp; Ph: ' + schoolPhone : ''}
                    ${schoolEmail ? ' &nbsp;|&nbsp; ' + schoolEmail : ''}
                </div>
                ${metaBadges ? `<div class="affil-badges">${metaBadges}</div>` : ''}
            </div>
            <div class="photo-box">
                ${photoSrc
                    ? `<img src="${photoSrc}" alt="Photo" />`
                    : 'Paste<br/>Photo<br/>Here'
                }
            </div>
        </div>

        <!-- FORM TITLE -->
        <div class="form-title-wrap">
            <span class="form-title">Admission Form</span>
        </div>

        <!-- META BAR -->
        <div class="meta-row">
            <span>SR No: <b>${student.srNo || '—'}</b></span>
            <span>UID: <b>${student.UID || '—'}</b></span>
            <span>Adm. Date: <b>${admDate}</b></span>
            <span>Type: <b>${student.admissionType === 'New' ? 'Fresh Admission' : 'Promoted'}</b></span>
        </div>

        <!-- TWO-COLUMN BODY -->
        <div class="body-cols">

            <!-- LEFT: Student + Parent -->
            <div class="col-left">
                <div class="sec-heading">&#9654; Student Details</div>
                <table class="info-grid">
                    <tr><td class="lbl">Full Name</td><td class="colon">:</td><td class="val"><b>${student.name || '—'}</b></td></tr>
                    <tr><td class="lbl">Date of Birth</td><td class="colon">:</td><td class="val">${dob}</td></tr>
                    <tr><td class="lbl">Gender</td><td class="colon">:</td><td class="val">${student.gender || '—'}</td></tr>
                    <tr><td class="lbl">Category</td><td class="colon">:</td><td class="val">${student.category || '—'}</td></tr>
                    <tr><td class="lbl">Class Admitted</td><td class="colon">:</td><td class="val">Class ${student.class || '—'}</td></tr>
                    <tr><td class="lbl">Aadhar No.</td><td class="colon">:</td><td class="val">${student.aadharNumber || '—'}</td></tr>
                    <tr><td class="lbl">PEN Number</td><td class="colon">:</td><td class="val">${student.penNumber || '—'}</td></tr>
                </table>

                <div class="sec-heading">&#9654; Parent / Guardian</div>
                <table class="info-grid">
                    <tr><td class="lbl">Father's Name</td><td class="colon">:</td><td class="val">${student.fatherName || '—'}</td></tr>
                    <tr><td class="lbl">Father's Mobile</td><td class="colon">:</td><td class="val">${student.fatherMobile || '—'}</td></tr>
                    <tr><td class="lbl">Mother's Name</td><td class="colon">:</td><td class="val">${student.motherName || '—'}</td></tr>
                    <tr><td class="lbl">Mother's Mobile</td><td class="colon">:</td><td class="val">${student.motherMobile || '—'}</td></tr>
                    ${student.guardianName ? `<tr><td class="lbl">Guardian</td><td class="colon">:</td><td class="val">${student.guardianName}</td></tr>` : ''}
                    ${student.guardianMobile ? `<tr><td class="lbl">Guardian Mobile</td><td class="colon">:</td><td class="val">${student.guardianMobile}</td></tr>` : ''}
                    <tr><td class="lbl">Parent Email</td><td class="colon">:</td><td class="val">${student.parentEmail || '—'}</td></tr>
                    <tr><td class="lbl">Address</td><td class="colon">:</td><td class="val">${student.address || '—'}${student.pincode ? ', ' + student.pincode : ''}</td></tr>
                </table>
            </div>

            <!-- RIGHT: Documents -->
            <div class="col-right">
                <div class="sec-heading">&#9654; Documents Received</div>
                <table class="doc-table">
                    ${docRows || '<tr><td colspan="5" style="color:#999;font-size:7.5pt;padding:4px;">No documents info</td></tr>'}
                </table>
            </div>
        </div>

        <!-- DECLARATION -->
        <div class="declaration">
            I/We declare that the above information is true and correct. I/We agree to abide by the school rules
            and undertake to pay fees regularly. In case of false information, admission may be cancelled.
        </div>

        <!-- SIGNATURES -->
        <div class="sig-row">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Parent / Guardian</div>
                <div class="sig-sub">Date: ____________</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Class Teacher</div>
                <div class="sig-sub">Signature &amp; Stamp</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Principal</div>
                <div class="sig-sub">Signature &amp; Seal</div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            Computer-generated Admission Form &nbsp;|&nbsp; ${schoolName} &nbsp;|&nbsp;
            Printed: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>

    </div><!-- .content -->
</div><!-- .page -->
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
