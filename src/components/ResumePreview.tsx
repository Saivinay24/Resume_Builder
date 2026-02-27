"use client";

import { useRef } from "react";

type Profile = {
  fullName: string | null;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  summary: string | null;
  education: string | null;
  otherExperience: string | null;
  skills: string | null;
} | null;

type Project = {
  id: string;
  title: string;
  description: string | null;
  techStack: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  link: string | null;
  outcomes: string | null;
};

type Props = { profile: Profile; projects: Project[] };

export function ResumePreview({ profile, projects }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const name = profile?.fullName?.trim() || "Your Name";
  const contact: string[] = [];
  if (profile?.phone) contact.push(profile.phone);
  if (profile?.location) contact.push(profile.location);
  if (profile?.linkedinUrl) contact.push(profile.linkedinUrl);
  if (profile?.websiteUrl) contact.push(profile.websiteUrl);

  function handlePrint() {
    if (!printRef.current) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Resume</title>
          <style>
            body { font-family: Georgia, serif; max-width: 8.5in; margin: 0.5in auto; font-size: 11pt; line-height: 1.4; }
            h1 { font-size: 18pt; margin-bottom: 4px; }
            h2 { font-size: 12pt; margin-top: 14px; margin-bottom: 6px; border-bottom: 1px solid #333; }
            .contact { font-size: 10pt; color: #444; margin-bottom: 12px; }
            ul { margin: 4px 0; padding-left: 20px; }
            .meta { font-size: 10pt; color: #555; margin-top: 2px; }
          </style>
        </head>
        <body>
          ${printRef.current.innerHTML}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print / Save as PDF
        </button>
      </div>
      <div
        ref={printRef}
        className="resume-preview max-w-[8.5in] mx-auto p-6 bg-white text-black rounded-lg shadow print:shadow-none print:p-0"
        style={{ fontFamily: "Georgia, serif", fontSize: "11pt", lineHeight: 1.4 }}
      >
        <h1 style={{ fontSize: "18pt", marginBottom: 4 }}>{name}</h1>
        {contact.length > 0 && (
          <p className="contact text-gray-600 text-[10pt] mb-3">{contact.join(" | ")}</p>
        )}
        {profile?.summary && (
          <>
            <h2 className="text-sm font-semibold mt-4 mb-2 border-b border-gray-700">Summary</h2>
            <p>{profile.summary}</p>
          </>
        )}
        <h2 className="text-sm font-semibold mt-4 mb-2 border-b border-gray-700">Projects / Experience</h2>
        {projects.map((p) => (
          <div key={p.id} className="mb-4">
            <div className="font-semibold">
              {p.title}
              {p.role && ` — ${p.role}`}
              {(p.startDate || p.endDate) && (
                <span className="text-gray-600 font-normal text-[10pt] ml-1">
                  ({p.startDate ?? "?"} – {p.endDate ?? "Present"})
                </span>
              )}
            </div>
            {p.description && <p className="mt-1">{p.description}</p>}
            {p.outcomes && (
              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                {p.outcomes.split(/\n/).filter(Boolean).map((line, i) => (
                  <li key={i}>{line.replace(/^[-•*]\s*/, "")}</li>
                ))}
              </ul>
            )}
            {p.techStack && (
              <p className="text-[10pt] text-gray-600 italic mt-1">Technologies: {p.techStack}</p>
            )}
          </div>
        ))}
        {profile?.education && (
          <>
            <h2 className="text-sm font-semibold mt-4 mb-2 border-b border-gray-700">Education</h2>
            <p>{profile.education}</p>
          </>
        )}
        {profile?.skills && (
          <>
            <h2 className="text-sm font-semibold mt-4 mb-2 border-b border-gray-700">Skills</h2>
            <p>{profile.skills}</p>
          </>
        )}
        {profile?.otherExperience && (
          <>
            <h2 className="text-sm font-semibold mt-4 mb-2 border-b border-gray-700">Other Experience</h2>
            <p>{profile.otherExperience}</p>
          </>
        )}
      </div>
    </div>
  );
}
