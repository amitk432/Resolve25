
'use client';

import type { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';

const SectionHeader = ({ title }: { title: string }) => (
  <h2 className="text-sm font-bold text-teal-600 uppercase tracking-wider border-b-2 border-gray-200 pb-1 mb-3">{title}</h2>
);

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateRange(startDateStr: string | null, endDateStr: string | null, isCurrent: boolean): string {
  const startFormatted = formatDate(startDateStr);

  if (isCurrent) {
    return `${startFormatted} - Present`;
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
    // Base container with white background and font styles matching the resume
    <div className="bg-white text-[#333] p-8 font-sans text-sm max-w-4xl mx-auto">
      
      {/* Header: Name and Contact Info */}
      <header className="text-center mb-6">
        <h1 className="text-4xl font-bold text-teal-600">{contactInfo.name}</h1>
        <div className="flex justify-center items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-2 flex-wrap">
          {contactInfo.location && <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{contactInfo.location}</span>}
          {contactInfo.phone && 
            <>
                <span className="text-gray-300 hidden sm:inline-block">•</span>
                <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{contactInfo.phone}</span>
            </>
          }
          {contactInfo.email && 
            <>
                <span className="text-gray-300 hidden sm:inline-block">•</span>
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1.5 hover:text-teal-600"><Mail className="h-3 w-3" />{contactInfo.email}</a>
            </>
          }
          {contactInfo.linkedin && (
              <>
                <span className="text-gray-300 hidden sm:inline-block">•</span>
                <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-600"><Linkedin className="h-3 w-3" />{contactInfo.linkedin.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//, '')}</a>
              </>
          )}
          {contactInfo.github && (
               <>
                <span className="text-gray-300 hidden sm:inline-block">•</span>
                <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-teal-600"><Github className="h-3 w-3" />{contactInfo.github.replace(/^(https?:\/\/)?(www\.)?github\.com\//, '')}</a>
               </>
          )}
        </div>
      </header>

      {/* Professional Summary & Title */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{summary.title}</h3>
        <p className="text-gray-700 text-justify leading-relaxed">{summary.text}</p>
      </section>

      {/* Skills */}
      {Object.keys(skills).length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Skills" />
          <div className="space-y-1">
            {Object.entries(skills).map(([category, skillList]) => (
              <div key={category} className="flex text-sm">
                <p className="w-1/3 font-bold text-gray-900">{category}:</p>
                <p className="w-2/3 text-gray-700">{skillList}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Work Experience */}
      {workExperience.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Work Experience" />
          <div className="space-y-4">
            {workExperience.map((job, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-base text-gray-900">{job.company} <span className="font-normal text-gray-500 text-sm">• {job.location}</span></h3>
                  <p className="text-sm font-medium text-gray-500">{formatDateRange(job.startDate, job.endDate, job.isCurrent)}</p>
                </div>
                <p className="font-semibold text-gray-800 italic">{job.role}</p>
                <ul className="list-disc list-inside mt-1 space-y-1.5 text-gray-700 text-justify">
                  {job.descriptionPoints.map((point, i) => <li key={i}>{point}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-6">
          <SectionHeader title="Projects" />
          <div className="space-y-4">
            {projects.map((project, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <h3 className="font-bold text-base text-gray-900">{project.name}</h3>
                   <p className="text-sm font-medium text-gray-500">{formatDateRange(project.startDate, project.endDate, project.isCurrent)}</p>
                </div>
                <p className="text-gray-700 text-justify leading-relaxed">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Education */}
      {education.length > 0 && (
        <section>
          <SectionHeader title="Education" />
          {education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-base text-gray-900">{edu.institution}</h3>
                <p className="text-sm font-medium text-gray-500">{formatDate(edu.endDate)}</p>
              </div>
              <p className="text-gray-700">{edu.degree} • {edu.location} • {edu.gpa}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
