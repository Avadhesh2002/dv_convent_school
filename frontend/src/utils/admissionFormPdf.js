/**
 * printAdmissionForm
 * Opens a new window with a fully formatted Admission Form and triggers print.
 * @param {Object} student  — student document from MongoDB
 * @param {Object} settings — school settings (optional, for school name/address etc.)
 */

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

const docLabel = (key) => ({
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
        : '/src/assets/school_logo.png';

    const photoSrc = student.profileImage || null;

    // Documents received
    const docs = student.documents || {};
    const docRows = Object.entries(docs)
        .map(([key, val]) => `
            <tr>
                <td class="doc-label">${docLabel(key)}</td>
                <td class="doc-check">${val ? '&#10003;' : '&#9744;'}</td>
            </tr>`).join('');

    const admDate = fmtDate(student.admissionDate);
    const dob     = fmtDate(student.dateOfBirth);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Admission Form — ${student.name || ''}</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }

@page { size: A4 portrait; margin: 0; }

body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 10pt;
    background: #fff;
    color: #111;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
}

.page {
    width: 210mm;
    min-height: 297mm;
    padding: 10mm 14mm 10mm;
    position: relative;
    background: #fff;
    margin: 0 auto;
}

/* Border */
.outer-border {
    position: absolute;
    inset: 6mm;
    border: 3px double #1a3a6b;
    pointer-events: none;
}
.inner-border {
    position: absolute;
    inset: 8.5mm;
    border: 1px solid #1a3a6b;
    pointer-events: none;
}

.content { position: relative; z-index: 1; padding: 4mm 6mm; }

/* Header */
.header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 8px;
    border-bottom: 2.5px solid #1a3a6b;
    margin-bottom: 8px;
}
.logo {
    width: 80px; height: 80px;
    object-fit: contain;
    border-radius: 50%;
    border: 3px solid #1a3a6b;
    flex-shrink: 0;
}
.logo-placeholder {
    width: 80px; height: 80px;
    border-radius: 50%;
    border: 3px solid #1a3a6b;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 8pt; color: #1a3a6b; text-align: center;
    background: #f0f4ff;
}
.school-info { flex: 1; text-align: center; }
.school-name { font-size: 20pt; font-weight: bold; color: #1a3a6b; letter-spacing: 0.5px; }
.school-meta { font-size: 9pt; color: #333; margin-top: 3px; line-height: 1.6; }
.affil-badges { margin-top: 4px; }
.badge {
    display: inline-block;
    background: #1a3a6b; color: #fff;
    font-size: 7pt; padding: 1px 8px;
    border-radius: 20px; margin: 1px;
}

/* Photo box */
.photo-box {
    width: 75px; height: 90px;
    border: 1.5px solid #1a3a6b;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 7.5pt; color: #888; text-align: center;
    background: #f9f9f9;
    overflow: hidden;
}
.photo-box img { width: 100%; height: 100%; object-fit: cover; }

/* Form title */
.form-title {
    text-align: center;
    font-size: 13pt;
    font-weight: bold;
    color: #1a3a6b;
    letter-spacing: 4px;
    text-transform: uppercase;
    border-bottom: 2px solid #1a3a6b;
    padding-bottom: 2px;
    margin-bottom: 8px;
    display: inline-block;
}
.form-title-wrap { text-align: center; margin-bottom: 10px; }

/* Meta row */
.meta-row {
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    font-weight: bold;
    color: #1a3a6b;
    margin-bottom: 8px;
    padding: 3px 10px;
    background: #f0f4ff;
    border: 1px solid #c7d7f5;
    border-radius: 3px;
}

/* Section heading */
.sec-heading {
    font-size: 8.5pt;
    font-weight: bold;
    color: #fff;
    background: #1a3a6b;
    padding: 3px 8px;
    margin: 8px 0 4px;
    letter-spacing: 1px;
    text-transform: uppercase;
}

/* Info grid */
.info-grid {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5pt;
    margin-bottom: 2px;
}
.info-grid td {
    padding: 3.5px 6px;
    border-bottom: 1px dashed #dde4f0;
    vertical-align: top;
}
.info-grid .lbl {
    width: 38%;
    font-weight: bold;
    color: #1a3a6b;
}
.info-grid .colon { width: 3%; color: #888; text-align: center; }
.info-grid .val { width: 59%; color: #111; }
.info-grid tr:nth-child(even) td { background: #f7f9ff; }

/* Documents table */
.doc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
}
.doc-table td {
    padding: 2.5px 6px;
    border-bottom: 1px dashed #e0e0e0;
}
.doc-label { width: 85%; color: #333; }
.doc-check {
    width: 15%;
    text-align: center;
    font-size: 11pt;
    color: #1a3a6b;
    font-weight: bold;
}

/* Declaration */
.declaration {
    font-size: 8pt;
    color: #444;
    line-height: 1.6;
    padding: 6px 10px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 3px;
    margin: 10px 0 8px;
    font-style: italic;
}

/* Signature row */
.sig-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-top: 10px;
    padding-top: 6px;
}
.sig-block { text-align: center; }
.sig-line {
    width: 130px;
    border-bottom: 1.5px solid #1a3a6b;
    margin: 0 auto 4px;
    height: 36px;
}
.sig-label { font-size: 8pt; font-weight: bold; color: #1a3a6b; }
.sig-sub { font-size: 7.5pt; color: #666; margin-top: 1px; }

.footer {
    text-align: center;
    font-size: 7.5pt;
    color: #999;
    font-style: italic;
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1px dashed #ddd;
}

@media print {
    body { margin: 0; padding: 0; }
    .page { margin: 0 auto; page-break-after: avoid; }
}
</style>
</head>
<body>
<div class="page">
    <div class="outer-border"></div>
    <div class="inner-border"></div>

    <div class="content">

        <!-- Header -->
        <div class="header">
            <img src="${logoSrc}" class="logo" alt="Logo" onerror="this.style.display='none'" />
            <div class="school-info">
                <div class="school-name">${schoolName}</div>
                <div class="school-meta">
                    ${schoolAddress}${schoolPhone ? ' &nbsp;|&nbsp; Ph: ' + schoolPhone : ''}
                    ${schoolEmail ? ' &nbsp;|&nbsp; ' + schoolEmail : ''}
                </div>
                <div class="affil-badges">
                    ${udiseCode    ? `<span class="badge">UDISE: ${udiseCode}</span>` : ''}
                    ${schoolCode   ? `<span class="badge">School Code: ${schoolCode}</span>` : ''}
                    ${affiliation  ? `<span class="badge">${affiliation}</span>` : ''}
                    ${affiliationNo? `<span class="badge">Affil. No: ${affiliationNo}</span>` : ''}
                </div>
            </div>
            <div class="photo-box">
                ${photoSrc
                    ? `<img src="${photoSrc}" alt="Photo" />`
                    : 'Paste<br/>Photo<br/>Here'
                }
            </div>
        </div>

        <!-- Form Title -->
        <div class="form-title-wrap">
            <span class="form-title">Admission Form</span>
        </div>

        <!-- Meta: SR No | UID | Date -->
        <div class="meta-row">
            <div>SR No: &nbsp;<span>${student.srNo || '—'}</span></div>
            <div>UID: &nbsp;<span>${student.UID || '—'}</span></div>
            <div>Admission Date: &nbsp;<span>${admDate}</span></div>
            <div>Admission Type: &nbsp;<span>${student.admissionType === 'New' ? 'Fresh Admission' : 'Promoted'}</span></div>
        </div>

        <!-- Student Details -->
        <div class="sec-heading">&#9654; Student Details</div>
        <table class="info-grid">
            <tr><td class="lbl">Full Name</td><td class="colon">:</td><td class="val"><b>${student.name || '—'}</b></td></tr>
            <tr><td class="lbl">Date of Birth</td><td class="colon">:</td><td class="val">${dob}</td></tr>
            <tr><td class="lbl">Gender</td><td class="colon">:</td><td class="val">${student.gender || '—'}</td></tr>
            <tr><td class="lbl">Category</td><td class="colon">:</td><td class="val">${student.category || '—'}</td></tr>
            <tr><td class="lbl">Class Admitted</td><td class="colon">:</td><td class="val">Class ${student.class || '—'}</td></tr>
            <tr><td class="lbl">Aadhar Number</td><td class="colon">:</td><td class="val">${student.aadharNumber || '—'}</td></tr>
            <tr><td class="lbl">PEN Number</td><td class="colon">:</td><td class="val">${student.penNumber || '—'}</td></tr>
        </table>

        <!-- Parent / Guardian Details -->
        <div class="sec-heading">&#9654; Parent / Guardian Details</div>
        <table class="info-grid">
            <tr><td class="lbl">Father's Name</td><td class="colon">:</td><td class="val">${student.fatherName || '—'}</td></tr>
            <tr><td class="lbl">Father's Mobile</td><td class="colon">:</td><td class="val">${student.fatherMobile || '—'}</td></tr>
            <tr><td class="lbl">Mother's Name</td><td class="colon">:</td><td class="val">${student.motherName || '—'}</td></tr>
            <tr><td class="lbl">Mother's Mobile</td><td class="colon">:</td><td class="val">${student.motherMobile || '—'}</td></tr>
            ${student.guardianName ? `<tr><td class="lbl">Guardian's Name</td><td class="colon">:</td><td class="val">${student.guardianName}</td></tr>` : ''}
            ${student.guardianMobile ? `<tr><td class="lbl">Guardian's Mobile</td><td class="colon">:</td><td class="val">${student.guardianMobile}</td></tr>` : ''}
            <tr><td class="lbl">Parent Email</td><td class="colon">:</td><td class="val">${student.parentEmail || '—'}</td></tr>
            <tr><td class="lbl">Residential Address</td><td class="colon">:</td><td class="val">${student.address || '—'}${student.pincode ? ', ' + student.pincode : ''}</td></tr>
        </table>

        <!-- Documents Received -->
        <div class="sec-heading">&#9654; Documents Received</div>
        <table class="doc-table">
            ${docRows || '<tr><td class="doc-label" colspan="2">No document information available</td></tr>'}
        </table>

        <!-- Declaration -->
        <div class="declaration">
            I/We hereby declare that the above information is true and correct to the best of my/our knowledge. I/We agree
            to abide by the rules and regulations of the school and undertake to pay the fees regularly. I/We understand
            that in case of any false information, the admission may be cancelled at any time.
        </div>

        <!-- Signatures -->
        <div class="sig-row">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Parent / Guardian Signature</div>
                <div class="sig-sub">Date: ________________</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Class Teacher</div>
                <div class="sig-sub">Signature &amp; Stamp</div>
            </div>
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-label">Principal / Head of School</div>
                <div class="sig-sub">Signature &amp; Seal</div>
            </div>
        </div>

        <!-- Footer -->
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
