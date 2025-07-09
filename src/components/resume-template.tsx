'use client';

import type { ResumeData } from '@/lib/types';
import { Mail, Phone, MapPin, Linkedin, Github } from 'lucide-react';

export default function ResumeTemplate({ resume }: { resume: ResumeData }) {
  const { contactInfo, summary, skills, workExperience, education, projects } = resume;

  return (
    <div className="bg-white text-gray-800 p-8 font-sans text-sm max-w-4xl mx-auto shadow-lg rounded-md border">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900">{contactInfo.name}</h1>
        <div className="flex justify-center items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-2 flex-wrap">
          <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-1.5 hover:text-blue-600"><Mail className="h-3 w-3" />{contactInfo.email}</a>
          <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{contactInfo.phone}</span>
          <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{contactInfo.location}</span>
          <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600"><Linkedin className="h-3 w-3" />{contactInfo.linkedin.replace('https://www.linkedin.com/in/', '')}</a>
          <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-600"><Github className="h-3 w-3" />{contactInfo.github.replace('https://github.com/', '')}</a>
        </div>
      </header>

      {/* Summary */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold border-b-2 border-gray-200 pb-1 mb-2">{summary.title}</h2>
        <p className="text-gray-700">{summary.text}</p>
      </section>

      {/* Skills */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 border-b border-gray-300 pb-1 mb-2 tracking-wider">SKILLS</h2>
        <div className="space-y-1">
          {Object.entries(skills).map(([category, skillList]) => (
            <div key={category} className="flex">
              <p className="w-1/4 font-semibold text-gray-800">{category}:</p>
              <p className="w-3/4 text-gray-700">{skillList}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Work Experience */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 border-b border-gray-300 pb-1 mb-2 tracking-wider">WORK EXPERIENCE</h2>
        <div className="space-y-4">
          {workExperience.map((job, index) => (
            <div key={index}>
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-base">{job.company} <span className="font-normal text-gray-600 text-sm">• {job.location}</span></h3>
                <p className="text-xs font-medium text-gray-500">{job.dates}</p>
              </div>
              <p className="font-semibold text-gray-700">{job.role}</p>
              <ul className="list-disc list-inside mt-1 space-y-1 text-gray-700">
                {job.descriptionPoints.map((point, i) => <li key={i}>{point}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-blue-700 border-b border-gray-300 pb-1 mb-2 tracking-wider">PROJECTS</h2>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={index}>
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-base">{project.name}</h3>
                <p className="text-xs font-medium text-gray-500">{project.dates}</p>
              </div>
              <p className="text-gray-700">{project.description}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Education */}
      <section>
        <h2 className="text-sm font-bold text-blue-700 border-b border-gray-300 pb-1 mb-2 tracking-wider">EDUCATION</h2>
        {education.map((edu, index) => (
          <div key={index} className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-base">{edu.institution}</h3>
              <p className="text-gray-700">{edu.degree} • {edu.location} • {edu.gpa}</p>
            </div>
            <p className="text-xs font-medium text-gray-500">{edu.date}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
