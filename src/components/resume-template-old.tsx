'use client';

import type { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';
import { format } from 'date-fns';

const SectionHeader = ({ title }: { title: string }) => (
  <h2 
    className="font-bold text-teal-600 uppercase tracking-wider border-b-2 border-gray-200 pb-2 mb-4"
    style={{ fontSize: '12pt', letterSpacing: '0.5px' }}
  >
    {title}
  </h2>
);

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return format(date, 'MMM yyyy');
}

function formatDateRange(startDateStr: string | null, endDateStr: string | null, isCurrent: boolean): string {
  const startFormatted = formatDate(startDateStr);

  if (isCurrent) {
    return startFormatted ? `${startFormatted} - Present` : 'Present';
  }

  const endFormatted = formatDate(endDateStr);
  
  if (startFormatted && endFormatted) {
      return `${startFormatted} - ${endFormatted}`;
  }
  
  return startFormatted || endFormatted;
}

export default function ResumeTemplate({ resume }: { resume: ResumeData }) {
  const { contactInfo, summary, skills, workExperience, education, projects } = resume;

  return (
    // A4 size container optimized for PDF generation
    <div 
      className="bg-white text-gray-800 font-sans mx-auto print:shadow-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        boxSizing: 'border-box',
        fontSize: '11pt',
        lineHeight: '1.4',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
      }}
    >
      
      {/* Header: Name and Contact Info */}
      <header className="text-center mb-8">
        <h1 
          className="font-bold text-teal-600 mb-3"
          style={{ fontSize: '28pt', lineHeight: '1.2' }}
        >
          {contactInfo.name}
        </h1>
        <div 
          className="flex justify-center items-center gap-x-4 gap-y-2 text-gray-600 flex-wrap"
          style={{ fontSize: '10pt' }}
        >
          {contactInfo.location && (
            <span className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {contactInfo.location}
            </span>
          )}
          {contactInfo.phone && (
            <>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                {contactInfo.phone}
              </span>
            </>
          )}
          {contactInfo.email && (
            <>
              <span className="text-gray-300">•</span>
              <a 
                href={`mailto:${contactInfo.email}`} 
                className="flex items-center gap-2 hover:text-teal-600 print:text-inherit print:no-underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {contactInfo.email}
              </a>
            </>
          )}
          {contactInfo.linkedin && (
            <>
              <span className="text-gray-300">•</span>
              <a 
                href={contactInfo.linkedin} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 hover:text-teal-600 print:text-inherit print:no-underline"
              >
                <Linkedin className="h-3.5 w-3.5" />
                {contactInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}
              </a>
            </>
          )}
          {contactInfo.github && (
            <>
              <span className="text-gray-300">•</span>
              <a 
                href={contactInfo.github} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 hover:text-teal-600 print:text-inherit print:no-underline"
              >
                <Github className="h-3.5 w-3.5" />
                {contactInfo.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}
              </a>
            </>
          )}
        </div>
      </header>

      {/* Professional Summary */}
      <section className="mb-7">
        <h3 
          className="font-bold text-gray-800 mb-3"
          style={{ fontSize: '13pt' }}
        >
          {summary.title}
        </h3>
        <p 
          className="text-gray-700 text-justify"
          style={{ lineHeight: '1.5' }}
        >
          {summary.text}
        </p>
      </section>

      {/* Skills */}
      {Object.keys(skills).length > 0 && (
        <section className="mb-7">
          <SectionHeader title="Skills" />
          <div className="space-y-2">
            {Object.entries(skills).map(([category, skillList]) => (
              <div key={category} style={{ fontSize: '10.5pt' }}>
                <span className="font-semibold text-gray-900">{category}: </span>
                <span className="text-gray-700">{skillList}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {workExperience.length > 0 && (
        <section className="mb-7">
          <SectionHeader title="Work Experience" />
          <div className="space-y-5">
            {workExperience.map((job, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 
                    className="font-bold text-gray-900"
                    style={{ fontSize: '11.5pt' }}
                  >
                    {job.company} 
                    <span className="font-normal text-gray-600 text-sm ml-2">
                      • {job.location}
                    </span>
                  </h3>
                  <p 
                    className="font-medium text-gray-600"
                    style={{ fontSize: '10pt' }}
                  >
                    {formatDateRange(job.startDate, job.endDate, job.isCurrent)}
                  </p>
                </div>
                <p 
                  className="font-semibold text-gray-800 italic mb-2"
                  style={{ fontSize: '10.5pt' }}
                >
                  {job.role}
                </p>
                <ul 
                  className="list-disc list-outside ml-5 space-y-1 text-gray-700 text-justify"
                  style={{ fontSize: '10pt', lineHeight: '1.4' }}
                >
                  {job.descriptionPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-7">
          <SectionHeader title="Projects" />
          <div className="space-y-5">
            {projects.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 
                    className="font-bold text-gray-900"
                    style={{ fontSize: '11.5pt' }}
                  >
                    {project.name}
                  </h3>
                  <p 
                    className="font-medium text-gray-600"
                    style={{ fontSize: '10pt' }}
                  >
                    {formatDateRange(project.startDate, project.endDate, project.isCurrent)}
                  </p>
                </div>
                <p 
                  className="text-gray-700 text-justify"
                  style={{ fontSize: '10pt', lineHeight: '1.4' }}
                >
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Education */}
      {education.length > 0 && (
        <section>
          <SectionHeader title="Education" />
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index}>
                <div className="flex justify-between items-start">
                  <h3 
                    className="font-bold text-gray-900"
                    style={{ fontSize: '11.5pt' }}
                  >
                    {edu.institution}
                  </h3>
                  <p 
                    className="font-medium text-gray-600"
                    style={{ fontSize: '10pt' }}
                  >
                    {formatDate(edu.endDate)}
                  </p>
                </div>
                <p 
                  className="text-gray-700"
                  style={{ fontSize: '10pt' }}
                >
                  {edu.degree} • {edu.location} • {edu.gpa}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
