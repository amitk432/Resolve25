'use client';

import React, { forwardRef } from 'react';
import type { ResumeData } from '@/lib/types';

interface ResumeTemplatePreviewProps {
  resumeData: ResumeData;
}

const ResumeTemplatePreview = forwardRef<HTMLDivElement, ResumeTemplatePreviewProps>(
  ({ resumeData }, ref) => {
    // Add null checks
    if (!resumeData) {
      return (
        <div ref={ref} className="bg-white text-black p-4">
          <p>No resume data available</p>
        </div>
      );
    }

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } catch {
        return dateStr;
      }
    };

    const formatDateRange = (startDate: string | null, endDate: string | null, isCurrent: boolean): string => {
      const start = formatDate(startDate) || 'Present';
      const end = isCurrent ? 'Present' : (formatDate(endDate) || 'Present');
      return `${start} - ${end}`;
    };

    return (
      <div 
        ref={ref} 
        className="bg-white text-neutral-900"
        style={{
          width: '210mm',
          height: '297mm',
          fontFamily: 'Arial, Helvetica, "Liberation Sans", "DejaVu Sans", sans-serif', // ATS-friendly sans-serif
          fontSize: '11pt',
          lineHeight: '1.5', // More readable for ATS
          padding: '18mm 16mm 12mm 16mm',
          boxSizing: 'border-box',
          color: '#222',
          margin: '0',
          overflow: 'hidden',
          pageBreakInside: 'avoid',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '10pt' }}>
          <h1 style={{ 
            fontSize: '18pt', 
            fontWeight: 700, 
            margin: '0 0 2pt 0',
            textTransform: 'uppercase',
            letterSpacing: '0.5pt',
            color: '#0056b3', // Subtle blue for name
            fontFamily: 'Arial, Helvetica, sans-serif',
          }}>
            {resumeData?.contactInfo?.name || 'Name Not Available'}
          </h1>
          
          {/* Contact info in one line */}
          <div style={{
            fontSize: '10.5pt',
            lineHeight: '1.6',
            color: '#444',
            fontFamily: 'Arial, Helvetica, sans-serif',
            letterSpacing: '0.1pt',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
            fontWeight: 'normal',
          }}>
            {/* Phone */}
            {resumeData?.contactInfo?.phone && (
              <span key="phone" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '10.5pt',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 'normal',
                color: '#444',
                whiteSpace: 'nowrap'
              }}>
                <svg width="12" height="12" fill="#0056b3" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }} viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.21.49 2.53.76 3.88.76a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 22 2 13.93 2 4.5A1 1 0 013 3.5h3.5a1 1 0 011 1c0 1.35.27 2.67.76 3.88a1 1 0 01-.21 1.11l-2.2 2.2z"></path></svg>
                <span style={{ verticalAlign: 'middle' }}>{resumeData.contactInfo.phone}</span>
              </span>
            )}
            {/* Email */}
            {resumeData?.contactInfo?.email && (
              <span key="email" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '10.5pt',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 'normal',
                color: '#444',
                whiteSpace: 'nowrap'
              }}>
                <svg width="12" height="12" fill="#0056b3" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }} viewBox="0 0 24 24"><path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 2v.01L12 13 4 6.01V6h16zM4 20V8.24l7.12 6.16a1 1 0 001.36 0L20 8.24V20H4z"></path></svg>
                <a href={`mailto:${resumeData.contactInfo.email}`} style={{ 
                  color: '#0056b3', 
                  textDecoration: 'none',
                  fontSize: '10.5pt',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  fontWeight: 'normal',
                  verticalAlign: 'middle'
                }}>{resumeData.contactInfo.email}</a>
              </span>
            )}
            {/* Location */}
            {resumeData?.contactInfo?.location && (
              <span key="location" style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '10.5pt',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 'normal',
                color: '#444',
                whiteSpace: 'nowrap'
              }}>
                <svg width="12" height="12" fill="#0056b3" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z"></path></svg>
                <span style={{ verticalAlign: 'middle' }}>{resumeData.contactInfo.location}</span>
              </span>
            )}
            {/* LinkedIn */}
            {resumeData?.contactInfo?.linkedin && (
              <a key="linkedin" href={`https://linkedin.com/in/${resumeData.contactInfo.linkedin.replace('https://www.linkedin.com/in/', '').replace('linkedin.com/in/', '')}`} style={{ 
                color: '#0056b3', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '10.5pt',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 'normal',
                whiteSpace: 'nowrap'
              }} target="_blank" rel="noopener noreferrer">
                <svg width="12" height="12" fill="#0056b3" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }} viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.25c-.97 0-1.75-.78-1.75-1.75s.78-1.75 1.75-1.75 1.75.78 1.75 1.75-.78 1.75-1.75 1.75zm13.5 11.25h-3v-5.5c0-1.1-.9-2-2-2s-2 .9-2 2v5.5h-3v-10h3v1.25c.41-.59 1.09-1.25 2.09-1.25 2.21 0 4.41 1.79 4.41 4.5v5.5z"></path></svg>
                <span style={{ verticalAlign: 'middle' }}>{resumeData.contactInfo.linkedin.replace('https://www.linkedin.com/in/', '').replace('linkedin.com/in/', '')}</span>
              </a>
            )}
            {/* GitHub */}
            {resumeData?.contactInfo?.github && (
              <a key="github" href={`https://github.com/${resumeData.contactInfo.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}`} style={{ 
                color: '#0056b3', 
                textDecoration: 'none', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                fontSize: '10.5pt',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontWeight: 'normal',
                whiteSpace: 'nowrap'
              }} target="_blank" rel="noopener noreferrer">
                <svg width="12" height="12" fill="#0056b3" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.115 2.51.337 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.16.58.67.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"></path></svg>
                <span style={{ verticalAlign: 'middle' }}>{resumeData.contactInfo.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}</span>
              </a>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {resumeData?.summary?.text && (
          <div style={{ marginBottom: '10pt' }}>
            <div style={{
              fontSize: '12pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#0056b3',
              letterSpacing: '0.3pt',
              marginBottom: '4pt',
              position: 'relative',
              paddingBottom: '4pt',
              borderBottom: '1.5pt solid #0056b3',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}>Professional Summary</div>
            <p style={{ 
              textAlign: 'justify',
              lineHeight: '1.5',
              fontSize: '10.5pt',
              margin: '0',
              color: '#222',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}>
              {resumeData.summary.text}
            </p>
          </div>
        )}

        {/* Skills Section */}
        {resumeData?.skills && Object.keys(resumeData.skills).length > 0 && (
          <div style={{ marginBottom: '10pt' }}>
            <div style={{
              fontSize: '12pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#0056b3',
              letterSpacing: '0.3pt',
              marginBottom: '4pt',
              position: 'relative',
              paddingBottom: '4pt',
              borderBottom: '1.5pt solid #0056b3',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}>Skills</div>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'flex-start',
              fontFamily: 'Arial, Helvetica, sans-serif',
              fontSize: '10.5pt',
              lineHeight: '1.4',
              color: '#444',
              paddingTop: '2pt'
            }}>
              {Object.entries(resumeData.skills).map(([category, skills], index) => (
                <div key={index} style={{ 
                  display: 'inline-block',
                  marginBottom: '4pt',
                  marginRight: '12pt'
                }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: '#0056b3',
                    fontSize: '10.5pt',
                    fontFamily: 'Arial, Helvetica, sans-serif'
                  }}>
                    {category}:{' '}
                  </span>
                  <span style={{ 
                    color: '#222',
                    fontSize: '10.5pt',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    lineHeight: '1.4'
                  }}>
                    {skills}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}        {/* Professional Experience */}
        {resumeData?.workExperience && resumeData.workExperience.length > 0 && (
          <div style={{ marginBottom: '10pt' }}>
            <div style={{
              fontSize: '12pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#0056b3',
              letterSpacing: '0.3pt',
              marginBottom: '4pt',
              position: 'relative',
              paddingBottom: '4pt',
              borderBottom: '1.5pt solid #0056b3',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}>Professional Experience</div>
            {resumeData.workExperience.map((exp, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.workExperience.length - 1 ? '6pt' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2pt' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '10.5pt', color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }}>{exp?.role || 'Role Not Specified'}</div>
                    <div style={{ fontStyle: 'italic', fontSize: '10.5pt', color: '#444', fontFamily: 'Arial, Helvetica, sans-serif' }}>{exp?.company || 'Company'} | {exp?.location || 'Location'}</div>
                  </div>
                  <div style={{ fontSize: '10.5pt', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '20pt', color: '#0056b3', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    {formatDateRange(exp?.startDate || null, exp?.endDate || null, exp?.isCurrent || false)}
                  </div>
                </div>
                {exp?.descriptionPoints && exp.descriptionPoints.length > 0 && (
                  <ul style={{ 
                    margin: '3pt 0 0 0', 
                    padding: '0 0 0 18pt', 
                    listStyleType: 'disc',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    fontSize: '10.5pt',
                    color: '#222',
                    lineHeight: '1.5',
                    listStylePosition: 'outside'
                  }}>
                    {exp.descriptionPoints.map((point, pointIndex) => (
                      point && (
                        <li key={pointIndex} style={{ 
                          marginBottom: '2pt', 
                          textAlign: 'justify', 
                          lineHeight: '1.5', 
                          fontSize: '10.5pt', 
                          color: '#222', 
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          paddingLeft: '0',
                          marginLeft: '0',
                          position: 'relative',
                          display: 'list-item'
                        }}>{point}</li>
                      )
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {resumeData?.projects && resumeData.projects.length > 0 && (
          <div style={{ marginBottom: '10pt' }}>
            <div style={{
              fontSize: '12pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#0056b3',
              letterSpacing: '0.3pt',
              marginBottom: '4pt',
              position: 'relative',
              paddingBottom: '4pt',
              borderBottom: '1.5pt solid #0056b3',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}>Projects</div>
            {resumeData.projects.map((project, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.projects.length - 1 ? '6pt' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontWeight: 700, fontSize: '10.5pt', color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }}>{project?.name || 'Project'}</div>
                  <div style={{ fontSize: '10.5pt', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '20pt', color: '#0056b3', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    {formatDateRange(project?.startDate || null, project?.endDate || null, project?.isCurrent || false)}
                  </div>
                </div>
                {project?.description && (
                  <div style={{ textAlign: 'justify', lineHeight: '1.5', fontSize: '10.5pt', marginTop: '1pt', color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }}>{project.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Education - Moved to bottom */}
        {resumeData?.education && resumeData.education.length > 0 && (
          <div style={{ marginBottom: '0' }}>
            <div style={{
              fontSize: '12pt',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#0056b3',
              letterSpacing: '0.3pt',
              marginBottom: '4pt',
              position: 'relative',
              paddingBottom: '4pt',
              borderBottom: '1.5pt solid #0056b3',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}>Education</div>
            {resumeData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.education.length - 1 ? '6pt' : '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '10.5pt', color: '#222', fontFamily: 'Arial, Helvetica, sans-serif' }}>{edu?.degree || 'Degree'}</div>
                    <div style={{ fontStyle: 'italic', fontSize: '10.5pt', color: '#444', fontFamily: 'Arial, Helvetica, sans-serif' }}>{edu?.institution || 'Institution'} | {edu?.location || 'Location'}</div>
                  </div>
                  <div style={{ fontSize: '10.5pt', fontWeight: 700, whiteSpace: 'nowrap', marginLeft: '20pt', color: '#0056b3', fontFamily: 'Arial, Helvetica, sans-serif' }}>
                    {edu?.endDate ? formatDate(edu.endDate) : 'Present'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ResumeTemplatePreview.displayName = 'ResumeTemplatePreview';

export default ResumeTemplatePreview;
