
import jsPDF from 'jspdf';
import type { ResumeData } from './types';

export function generateResumePDF(resumeData: ResumeData): jsPDF {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  pdf.setFont('times', 'normal');
  pdf.setFontSize(11);
  let yPosition = 25.4; // 25.4mm top padding
  const leftMargin = 25.4; // 25.4mm left
  const rightMargin = 210 - 25.4; // 25.4mm right
  const lineHeight = 5.1; // 1.3 line height for 11pt
  const sectionSpacing = 7; // 18pt section gap

  // Helper to add an icon (SVG/PNG) next to text
  const addIcon = (iconData: string, x: number, y: number, width: number, height: number) => {
    pdf.addImage(iconData, 'PNG', x, y, width, height);
  };

  // Helper for section headings
  const addSectionHeading = (title: string) => {
    yPosition += sectionSpacing;
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 86, 179);
    pdf.setFontSize(12);
    pdf.text(title.toUpperCase(), leftMargin, yPosition);
    pdf.setDrawColor(186, 206, 246);
    pdf.setLineWidth(0.57);
    pdf.line(leftMargin, yPosition + 2, rightMargin, yPosition + 2); // Underline
    yPosition += 6.5; // Tight gap after heading for pixel-perfect look
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(34, 34, 34);
    pdf.setFontSize(11);
  };

  // Header: Name centered, bold, uppercase, 18pt
  if (resumeData?.contactInfo?.name) {
    pdf.setFont('times', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    const nameText = resumeData.contactInfo.name.toUpperCase();
    const nameWidth = pdf.getTextWidth(nameText);
    const nameX = (210 - nameWidth) / 2;
    pdf.text(nameText, nameX, yPosition);
    yPosition += 8;
    pdf.setFontSize(11);
    pdf.setFont('times', 'normal');
    pdf.setTextColor(51, 51, 51); // #333
    // Contact info centered, 11pt, line height 1.4
    let contactY = yPosition;
    const contactLines = [];
    let contactLine = '';
    if (resumeData.contactInfo.phone) contactLine += resumeData.contactInfo.phone;
    if (resumeData.contactInfo.email) contactLine += (contactLine ? ' | ' : '') + resumeData.contactInfo.email;
    if (contactLine) contactLines.push(contactLine);
    if (resumeData.contactInfo.location) contactLines.push(resumeData.contactInfo.location);
    let socialLine = '';
    if (resumeData.contactInfo.linkedin) socialLine += 'LinkedIn: ' + resumeData.contactInfo.linkedin.replace('https://', '').replace('http://', '');
    if (resumeData.contactInfo.linkedin && resumeData.contactInfo.github) socialLine += ' | ';
    if (resumeData.contactInfo.github) socialLine += 'GitHub: ' + resumeData.contactInfo.github.replace('https://', '').replace('http://', '');
    if (socialLine) contactLines.push(socialLine);
    contactLines.forEach(line => {
      const lineWidth = pdf.getTextWidth(line);
      const lineX = (210 - lineWidth) / 2;
      pdf.text(line, lineX, contactY);
      contactY += 6.5; // 1.4 line height for 11pt
    });
    yPosition = contactY + 6; // 20pt bottom margin
    pdf.setTextColor(0, 0, 0);
  }

  // Contact Info with PNG/SVG icons for pixel-perfect output
  const contactInfo = [];
  // Define base64 PNGs for icons (replace these with your actual base64 PNGs)
  const phoneIcon = '';
  const emailIcon = '';
  const locationIcon = '';
  const linkedinIcon = '';
  const githubIcon = '';
  if (resumeData?.contactInfo?.phone) contactInfo.push({ icon: phoneIcon, value: resumeData.contactInfo.phone });
  if (resumeData?.contactInfo?.email) contactInfo.push({ icon: emailIcon, value: resumeData.contactInfo.email });
  if (resumeData?.contactInfo?.location) contactInfo.push({ icon: locationIcon, value: resumeData.contactInfo.location });
  if (resumeData?.contactInfo?.linkedin) {
    const linkedinUsername = resumeData.contactInfo.linkedin.replace('https://www.linkedin.com/in/', '').replace('linkedin.com/in/', '');
    contactInfo.push({ icon: linkedinIcon, value: linkedinUsername });
  }
  if (resumeData?.contactInfo?.github) {
    const githubUsername = resumeData.contactInfo.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '');
    contactInfo.push({ icon: githubIcon, value: githubUsername });
  }
  if (contactInfo.length > 0) {
    // Center contact row, 120mm wide
    pdf.setTextColor(68, 68, 68);
    pdf.setFontSize(11);
    let totalWidth = 0;
    contactInfo.forEach((item) => {
      totalWidth += (item.icon ? 7 : 0) + pdf.getTextWidth(item.value) + 10;
    });
    let contactX = (210 - totalWidth) / 2;
    contactInfo.forEach((item, idx) => {
      if (item.icon) {
        addIcon(item.icon, contactX, yPosition - 2, 5.5, 5.5); // Adjust y for vertical alignment
        contactX += 7; // icon width + gap
      }
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.value, contactX, yPosition + 3); // Adjust y for vertical alignment
      contactX += pdf.getTextWidth(item.value) + 10;
    });
    yPosition += 12; // More spacing for pixel-perfect look
    pdf.setTextColor(34, 34, 34);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
  }

  // Summary
  if (resumeData?.summary?.text) {
    addSectionHeading('Professional Summary');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(34, 34, 34);
    const summaryLines = pdf.splitTextToSize(resumeData.summary.text, rightMargin - leftMargin);
    pdf.text(summaryLines, leftMargin, yPosition);
    yPosition += summaryLines.length * 6.5 + 2; // 1.4 line height, tight gap after summary
  }

  // Skills
  if (resumeData?.skills && Object.keys(resumeData.skills).length > 0) {
    addSectionHeading('Technical Skills');
    Object.entries(resumeData.skills).forEach(([category, skills]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(34, 86, 179);
      pdf.text(`${category}:`, leftMargin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(34, 34, 34);
      const skillsText = ` ${skills}`;
      const categoryWidth = pdf.getTextWidth(`${category}:`);
      pdf.text(skillsText, leftMargin + categoryWidth, yPosition);
      yPosition += 6.5;
    });
    yPosition += 2; // Tight gap after skills
  }

  // Experience
  if (resumeData?.workExperience && resumeData.workExperience.length > 0) {
    addSectionHeading('Professional Experience');
    resumeData.workExperience.forEach((exp: any, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 25.4;
      }
      // Pixel-perfect layout: left for role/company, right for date range
      pdf.setFont('times', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.text(exp.role || 'Role Not Specified', leftMargin, yPosition);
      pdf.setFontSize(11);
      pdf.setFont('times', 'italic');
      pdf.text(`${exp.company || 'Company'} | ${exp.location || 'Location'}`, leftMargin, yPosition + 6);
      pdf.setFont('times', 'bold');
      let startDateStr = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
      let endDateStr = exp.isCurrent ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present');
      const dateRange = `${startDateStr} - ${endDateStr}`;
      const dateWidth = pdf.getTextWidth(dateRange);
      pdf.text(dateRange, rightMargin - dateWidth, yPosition);
      yPosition += 12; // 12pt gap after entry
      pdf.setFont('times', 'normal');
      if (exp.descriptionPoints && exp.descriptionPoints.length > 0) {
        exp.descriptionPoints.forEach((point: string) => {
          if (point) {
            const bulletPoint = `• ${point}`;
            const pointLines = pdf.splitTextToSize(bulletPoint, rightMargin - leftMargin - 6);
            pdf.text(pointLines, leftMargin + 6, yPosition, { align: 'justify' });
            yPosition += pointLines.length * 6.5; // 1.4 line height for 11pt
          }
        });
      }
      if (index < resumeData.workExperience.length - 1) {
        yPosition += 4; // 12pt gap between experiences
      }
    });
    yPosition += 6; // 18pt section gap
  }

  // Projects
  if (resumeData?.projects && resumeData.projects.length > 0) {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 25.4;
    }
    addSectionHeading('Projects');
    resumeData.projects.forEach((project: any, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 25.4;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(34, 34, 34);
      pdf.text(project.name || 'Project', leftMargin, yPosition);
      if (project.startDate || project.endDate) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(34, 86, 179);
        const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present';
        const endDate = project.isCurrent ? 'Present' : (project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present');
        const dateRange = `${startDate} - ${endDate}`;
        const dateWidth = pdf.getTextWidth(dateRange);
        pdf.text(dateRange, rightMargin - dateWidth, yPosition);
      }
      yPosition += 6.5;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(34, 34, 34);
      if (project.description) {
        const descLines = pdf.splitTextToSize(project.description, rightMargin - leftMargin);
        pdf.text(descLines, leftMargin, yPosition);
        yPosition += descLines.length * 6.5 + 1;
      }
      if (index < resumeData.projects.length - 1) {
        yPosition += 2; // Tight gap between projects
      }
    });
    yPosition += 2; // Tight gap after projects section
  }

  // Education
  if (resumeData?.education && resumeData.education.length > 0) {
    if (yPosition > 240) {
      pdf.addPage();
      yPosition = 25.4;
    }
    addSectionHeading('Education');
    resumeData.education.forEach((edu: any, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 25.4;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(34, 34, 34);
      pdf.text(edu.degree || 'Degree', leftMargin, yPosition);
      if (edu.endDate) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(34, 86, 179);
        const endDate = new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const dateWidth = pdf.getTextWidth(endDate);
        pdf.text(endDate, rightMargin - dateWidth, yPosition);
      }
      yPosition += 6.5;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(11);
      pdf.setTextColor(34, 34, 34);
      const institutionText = `${edu.institution || 'Institution'} | ${edu.location || 'Location'}`;
      pdf.text(institutionText, leftMargin, yPosition);
      yPosition += 6.5; // Tight gap after education institution
      if (index < resumeData.education.length - 1) {
        yPosition += 2; // Tight gap between education entries
      }
    });
  }

  return pdf;
}

export function downloadResumePDF(resumeData: ResumeData, filename?: string) {
  const pdf = generateResumePDF(resumeData);
  const finalFilename = filename || `${resumeData?.contactInfo?.name || 'Resume'}.pdf`;
  pdf.save(finalFilename);
}