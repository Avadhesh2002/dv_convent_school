import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const FIELD_MAP = {
  name: "Name of Student",
  class: "Class",
  dateOfBirth: "Date of Birth",
  fatherName: "Father's Name",
  fatherMobile: "Contact No",
  aadharNumber: "Aadhar No",
  address: "Address"
};

export const generateStudentListPDF = (students, reportTitle, selectedFields) => {
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. MAIN HEADER (Centered & Pure Black)
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.text("DV CONVENT SCHOOL", pageWidth / 2, 50, { align: 'center' });
    
    // BROAD BLACK LINE (Image 1 Style)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.line(40, 60, pageWidth - 40, 60); 

    // SUB-HEADER (Report Title)
    doc.setFontSize(14);
    doc.setFont('times', 'normal');
    doc.text(reportTitle, pageWidth / 2, 85, { align: 'center' }); 

    // 2. DYNAMIC TABLE DATA
    const tableHeaders = ['S.No', ...selectedFields.map(key => FIELD_MAP[key])];

    const tableRows = students.map((student, index) => {
      const rowData = [index + 1];
      selectedFields.forEach(field => {
        let value = student[field];
        if (field === 'dateOfBirth' && value) {
          value = new Date(value).toLocaleDateString('en-GB');
        }
        rowData.push(value || "---");
      });
      return rowData;
    });

    // 3. TABLE GENERATION (Styled to match Image 1)
    autoTable(doc, {
      startY: 110,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid', 
      styles: { 
        font: 'times', 
        fontSize: 10, 
        cellPadding: 8, 
        textColor: [0, 0, 0], // Force pure black text for all
        lineColor: [0, 0, 0], // Pure black borders
        lineWidth: 0.8,       // Consistent broad border
      },
      headStyles: { 
        fillColor: [245, 245, 245], // LIGHT GRAY BACKGROUND (Exactly like Image 1)
        fontStyle: 'bold',          // BOLD HEADERS
        halign: 'center',
        lineWidth: 1.2              // Slightly thicker border for header row
      },
      bodyStyles: {
        fontStyle: 'normal',        // NORMAL STYLE FOR VALUES (Fixes overlap/clutter)
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'center' }, // S.No column
      },
      didDrawPage: (data) => {
        doc.setFont('times', 'italic');
        doc.setFontSize(8);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 40, pageHeight - 20);
      }
    });

    // 4. SIGNATURE AREA
    const finalY = doc.lastAutoTable.finalY + 60;
    doc.setLineWidth(1);
    doc.line(pageWidth - 200, finalY, pageWidth - 40, finalY);
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text("Principal Signature", pageWidth - 120, finalY + 20, { align: 'center' });

    // 5. SECURE SAVE
    const safeFileName = reportTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeFileName}.pdf`);

    return true;
  } catch (error) {
    console.error("PDF Logic Error:", error);
    throw error;
  }
};