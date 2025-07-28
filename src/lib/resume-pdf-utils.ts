import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ResumeData } from '@/lib/types';

export async function downloadResumeAsPDF(
  resumeElement: HTMLElement, 
  fileName: string = 'resume.pdf'
): Promise<void> {
  try {
    // Configure html2canvas for high quality A4 size
    const canvas = await html2canvas(resumeElement, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width at 96 DPI
      height: 1123, // A4 height at 96 DPI
    });

    // A4 dimensions in mm
    const imgWidth = 210;
    const imgHeight = 297;

    // Calculate the actual height based on canvas ratio
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasHeight / canvasWidth;
    const pdfHeight = imgWidth * ratio;

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm', 
      format: 'a4'
    });
    
    // Convert canvas to image
    const imgData = canvas.toDataURL('image/png');
    
    // Add image to PDF
    if (pdfHeight <= imgHeight) {
      // Single page
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, pdfHeight);
    } else {
      // Multi-page if content is longer than A4
      let heightLeft = pdfHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= imgHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= imgHeight;
      }
    }

    // Download the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
}

export function generateResumeFileName(jobApplication: any): string {
  const company = jobApplication.company?.replace(/[^a-zA-Z0-9]/g, '_') || 'Company';
  const role = jobApplication.role?.replace(/[^a-zA-Z0-9]/g, '_') || 'Role';
  const date = new Date().toISOString().split('T')[0];
  
  return `Resume_${company}_${role}_${date}.pdf`;
}
