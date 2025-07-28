'use client';

import React, { forwardRef } from 'react';
import type { ResumeData } from '@/lib/types';

interface ResumeTemplateProps {
  resumeData: ResumeData;
}

const ResumeTemplate = forwardRef<HTMLDivElement, ResumeTemplateProps>(
  ({ resumeData }, ref) => {
    // Add null checks
    if (!resumeData) {
      return (
        <div ref={ref} className="bg-white text-black p-8">
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
        className="bg-white text-black"
        style={{
          width: '210mm',
          height: '297mm',
          fontFamily: 'Times, "Times New Roman", serif',
          fontSize: '11pt',
          lineHeight: '1.2',
          padding: '25mm 25mm 25mm 25mm',
          boxSizing: 'border-box',
          margin: '0',
          overflow: 'hidden',
          color: '#000000'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '6pt' }}>
          <h1 style={{ 
            fontSize: '18pt', 
            fontWeight: 'bold', 
            margin: '0 0 6pt 0',
            textTransform: 'uppercase',
            letterSpacing: '1pt',
            color: '#000000'
          }}>
            {resumeData?.contactInfo?.name || 'Name Not Available'}
          </h1>
          
          {/* Contact info in one line */}
          <div style={{ 
            fontSize: '11pt', 
            lineHeight: '1.2',
            color: '#000000',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px'
          }}>
            {resumeData?.contactInfo?.phone && (
              <span>{resumeData.contactInfo.phone}</span>
            )}
            {resumeData?.contactInfo?.email && (
              <span>|</span>
            )}
            {resumeData?.contactInfo?.email && (
              <a href={`mailto:${resumeData.contactInfo.email}`} style={{ color: '#000000', textDecoration: 'none' }}>
                {resumeData.contactInfo.email}
              </a>
            )}
            {resumeData?.contactInfo?.location && (
              <>
                <span>|</span>
                <span>{resumeData.contactInfo.location}</span>
              </>
            )}
            {resumeData?.contactInfo?.linkedin && (
              <>
                <span>|</span>
                <a 
                  href={resumeData.contactInfo.linkedin.startsWith('http') ? resumeData.contactInfo.linkedin : `https://linkedin.com/in/${resumeData.contactInfo.linkedin}`} 
                  style={{ color: '#000000', textDecoration: 'none' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resumeData.contactInfo.linkedin.replace('https://linkedin.com/in/', '').replace('https://www.linkedin.com/in/', '')}
                </a>
              </>
            )}
            {resumeData?.contactInfo?.github && (
              <>
                <span>|</span>
                <a 
                  href={resumeData.contactInfo.github.startsWith('http') ? resumeData.contactInfo.github : `https://github.com/${resumeData.contactInfo.github}`} 
                  style={{ color: '#000000', textDecoration: 'none' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resumeData.contactInfo.github.replace('https://github.com/', '')}
                </a>
              </>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {resumeData?.summary?.text && (
          <div style={{ marginBottom: '8pt' }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              marginBottom: '6pt',
              paddingBottom: '3pt',
              textTransform: 'uppercase',
              color: '#000000',
              borderBottom: '2pt solid #000000',
              letterSpacing: '0.5px'
            }}>
              Professional Summary
            </h2>
            <p style={{ 
              textAlign: 'justify',
              lineHeight: '1.3',
              fontSize: '11pt',
              margin: '0',
              color: '#000000'
            }}>
              {resumeData.summary.text}
            </p>
          </div>
        )}

        {/* Skills */}
        {resumeData?.skills && Object.keys(resumeData.skills).length > 0 && (
          <div style={{ marginBottom: '8pt' }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              borderBottom: '1pt solid #000000',
              marginBottom: '4pt',
              paddingBottom: '1pt',
              textTransform: 'uppercase',
              color: '#000000'
            }}>
              Skills
            </h2>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6pt',
              fontSize: '11pt',
              color: '#000000'
            }}>
              {Object.entries(resumeData.skills).map(([category, skillsString], categoryIndex) => (
                <div key={categoryIndex} style={{ 
                  minWidth: '120pt',
                  marginBottom: '3pt'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '1pt' }}>
                    {category}:
                  </div>
                  <div style={{ lineHeight: '1.2' }}>
                    {skillsString}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {resumeData?.skills && Object.keys(resumeData.skills).length > 0 && (
          <div style={{ marginBottom: '8pt' }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              borderBottom: '1pt solid #000',
              marginBottom: '4pt',
              paddingBottom: '1pt',
              textTransform: 'uppercase'
            }}>
              Technical Skills
            </h2>
            {Object.entries(resumeData.skills).map(([category, skills]) => (
              skills && (
                <div key={category} style={{ marginBottom: '3pt' }}>
                  <span style={{ fontWeight: 'bold' }}>{category}:</span>{' '}
                  <span>{skills}</span>
                </div>
              )
            ))}
          </div>
        )}

        {/* Professional Experience */}
        {resumeData?.workExperience && resumeData.workExperience.length > 0 && (
          <div style={{ 
            marginBottom: (resumeData?.education && resumeData.education.length > 0) || 
                         (resumeData?.projects && resumeData.projects.length > 0) ? '8pt' : '0' 
          }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              borderBottom: '1pt solid #000000',
              marginBottom: '4pt',
              paddingBottom: '1pt',
              textTransform: 'uppercase',
              color: '#000000'
            }}>
              Professional Experience
            </h2>
            {resumeData.workExperience.map((exp, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.workExperience.length - 1 ? '6pt' : '0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '2pt'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000000' }}>
                      {exp?.role || 'Role Not Specified'}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '11pt', color: '#000000' }}>
                      {exp?.company || 'Company'} | {exp?.location || 'Location'}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '11pt',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    marginLeft: '20pt',
                    color: '#000000'
                  }}>
                    {formatDateRange(exp?.startDate || null, exp?.endDate || null, exp?.isCurrent || false)}
                  </div>
                </div>
                
                {exp?.descriptionPoints && exp.descriptionPoints.length > 0 && (
                  <ul style={{ 
                    margin: '2pt 0 0 16pt',
                    padding: '0',
                    listStyleType: 'disc'
                  }}>
                    {exp.descriptionPoints.map((point, pointIndex) => (
                      point && (
                        <li key={pointIndex} style={{ 
                          marginBottom: '1pt',
                          textAlign: 'justify',
                          lineHeight: '1.3',
                          fontSize: '11pt',
                          color: '#000000'
                        }}>
                          {point}
                        </li>
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
          <div style={{ marginBottom: '12pt' }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              borderBottom: '1pt solid #000',
              marginBottom: '6pt',
              paddingBottom: '2pt',
              textTransform: 'uppercase'
            }}>
              Projects
            </h2>
            {resumeData.projects.map((project, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.projects.length - 1 ? '8pt' : '0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '3pt'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>
                    {project?.name || 'Project Name'}
                  </div>
                  <div style={{ 
                    fontSize: '10pt',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    marginLeft: '20pt'
                  }}>
                    {formatDateRange(project?.startDate || null, project?.endDate || null, project?.isCurrent || false)}
                  </div>
                </div>
                
                {project?.description && (
                  <p style={{ 
                    margin: '0',
                    textAlign: 'justify',
                    lineHeight: '1.3',
                    fontSize: '10pt'
                  }}>
                    {project.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

                {/* Education */}
        {resumeData?.education && resumeData.education.length > 0 && (
          <div style={{ marginBottom: resumeData?.projects && resumeData.projects.length > 0 ? '8pt' : '0' }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              borderBottom: '1pt solid #000000',
              marginBottom: '4pt',
              paddingBottom: '1pt',
              textTransform: 'uppercase',
              color: '#000000'
            }}>
              Education
            </h2>
            {resumeData.education.map((edu, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.education.length - 1 ? '4pt' : '0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000000' }}>
                      {edu?.degree || 'Degree'}
                    </div>
                    <div style={{ fontStyle: 'italic', fontSize: '11pt', color: '#000000' }}>
                      {edu?.institution || 'Institution'} | {edu?.location || 'Location'}
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '11pt',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    marginLeft: '20pt',
                    color: '#000000'
                  }}>
                    {edu?.endDate ? formatDate(edu.endDate) : 'Present'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {resumeData?.projects && resumeData.projects.length > 0 && (
          <div style={{ marginBottom: '0' }}>
            <h2 style={{ 
              fontSize: '12pt', 
              fontWeight: 'bold', 
              borderBottom: '1pt solid #000000',
              marginBottom: '4pt',
              paddingBottom: '1pt',
              textTransform: 'uppercase',
              color: '#000000'
            }}>
              Projects
            </h2>
            {resumeData.projects.map((project, index) => (
              <div key={index} style={{ marginBottom: index < resumeData.projects.length - 1 ? '4pt' : '0' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'baseline'
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11pt', color: '#000000' }}>
                    {project?.name || 'Project'}
                  </div>
                  <div style={{ 
                    fontSize: '11pt',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    marginLeft: '20pt',
                    color: '#000000'
                  }}>
                    {formatDateRange(project?.startDate || null, project?.endDate || null, project?.isCurrent || false)}
                  </div>
                </div>
                {project?.description && (
                  <div style={{ 
                    textAlign: 'justify',
                    lineHeight: '1.3',
                    fontSize: '11pt',
                    marginTop: '1pt',
                    color: '#000000'
                  }}>
                    {project.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ResumeTemplate.displayName = 'ResumeTemplate';

export default ResumeTemplate;
