
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function analyzePdf() {
  try {
    const pdfBytes = fs.readFileSync('public/pdf/COSTOS5.pdf');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    console.log('--- PDF Fields Analysis ---');
    if (fields.length === 0) {
      console.log('No form fields found in the PDF. It is likely a flat document.');
      
      // Get page dimensions to help with coordinate planning
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();
      console.log(`Page Dimensions: Width = ${width}, Height = ${height}`);
    } else {
      console.log(`Found ${fields.length} fields:`);
      fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        console.log(`- Name: "${name}", Type: ${type}`);
      });
    }
  } catch (error) {
    console.error('Error reading PDF:', error);
  }
}

analyzePdf();
