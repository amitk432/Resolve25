import React, { useRef } from 'react';
import type { ResumeData } from '@/lib/types';

interface ResumeTemplateProps {
  resumeData: ResumeData;
}

const ResumeTemplateNew: React.FC<ResumeTemplateProps> = ({ resumeData }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent: boolean) => {
    const start = formatDate(startDate) || 'Present';
    const end = isCurrent ? 'Present' : (formatDate(endDate) || 'Present');
    return `${start} - ${end}`;
  };
  const previewRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const html2pdf = (await import('html2pdf.js')).default;
    const element = previewRef.current;
    if (element) {
      html2pdf()
        .set({
          margin: 0,
          filename: `${resumeData?.contactInfo?.name || 'Resume'}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .save();
    }
  };

  return (
    <>
      <button
        onClick={handleDownloadPDF}
        style={{
          marginBottom: '16px',
          padding: '8px 20px',
          background: '#2256b3',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          fontWeight: 600,
          cursor: 'pointer',
          float: 'right'
        }}
      >
        Download PDF
      </button>
      <div
        id="resume-preview"
        ref={previewRef}
        className="bg-white text-black"
        style={{
          width: '210mm',
          minHeight: '297mm',
          fontFamily: 'Times, \"Times New Roman\", serif',
          fontSize: '11pt',
          lineHeight: '1.3',
          padding: '25.4mm',
          boxSizing: 'border-box',
          margin: '0 auto'
        }}
      >
        {/* Place your full resume preview JSX here, as previously implemented */}
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20pt' }}>
        <h1 style={{ 
          fontSize: '18pt', 
          fontWeight: 'bold', 
          margin: '0 0 8pt 0',
          textTransform: 'uppercase',
          letterSpacing: '1pt'
        }}>
          {resumeData.contactInfo.name}
        </h1>
        <div style={{ 
          fontSize: '11pt', 
          lineHeight: '1.4',
          color: '#333'
        }}>
          <div>{resumeData.contactInfo.phone} | {resumeData.contactInfo.email}</div>
          <div>{resumeData.contactInfo.location}</div>
          <div>
            {resumeData.contactInfo.linkedin && (
              <span>LinkedIn: {resumeData.contactInfo.linkedin.replace('https://', '').replace('http://', '')}</span>
            )}
            {resumeData.contactInfo.linkedin && resumeData.contactInfo.github && ' | '}
            {resumeData.contactInfo.github && (
              <span>GitHub: {resumeData.contactInfo.github.replace('https://', '').replace('http://', '')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.summary && (
        <div style={{ marginBottom: '18pt' }}>
          <h2 style={{ 
            fontSize: '14pt', 
            fontWeight: 'bold', 
            borderBottom: '1pt solid #000',
          }}>
            PROFESSIONAL SUMMARY
          </h2>
          <div>{resumeData.summary.text}</div>
        </div>
      )}

      {/* Skills */}
      {Object.keys(resumeData.skills).length > 0 && (
        <div style={{ marginBottom: '18pt' }}>
          <h2 style={{ 
            fontSize: '14pt', 
            fontWeight: 'bold', 
            borderBottom: '1pt solid #000',
            marginBottom: '8pt',
            paddingBottom: '2pt',
            textTransform: 'uppercase'
          }}>
            Technical Skills
          </h2>
          {Object.entries(resumeData.skills).map(([category, skills]) => (
            <div key={category} style={{ marginBottom: '6pt' }}>
              <span style={{ fontWeight: 'bold' }}>{category}:</span>{' '}
              <span>{skills}</span>
            </div>
          ))}
        </div>
      )}

      {/* Professional Experience */}
      {resumeData.workExperience.length > 0 && (
        <div style={{ marginBottom: '18pt' }}>
          <h2 style={{ 
            fontSize: '14pt', 
            fontWeight: 'bold', 
            borderBottom: '1pt solid #000',
            marginBottom: '8pt',
            paddingBottom: '2pt',
            textTransform: 'uppercase'
          }}>
            Professional Experience
          </h2>
          {resumeData.workExperience.map((exp, index) => (
            <div key={index} style={{ marginBottom: index < resumeData.workExperience.length - 1 ? '12pt' : '0' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '4pt'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                    {exp.role}
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>
                    {exp.company} | {exp.location}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '11pt',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  marginLeft: '20pt'
                }}>
                  {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                </div>
              </div>
              {exp.descriptionPoints.length > 0 && (
                <ul style={{ 
                  margin: '6pt 0 0 20pt',
                  padding: '0',
                  listStyleType: 'disc'
                }}>
                  {exp.descriptionPoints.map((point, pointIndex) => (
                    <li key={pointIndex} style={{ 
                      marginBottom: '3pt',
                      textAlign: 'justify',
                      lineHeight: '1.4'
                    }}>
                      {point}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {resumeData.projects.length > 0 && (
        <div style={{ marginBottom: '18pt' }}>
          <h2 style={{ 
            fontSize: '14pt', 
            fontWeight: 'bold', 
            borderBottom: '1pt solid #000',
            marginBottom: '8pt',
            paddingBottom: '2pt',
            textTransform: 'uppercase'
          }}>
            Projects
          </h2>
          {resumeData.projects.map((project, index) => (
            <div key={index} style={{ marginBottom: index < resumeData.projects.length - 1 ? '10pt' : '0' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '4pt'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                  {project.name}
                </div>
                <div style={{ 
                  fontSize: '11pt',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  marginLeft: '20pt'
                }}>
                  {formatDateRange(project.startDate, project.endDate, project.isCurrent)}
                </div>
              </div>
              <p style={{ 
                margin: '0',
                textAlign: 'justify',
                lineHeight: '1.4'
              }}>
                {project.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {resumeData.education.length > 0 && (
        <div>
          <h2 style={{ 
            fontSize: '14pt', 
            fontWeight: 'bold', 
            borderBottom: '1pt solid #000',
            marginBottom: '8pt',
            paddingBottom: '2pt',
            textTransform: 'uppercase'
          }}>
            Education
          </h2>
          {resumeData.education.map((edu, index) => (
            <div key={index} style={{ marginBottom: index < resumeData.education.length - 1 ? '8pt' : '0' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'baseline'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>
                    {edu.degree}
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '11pt' }}>
                    {edu.institution} | {edu.location}
                  </div>
                </div>
                <div style={{ 
                  fontSize: '11pt',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  marginLeft: '20pt'
                }}>
                  {formatDate(edu.endDate)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
};

export default ResumeTemplateNew;
