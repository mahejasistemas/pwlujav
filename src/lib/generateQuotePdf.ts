import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface QuoteItem {
  origin: string;
  destination: string;
  vehicle: string;
  price: number;
  details?: any;
}

export interface QuoteData {
  id: string;
  clientName: string;
  projectName: string;
  date: string;
  amount: number;
  discount?: number;
  subtotal?: number;
  validUntil: string;
  items?: QuoteItem[];
}

export const generateQuotePDF = async (quote: QuoteData) => {
  try {
    // 1. Load the existing PDF template
    const existingPdfBytes = await fetch('/pdf/COSTOS5.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 2. Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // --- CONFIGURATION OF COORDINATES ---
    // Adjust these values to match your specific PDF template (COSTOS5.pdf)
    // Coordinates start from bottom-left (0,0) by default in PDF-lib
    
    // Helper to convert from top-left (easier for humans) to PDF bottom-left
    const y = (yFromTop: number) => height - yFromTop;

    const fontSize = 10;
    const color = rgb(0, 0, 0);

    // Header Data
    firstPage.drawText(quote.clientName || '', {
      x: 100, // Adjust horizontal position
      y: y(150), // Adjust vertical position from top
      size: fontSize,
      font: helveticaBold,
      color,
    });

    firstPage.drawText(quote.projectName || '', {
      x: 100,
      y: y(165),
      size: fontSize,
      font: helveticaFont,
      color,
    });

    firstPage.drawText(quote.date || '', {
      x: 450,
      y: y(150),
      size: fontSize,
      font: helveticaFont,
      color,
    });

    firstPage.drawText(`#${quote.id.substring(0, 8).toUpperCase()}`, {
      x: 450,
      y: y(135),
      size: fontSize,
      font: helveticaBold,
      color,
    });

    // Items Table (Starting position)
    let currentY = y(300); // Start Y position for items
    const itemSpacing = 20;

    if (quote.items && quote.items.length > 0) {
      quote.items.forEach((item) => {
        // Origin - Destination
        const description = `${item.origin} - ${item.destination}`;
        firstPage.drawText(description.substring(0, 50), { // Truncate if too long
          x: 50,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color,
        });

        // Vehicle
        firstPage.drawText(item.vehicle || 'Estándar', {
          x: 300,
          y: currentY,
          size: 9,
          font: helveticaFont,
          color,
        });

        // Price
        const priceText = `$ ${item.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        firstPage.drawText(priceText, {
          x: 500, // Right aligned roughly
          y: currentY,
          size: 9,
          font: helveticaFont,
          color,
        });

        currentY -= itemSpacing;
      });
    } else {
        // Fallback for manual total only
        firstPage.drawText(quote.projectName || 'Servicio General', {
            x: 50,
            y: currentY,
            size: 9,
            font: helveticaFont,
            color,
        });
        
        const priceText = `$ ${quote.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        firstPage.drawText(priceText, {
            x: 500,
            y: currentY,
            size: 9,
            font: helveticaFont,
            color,
        });
    }

    // Totals Section
    const totalsY = y(700); // Adjust this to be near the bottom where totals go
    
    firstPage.drawText(`$ ${(quote.subtotal || quote.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, {
      x: 500,
      y: totalsY,
      size: 10,
      font: helveticaFont,
      color,
    });

    if (quote.discount) {
        firstPage.drawText(`- $ ${quote.discount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, {
            x: 500,
            y: totalsY - 15,
            size: 10,
            font: helveticaFont,
            color: rgb(0.8, 0, 0),
        });
    }

    firstPage.drawText(`$ ${quote.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, {
      x: 500,
      y: totalsY - 30,
      size: 12,
      font: helveticaBold,
      color,
    });


    // 3. Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytesModified = await pdfDoc.save();

    // 4. Trigger the browser to download the PDF document
    const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cotizacion_${quote.id.substring(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Error al generar el PDF. Asegúrate de que el archivo template exista en /pdf/COSTOS5.pdf');
  }
};
