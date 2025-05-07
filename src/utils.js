import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async () => {
  const input = document.getElementById('pdf-preview');

  const canvas = await html2canvas(input, {
    scale: 2, // Better resolution
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'pt', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgProps = pdf.getImageProperties(imgData);

  const pdfWidth = pageWidth;
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  const yOffset = 0;
  pdf.addImage(imgData, 'PNG', 0, yOffset, pdfWidth, pdfHeight);
  pdf.save('invoice.pdf');
};
