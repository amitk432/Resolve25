'use client';

import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import type { ResumeData } from './types';

interface PDFGeneratorOptions {
  resumeData: ResumeData;
  fileName?: string;
}

export class HighQualityPDFGenerator {
  private doc: PDFDocument;
  private currentPage: PDFPage;
  private currentY: number;
  private margin = {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  };
  private pageWidth: number;
  private pageHeight: number;
  private fonts: any = {};

  constructor() {
    this.doc = null as any;
    this.currentPage = null as any;
    this.currentY = 0;
    this.pageWidth = 0;
    this.pageHeight = 0;
  }

  async initialize() {
    this.doc = await PDFDocument.create();
    this.currentPage = this.doc.addPage();
    const { width, height } = this.currentPage.getSize();
    this.pageWidth = width;
    this.pageHeight = height;
    this.currentY = height - this.margin.top;

    // Load fonts
    this.fonts = {
      regular: await this.doc.embedFont(StandardFonts.Helvetica),
      bold: await this.doc.embedFont(StandardFonts.HelveticaBold),
      italic: await this.doc.embedFont(StandardFonts.HelveticaOblique),
      boldItalic: await this.doc.embedFont(StandardFonts.HelveticaBoldOblique),
    };
  }

  private checkPageSpace(requiredHeight: number): void {
    if (this.currentY - requiredHeight < this.margin.bottom) {
      this.addNewPage();
    }
  }

  private addNewPage(): void {
    this.currentPage = this.doc.addPage();
    this.currentY = this.pageHeight - this.margin.top;
  }

  private drawText(text: string, x: number, y: number, options: any = {}): number {
    const {
      font = this.fonts.regular,
      size = 11,
      color = rgb(0, 0, 0),
      maxWidth = this.pageWidth - this.margin.left - this.margin.right,
      align = 'left'
    } = options;

    // Handle text wrapping with proper word breaks
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = font.widthOfTextAtSize(testLine, size);
      
      if (textWidth <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Handle very long words
          lines.push(word);
          currentLine = '';
        }
      }
    }
    if (currentLine) lines.push(currentLine);

    // Draw each line with proper spacing
    let currentY = y;
    for (let i = 0; i < lines.length; i++) {
      this.checkPageSpace(size + 4);
      
      let drawX = x;
      if (align === 'center') {
        const lineWidth = font.widthOfTextAtSize(lines[i], size);
        drawX = x + (maxWidth - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = font.widthOfTextAtSize(lines[i], size);
        drawX = x + maxWidth - lineWidth;
      }
      
      this.currentPage.drawText(lines[i], {
        x: drawX,
        y: currentY,
        size,
        font,
        color
      });
      
      currentY -= (size + 4);
    }

    return currentY - 8; // Return the new Y position
  }

  private drawSectionHeader(title: string): void {
    this.checkPageSpace(25);
    
    // Draw title
    this.currentPage.drawText(title.toUpperCase(), {
      x: this.margin.left,
      y: this.currentY,
      size: 12,
      font: this.fonts.bold,
      color: rgb(0, 0.34, 0.7) // Blue color #0056b3
    });

    // Draw underline
    this.currentPage.drawLine({
      start: { x: this.margin.left, y: this.currentY - 3 },
      end: { x: this.pageWidth - this.margin.right, y: this.currentY - 3 },
      thickness: 1.5,
      color: rgb(0, 0.34, 0.7)
    });

    this.currentY -= 20;
  }

  private drawContactInfo(contactInfo: any): void {
    // Name - centered and properly sized
    this.checkPageSpace(35);
    const nameText = contactInfo.name?.toUpperCase() || 'NAME NOT AVAILABLE';
    const nameWidth = this.fonts.bold.widthOfTextAtSize(nameText, 18);
    const nameX = (this.pageWidth - nameWidth) / 2;
    
    this.currentPage.drawText(nameText, {
      x: nameX,
      y: this.currentY,
      size: 18,
      font: this.fonts.bold,
      color: rgb(0, 0.34, 0.7)
    });
    this.currentY -= 28;

    // Contact details in a centered line matching the expected output
    const contactDetails = [];
    if (contactInfo.phone) contactDetails.push(`${contactInfo.phone}`);
    if (contactInfo.email) contactDetails.push(`${contactInfo.email}`);
    if (contactInfo.location) contactDetails.push(`${contactInfo.location}`);
    if (contactInfo.linkedin) {
      const linkedinHandle = contactInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '');
      contactDetails.push(`${linkedinHandle}`);
    }
    if (contactInfo.github) {
      const githubHandle = contactInfo.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');
      contactDetails.push(`${githubHandle}`);
    }

    if (contactDetails.length > 0) {
      const contactLine = contactDetails.join(' | ');
      const maxWidth = this.pageWidth - this.margin.left - this.margin.right;
      
      // Check if it fits on one line
      const contactWidth = this.fonts.regular.widthOfTextAtSize(contactLine, 10);
      
      if (contactWidth <= maxWidth) {
        // Single line - center it
        const contactX = Math.max(this.margin.left, (this.pageWidth - contactWidth) / 2);
        
        this.checkPageSpace(15);
        this.currentPage.drawText(contactLine, {
          x: contactX,
          y: this.currentY,
          size: 10,
          font: this.fonts.regular,
          color: rgb(0.27, 0.27, 0.27)
        });
        this.currentY -= 15;
      } else {
        // Multi-line - use text wrapping
        const newY = this.drawText(contactLine, this.margin.left, this.currentY, {
          font: this.fonts.regular,
          size: 10,
          color: rgb(0.27, 0.27, 0.27),
          maxWidth: maxWidth,
          align: 'center'
        });
        this.currentY = newY;
      }
    }
    this.currentY -= 15;
  }

  private drawProfessionalSummary(summary: any): void {
    if (!summary?.text) return;
    
    this.drawSectionHeader('Professional Summary');
    
    const newY = this.drawText(summary.text, this.margin.left, this.currentY, {
      font: this.fonts.regular,
      size: 10.5,
      color: rgb(0.13, 0.13, 0.13),
      maxWidth: this.pageWidth - this.margin.left - this.margin.right
    });
    
    this.currentY = newY - 15; // Add section spacing
  }

  private drawSkills(skills: Record<string, string>): void {
    if (!skills || Object.keys(skills).length === 0) {
      return;
    }

    this.drawSectionHeader('Skills');
    
    const maxWidth = this.pageWidth - this.margin.left - this.margin.right;
    
    for (const [category, skillList] of Object.entries(skills)) {
      // Skip empty skills
      if (!skillList || !skillList.trim()) {
        continue;
      }
      
      this.checkPageSpace(18);
      
      // Calculate the full text to check if it fits on one line
      const fullText = `${category}: ${skillList}`;
      const fullTextWidth = this.fonts.regular.widthOfTextAtSize(fullText, 10.5);
      
      if (fullTextWidth <= maxWidth) {
        // Single line - draw category in bold, skills in regular
        const categoryText = `${category}: `;
        const categoryWidth = this.fonts.bold.widthOfTextAtSize(categoryText, 10.5);
        
        this.currentPage.drawText(categoryText, {
          x: this.margin.left,
          y: this.currentY,
          size: 10.5,
          font: this.fonts.bold,
          color: rgb(0, 0.34, 0.7)
        });

        this.currentPage.drawText(skillList, {
          x: this.margin.left + categoryWidth,
          y: this.currentY,
          size: 10.5,
          font: this.fonts.regular,
          color: rgb(0.13, 0.13, 0.13)
        });
        
        this.currentY -= 16;
      } else {
        // Multi-line - draw category in bold first, then skills wrapped below
        this.currentPage.drawText(`${category}:`, {
          x: this.margin.left,
          y: this.currentY,
          size: 10.5,
          font: this.fonts.bold,
          color: rgb(0, 0.34, 0.7)
        });
        
        this.currentY -= 16;
        
        const newY = this.drawText(skillList, this.margin.left, this.currentY, {
          font: this.fonts.regular,
          size: 10.5,
          color: rgb(0.13, 0.13, 0.13),
          maxWidth: maxWidth
        });
        this.currentY = newY - 4;
      }
    }
    this.currentY -= 10; // Add section spacing
  }

  private formatDateRange(startDate: string | null, endDate: string | null, isCurrent: boolean): string {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch {
        return dateStr || '';
      }
    };

    const start = formatDate(startDate) || 'Present';
    const end = isCurrent ? 'Present' : (formatDate(endDate) || 'Present');
    return `${start} - ${end}`;
  }

  private drawWorkExperience(workExperience: any[]): void {
    if (!workExperience || workExperience.length === 0) return;

    this.drawSectionHeader('Professional Experience');

    for (let i = 0; i < workExperience.length; i++) {
      const exp = workExperience[i];
      this.checkPageSpace(50);

      // Job title and date range on same line
      const jobTitle = exp.role || 'Role Not Specified';
      const dateRange = this.formatDateRange(exp.startDate, exp.endDate, exp.isCurrent);
      
      // Calculate positions
      const titleWidth = this.fonts.bold.widthOfTextAtSize(jobTitle, 10.5);
      const dateWidth = this.fonts.bold.widthOfTextAtSize(dateRange, 10.5);
      const availableWidth = this.pageWidth - this.margin.left - this.margin.right;
      
      // Draw job title
      this.currentPage.drawText(jobTitle, {
        x: this.margin.left,
        y: this.currentY,
        size: 10.5,
        font: this.fonts.bold,
        color: rgb(0.13, 0.13, 0.13)
      });

      // Draw date range (right aligned)
      this.currentPage.drawText(dateRange, {
        x: this.pageWidth - this.margin.right - dateWidth,
        y: this.currentY,
        size: 10.5,
        font: this.fonts.bold,
        color: rgb(0, 0.34, 0.7)
      });

      this.currentY -= 16;

      // Company and location
      const companyLocation = `${exp.company || 'Company'} | ${exp.location || 'Location'}`;
      this.currentPage.drawText(companyLocation, {
        x: this.margin.left,
        y: this.currentY,
        size: 10.5,
        font: this.fonts.italic,
        color: rgb(0.27, 0.27, 0.27)
      });

      this.currentY -= 18;

      // Description points with proper bullet alignment
      if (exp.descriptionPoints && exp.descriptionPoints.length > 0) {
        for (const point of exp.descriptionPoints) {
          if (point && point.trim()) {
            this.checkPageSpace(20);
            
            // Draw bullet point using simple character
            this.currentPage.drawText('-', {
              x: this.margin.left + 12,
              y: this.currentY,
              size: 10.5,
              font: this.fonts.regular,
              color: rgb(0.13, 0.13, 0.13)
            });

            // Draw point text with proper wrapping and indentation
            const newY = this.drawText(point, this.margin.left + 24, this.currentY, {
              font: this.fonts.regular,
              size: 10.5,
              color: rgb(0.13, 0.13, 0.13),
              maxWidth: this.pageWidth - this.margin.left - this.margin.right - 36
            });
            
            this.currentY = newY - 2;
          }
        }
      }

      // Add spacing between work experiences
      if (i < workExperience.length - 1) {
        this.currentY -= 12;
      }
    }
    
    this.currentY -= 15; // Add section spacing
  }

  private drawProjects(projects: any[]): void {
    if (!projects || projects.length === 0) return;

    this.drawSectionHeader('Projects');

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      this.checkPageSpace(35);

      // Project name and date on same line
      const projectName = project.name || 'Project Name';
      this.currentPage.drawText(projectName, {
        x: this.margin.left,
        y: this.currentY,
        size: 10.5,
        font: this.fonts.bold,
        color: rgb(0.13, 0.13, 0.13)
      });

      // Add date if available (right aligned)
      if (project.date) {
        const dateWidth = this.fonts.regular.widthOfTextAtSize(project.date, 10.5);
        this.currentPage.drawText(project.date, {
          x: this.pageWidth - this.margin.right - dateWidth,
          y: this.currentY,
          size: 10.5,
          font: this.fonts.regular,
          color: rgb(0, 0.34, 0.7)
        });
      }

      this.currentY -= 16;

      // Technologies
      if (project.technologies) {
        const techText = `Technologies: ${project.technologies}`;
        this.currentPage.drawText(techText, {
          x: this.margin.left,
          y: this.currentY,
          size: 10,
          font: this.fonts.italic,
          color: rgb(0.27, 0.27, 0.27)
        });
        this.currentY -= 14;
      }

      // Description with proper wrapping
      if (project.description) {
        const newY = this.drawText(project.description, this.margin.left, this.currentY, {
          font: this.fonts.regular,
          size: 10.5,
          color: rgb(0.13, 0.13, 0.13),
          maxWidth: this.pageWidth - this.margin.left - this.margin.right
        });
        this.currentY = newY;
      }

      // Add spacing between projects
      if (i < projects.length - 1) {
        this.currentY -= 12;
      }
    }
    
    this.currentY -= 15; // Add section spacing
  }

  private drawEducation(education: any[]): void {
    if (!education || education.length === 0) return;

    this.drawSectionHeader('Education');

    for (let i = 0; i < education.length; i++) {
      const edu = education[i];
      this.checkPageSpace(30);

      // Degree and year on same line
      const degree = edu.degree || 'Degree';
      this.currentPage.drawText(degree, {
        x: this.margin.left,
        y: this.currentY,
        size: 10.5,
        font: this.fonts.bold,
        color: rgb(0.13, 0.13, 0.13)
      });

      // Year (right aligned)
      if (edu.year) {
        const yearWidth = this.fonts.regular.widthOfTextAtSize(edu.year, 10.5);
        this.currentPage.drawText(edu.year, {
          x: this.pageWidth - this.margin.right - yearWidth,
          y: this.currentY,
          size: 10.5,
          font: this.fonts.regular,
          color: rgb(0, 0.34, 0.7)
        });
      }

      this.currentY -= 16;

      // Institution with proper wrapping
      const institution = edu.institution || 'Institution';
      const newY = this.drawText(institution, this.margin.left, this.currentY, {
        font: this.fonts.italic,
        size: 10.5,
        color: rgb(0.27, 0.27, 0.27),
        maxWidth: this.pageWidth - this.margin.left - this.margin.right
      });
      
      this.currentY = newY;

      // Add spacing between education entries
      if (i < education.length - 1) {
        this.currentY -= 12;
      }
    }
    
    this.currentY -= 15; // Add section spacing
  }

  async generatePDF(options: PDFGeneratorOptions): Promise<Uint8Array> {
    const { resumeData } = options;

    await this.initialize();

    // Draw all sections
    this.drawContactInfo(resumeData.contactInfo);
    this.drawProfessionalSummary(resumeData.summary);
    this.drawSkills(resumeData.skills);
    this.drawWorkExperience(resumeData.workExperience);
    this.drawProjects(resumeData.projects);
    this.drawEducation(resumeData.education);

    return await this.doc.save();
  }

  static async downloadResume(resumeData: ResumeData, fileName = 'resume.pdf'): Promise<void> {
    const generator = new HighQualityPDFGenerator();
    const pdfBytes = await generator.generatePDF({ resumeData });

    // Create download link
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Legacy function for backward compatibility
export async function generateResumePDF(resumeData: ResumeData): Promise<Uint8Array> {
  const generator = new HighQualityPDFGenerator();
  return generator.generatePDF({ resumeData });
}

export default HighQualityPDFGenerator;
