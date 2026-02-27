import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  convertInchesToTwip,
} from "docx";

type Profile = {
  fullName: string | null;
  email: string | null;
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
  title: string;
  description: string | null;
  techStack: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  link: string | null;
  outcomes: string | null;
};

type Experience = {
  company: string;
  position: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  responsibilities: string | null;
  achievements: string | null;
  techStack: string | null;

  location: string | null;
};

export function buildResumeDocx(
  profile: Profile,
  projects: Project[],
  experiences: Experience[] = []
): Document {
  const children: Paragraph[] = [];

  const name = profile?.fullName?.trim() || "Your Name";
  children.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    })
  );

  const contact: string[] = [];
  if (profile?.phone) contact.push(profile.phone);
  if (profile?.location) contact.push(profile.location);
  if (profile?.linkedinUrl) contact.push(profile.linkedinUrl);
  if (profile?.websiteUrl) contact.push(profile.websiteUrl);
  if (contact.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contact.join(" | "), size: 20 })],
        spacing: { after: 200 },
      })
    );
  }

  if (profile?.summary) {
    children.push(
      new Paragraph({
        text: "Summary",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 120, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        text: profile.summary,
        spacing: { after: 200 },
      })
    );
  }

  // Add Experience section if there are experiences
  if (experiences.length > 0) {
    children.push(
      new Paragraph({
        text: "Experience",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 120, after: 100 },
      })
    );

    for (const exp of experiences) {
      const titleLine = [exp.position];
      if (exp.company) titleLine.push(` — ${exp.company}`);
      if (exp.location) titleLine.push(`, ${exp.location}`);
      if (exp.startDate || exp.endDate)
        titleLine.push(` (${exp.startDate ?? "?"} – ${exp.endDate ?? "Present"})`);

      children.push(
        new Paragraph({
          text: titleLine.join(""),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 80 },
        })
      );

      if (exp.description) {
        children.push(
          new Paragraph({
            text: exp.description,
            spacing: { after: 60 },
          })
        );
      }

      if (exp.responsibilities) {
        const bullets = exp.responsibilities.split(/\n/).filter((s) => s.trim());
        for (const b of bullets) {
          children.push(
            new Paragraph({
              text: b.trim().replace(/^[-•*]\s*/, ""),
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        }
      }

      if (exp.techStack) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Skills: ${exp.techStack}`, italics: true, size: 20 }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  // Add Projects section
  if (projects.length > 0) {
    children.push(
      new Paragraph({
        text: experiences.length > 0 ? "Projects" : "Projects / Experience",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 120, after: 100 },
      })
    );

    for (const p of projects) {
      const titleLine = [p.title];
      if (p.role) titleLine.push(` — ${p.role}`);
      if (p.startDate || p.endDate)
        titleLine.push(` (${p.startDate ?? "?"} – ${p.endDate ?? "Present"})`);
      children.push(
        new Paragraph({
          text: titleLine.join(""),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 80 },
        })
      );
      if (p.description) {
        children.push(
          new Paragraph({
            text: p.description,
            spacing: { after: 60 },
          })
        );
      }
      if (p.outcomes) {
        const bullets = p.outcomes.split(/\n/).filter((s) => s.trim());
        for (const b of bullets) {
          children.push(
            new Paragraph({
              text: b.trim().replace(/^[-•*]\s*/, ""),
              bullet: { level: 0 },
              spacing: { after: 40 },
            })
          );
        }
      }
      if (p.techStack) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Technologies: ${p.techStack}`, italics: true, size: 20 }),
            ],
            spacing: { after: 80 },
          })
        );
      }
    }
  }

  if (profile?.education) {
    children.push(
      new Paragraph({
        text: "Education",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        text: profile.education,
        spacing: { after: 200 },
      })
    );
  }

  if (profile?.skills) {
    children.push(
      new Paragraph({
        text: "Skills",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 120, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        text: profile.skills,
        spacing: { after: 120 },
      })
    );
  }

  if (profile?.otherExperience) {
    children.push(
      new Paragraph({
        text: "Other Experience",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 120, after: 100 },
      })
    );
    children.push(
      new Paragraph({
        text: profile.otherExperience,
        spacing: { after: 120 },
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
            },
          },
        },
        children,
      },
    ],
  });
}

export async function renderResumeDocx(
  profile: Profile,
  projects: Project[],
  experiences: Experience[] = []
): Promise<Buffer> {
  const doc = buildResumeDocx(profile, projects, experiences);
  return Buffer.from(await Packer.toBuffer(doc));
}

