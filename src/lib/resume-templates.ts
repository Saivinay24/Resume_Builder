/**
 * Professional ATS-optimized resume templates
 * Built to match proven high-ATS-score resume formats (Jake's Resume style)
 * 
 * Key ATS principles:
 * - Single column, no tables/graphics
 * - Standard section headers (ALL CAPS)
 * - Horizontal line separators
 * - Standard fonts, tight margins
 * - Action verb + metric bullet points
 */

import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    convertInchesToTwip,
    AlignmentType,
    BorderStyle,
    TabStopType,
    TabStopPosition,
    UnderlineType,
    ExternalHyperlink,
} from "docx";

export type ResumeTemplate = "modern" | "classic" | "technical" | "minimal" | "student" | "ats-optimized" | "archer-irm";

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

type Project = {
    title: string;
    description: string | null;
    techStack: string | null;
    role: string | null;
    startDate: string | null;
    endDate: string | null;
    outcomes: string | null;
};

// ============================================================================
// Constants for ATS-optimized formatting
// ============================================================================

const FONT = "Calibri";
const FONT_SIZE = {
    name: 28,       // 14pt
    sectionHeader: 22, // 11pt
    body: 20,       // 10pt
    small: 18,      // 9pt
};

const SPACING = {
    afterName: 60,
    afterContact: 80,
    beforeSection: 120,
    afterSection: 60,
    afterEntry: 40,
    afterBullet: 20,
};

// Section header with bottom border (horizontal line)
function createSectionHeader(text: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: text.toUpperCase(),
                bold: true,
                size: FONT_SIZE.sectionHeader,
                font: FONT,
            }),
        ],
        spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
        border: {
            bottom: {
                style: BorderStyle.SINGLE,
                size: 6, // 0.75pt line
                color: "000000",
                space: 1,
            },
        },
    });
}

// Bold + regular inline text on same line
function createTitleDateLine(
    title: string,
    rightText: string,
    titleBold: boolean = true
): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: title,
                bold: titleBold,
                size: FONT_SIZE.body,
                font: FONT,
            }),
            new TextRun({
                text: `\t${rightText}`,
                size: FONT_SIZE.body,
                font: FONT,
                italics: true,
            }),
        ],
        tabStops: [
            {
                type: TabStopType.RIGHT,
                position: TabStopPosition.MAX,
            },
        ],
        spacing: { after: 10 },
    });
}

// Subtitle line (e.g., degree, location)
function createSubtitleLine(
    left: string,
    right?: string
): Paragraph {
    const children: TextRun[] = [
        new TextRun({
            text: left,
            italics: true,
            size: FONT_SIZE.body,
            font: FONT,
        }),
    ];
    if (right) {
        children.push(
            new TextRun({
                text: `\t${right}`,
                italics: true,
                size: FONT_SIZE.body,
                font: FONT,
            })
        );
    }
    return new Paragraph({
        children,
        tabStops: right ? [
            { type: TabStopType.RIGHT, position: TabStopPosition.MAX },
        ] : [],
        spacing: { after: 10 },
    });
}

// Bullet point
function createBullet(text: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: text.trim().replace(/^[-•*]\s*/, ""),
                size: FONT_SIZE.body,
                font: FONT,
            }),
        ],
        bullet: { level: 0 },
        spacing: { after: SPACING.afterBullet },
    });
}

// Skills line: "Category: skill1, skill2, skill3"
function createSkillLine(category: string, skills: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: `${category}: `,
                bold: true,
                size: FONT_SIZE.body,
                font: FONT,
            }),
            new TextRun({
                text: skills,
                size: FONT_SIZE.body,
                font: FONT,
            }),
        ],
        spacing: { after: 10 },
    });
}

// Parse education text into structured parts
function parseEducation(educationText: string): Array<{
    degree: string;
    school: string;
    location?: string;
    dates?: string;
    gpa?: string;
    coursework?: string;
}> {
    const entries: Array<{
        degree: string; school: string; location?: string;
        dates?: string; gpa?: string; coursework?: string;
    }> = [];

    // Try to split by double newline for multiple entries
    const blocks = educationText.split(/\n\n+/).filter(b => b.trim());

    for (const block of blocks) {
        const lines = block.split(/\n/).filter(l => l.trim());
        if (lines.length === 0) continue;

        // Check for common patterns
        const gpaMatch = block.match(/GPA[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
        const dateMatch = block.match(/((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Spring|Fall|Winter|Summer)[\s.]*\d{4}\s*[-–—]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Spring|Fall|Winter|Summer|Present|Expected)[\s.]*\d{0,4}|\d{4}\s*[-–—]\s*(?:\d{4}|Present|Expected))/i);
        const courseworkMatch = block.match(/(?:Relevant\s+)?Coursework[:\s]*(.*)/i);

        entries.push({
            degree: lines[0] || block,
            school: lines.length > 1 ? lines[1] : "",
            dates: dateMatch?.[1],
            gpa: gpaMatch?.[1],
            coursework: courseworkMatch?.[1],
        });
    }

    // If no structured parsing worked, treat whole thing as one entry
    if (entries.length === 0) {
        entries.push({ degree: educationText, school: "" });
    }

    return entries;
}

// Parse skills text into categorized skills
function parseSkills(skillsText: string): Array<{ category: string; skills: string }> {
    const result: Array<{ category: string; skills: string }> = [];
    const lines = skillsText.split(/\n/).filter(l => l.trim());

    for (const line of lines) {
        // Check for "Category: skill1, skill2" format
        const colonMatch = line.match(/^([A-Za-z\s/&]+):\s*(.+)/);
        if (colonMatch) {
            result.push({
                category: colonMatch[1].trim(),
                skills: colonMatch[2].trim(),
            });
        }
    }

    // If no categorized format found, create a single entry
    if (result.length === 0) {
        // Try to auto-categorize
        const allSkills = skillsText.replace(/\n/g, ", ").replace(/,\s*,/g, ",");
        result.push({ category: "Technical Skills", skills: allSkills });
    }

    return result;
}

// ============================================================================
// Page margin configs
// ============================================================================

function atsPageMargins() {
    return {
        top: convertInchesToTwip(0.35),
        right: convertInchesToTwip(0.4),
        bottom: convertInchesToTwip(0.35),
        left: convertInchesToTwip(0.4),
    };
}

function standardPageMargins() {
    return {
        top: convertInchesToTwip(0.5),
        right: convertInchesToTwip(0.6),
        bottom: convertInchesToTwip(0.5),
        left: convertInchesToTwip(0.6),
    };
}

// ============================================================================
// Template Router
// ============================================================================

export function buildResumeWithTemplate(
    template: ResumeTemplate,
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number = 1
): Document {
    switch (template) {
        case "ats-optimized":
            return buildATSOptimizedTemplate(profile, experiences, projects, maxPages);
        case "student":
            return buildStudentTemplate(profile, experiences, projects, maxPages);
        case "technical":
            return buildTechnicalTemplate(profile, experiences, projects, maxPages);
        case "minimal":
            return buildMinimalTemplate(profile, experiences, projects, maxPages);
        case "archer-irm":
            return buildArcherIRMTemplate(profile, experiences, projects, maxPages);
        case "modern":
        case "classic":
        default:
            return buildModernTemplate(profile, experiences, projects, maxPages);
    }
}

// ============================================================================
// ATS-Optimized Template (Primary — Jake's Resume Style)
// ============================================================================

function buildATSOptimizedTemplate(
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number
): Document {
    const children: Paragraph[] = [];
    const name = profile?.fullName?.trim() || "Your Name";

    // ── Name (large, bold, centered) ──────────────────
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: name,
                    bold: true,
                    size: FONT_SIZE.name,
                    font: FONT,
                }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: SPACING.afterName },
        })
    );

    // ── Contact Line (single line, centered) ──────────
    const contact: string[] = [];
    if (profile?.email) contact.push(profile.email);
    if (profile?.phone) contact.push(profile.phone);
    if (profile?.location) contact.push(profile.location);
    if (profile?.linkedinUrl) {
        // Clean up LinkedIn URL for display
        const linkedin = profile.linkedinUrl
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "");
        contact.push(linkedin);
    }
    if (profile?.websiteUrl) {
        const website = profile.websiteUrl
            .replace(/^https?:\/\//, "")
            .replace(/\/$/, "");
        contact.push(website);
    }

    if (contact.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: contact.join(" | "),
                        size: FONT_SIZE.body,
                        font: FONT,
                    }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: SPACING.afterContact },
            })
        );
    }

    // ── Professional Summary (optional, for experienced) ──
    if (profile?.summary && experiences.length >= 2) {
        children.push(createSectionHeader("Summary"));
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: profile.summary,
                        size: FONT_SIZE.body,
                        font: FONT,
                    }),
                ],
                spacing: { after: SPACING.afterEntry },
            })
        );
    }

    // ── Education ─────────────────────────────────────
    if (profile?.education) {
        children.push(createSectionHeader("Education"));
        const eduEntries = parseEducation(profile.education);

        for (const edu of eduEntries) {
            if (edu.school) {
                children.push(
                    createTitleDateLine(
                        edu.school,
                        edu.dates || ""
                    )
                );
                children.push(
                    createSubtitleLine(
                        edu.degree,
                        edu.gpa ? `GPA: ${edu.gpa}` : undefined
                    )
                );
            } else {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: edu.degree,
                                size: FONT_SIZE.body,
                                font: FONT,
                            }),
                        ],
                        spacing: { after: SPACING.afterEntry },
                    })
                );
            }
            if (edu.coursework) {
                children.push(
                    createSkillLine("Relevant Coursework", edu.coursework)
                );
            }
        }
    }

    // ── Technical Skills ──────────────────────────────
    if (profile?.skills) {
        children.push(createSectionHeader("Technical Skills"));
        const skillCategories = parseSkills(profile.skills);
        for (const cat of skillCategories) {
            children.push(createSkillLine(cat.category, cat.skills));
        }
    }

    // ── Experience ────────────────────────────────────
    if (experiences.length > 0) {
        children.push(createSectionHeader("Experience"));
        const maxExp = maxPages === 1 ? 2 : 4;
        const maxBullets = maxPages === 1 ? 3 : 5;

        for (const exp of experiences.slice(0, maxExp)) {
            const dateStr = `${exp.startDate || ""} – ${exp.endDate || "Present"}`;
            children.push(
                createTitleDateLine(
                    `${exp.company}${exp.location ? `, ${exp.location}` : ""}`,
                    dateStr
                )
            );
            children.push(
                createSubtitleLine(exp.position)
            );

            // Combine responsibilities and achievements for bullets
            const bulletText = [
                exp.responsibilities,
                exp.achievements,
            ].filter(Boolean).join("\n");

            if (bulletText) {
                const bullets = bulletText.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    // ── Projects ──────────────────────────────────────
    if (projects.length > 0) {
        children.push(createSectionHeader("Projects"));
        const maxProj = maxPages === 1 ? 3 : 5;
        const maxBullets = maxPages === 1 ? 2 : 4;

        for (const proj of projects.slice(0, maxProj)) {
            const techStr = proj.techStack ? ` | ${proj.techStack}` : "";
            const dateStr = proj.startDate || proj.endDate
                ? `${proj.startDate || ""} – ${proj.endDate || "Present"}`
                : "";

            children.push(
                createTitleDateLine(
                    `${formatProjectTitle(proj.title)}${techStr}`,
                    dateStr
                )
            );

            if (proj.outcomes) {
                const bullets = proj.outcomes.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            } else if (proj.description) {
                children.push(createBullet(proj.description));
            }
        }
    }

    // ── Other Experience / Certifications ─────────────
    if (profile?.otherExperience) {
        children.push(createSectionHeader("Additional Experience"));
        const lines = profile.otherExperience.split(/\n/).filter(l => l.trim());
        for (const line of lines.slice(0, 4)) {
            children.push(createBullet(line));
        }
    }

    return new Document({
        sections: [{
            properties: {
                page: { margin: atsPageMargins() },
            },
            children,
        }],
    });
}

// ============================================================================
// Student Template (Education First)
// ============================================================================

function buildStudentTemplate(
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number
): Document {
    const children: Paragraph[] = [];
    const name = profile?.fullName?.trim() || "Your Name";

    // Name
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: name, bold: true, size: FONT_SIZE.name, font: FONT }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: SPACING.afterName },
        })
    );

    // Contact
    const contact: string[] = [];
    if (profile?.email) contact.push(profile.email);
    if (profile?.phone) contact.push(profile.phone);
    if (profile?.location) contact.push(profile.location);
    if (profile?.linkedinUrl) contact.push(profile.linkedinUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    if (profile?.websiteUrl) contact.push(profile.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));

    if (contact.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: contact.join(" | "), size: FONT_SIZE.body, font: FONT })],
                alignment: AlignmentType.CENTER,
                spacing: { after: SPACING.afterContact },
            })
        );
    }

    // Education FIRST for students
    if (profile?.education) {
        children.push(createSectionHeader("Education"));
        const eduEntries = parseEducation(profile.education);
        for (const edu of eduEntries) {
            if (edu.school) {
                children.push(createTitleDateLine(edu.school, edu.dates || ""));
                children.push(createSubtitleLine(edu.degree, edu.gpa ? `GPA: ${edu.gpa}` : undefined));
            } else {
                children.push(new Paragraph({
                    children: [new TextRun({ text: edu.degree, size: FONT_SIZE.body, font: FONT })],
                    spacing: { after: SPACING.afterEntry },
                }));
            }
            if (edu.coursework) {
                children.push(createSkillLine("Relevant Coursework", edu.coursework));
            }
        }
    }

    // Technical Skills
    if (profile?.skills) {
        children.push(createSectionHeader("Technical Skills"));
        const skillCategories = parseSkills(profile.skills);
        for (const cat of skillCategories) {
            children.push(createSkillLine(cat.category, cat.skills));
        }
    }

    // Projects (emphasized for students — more projects, more bullets)
    if (projects.length > 0) {
        children.push(createSectionHeader("Projects"));
        const maxProj = maxPages === 1 ? 3 : 5;
        const maxBullets = maxPages === 1 ? 3 : 4;

        for (const proj of projects.slice(0, maxProj)) {
            const techStr = proj.techStack ? ` | ${proj.techStack}` : "";
            const dateStr = proj.startDate || proj.endDate
                ? `${proj.startDate || ""} – ${proj.endDate || "Present"}`
                : "";

            children.push(createTitleDateLine(`${formatProjectTitle(proj.title)}${techStr}`, dateStr));

            if (proj.outcomes) {
                const bullets = proj.outcomes.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            } else if (proj.description) {
                children.push(createBullet(proj.description));
            }
        }
    }

    // Experience (fewer entries for students)
    if (experiences.length > 0) {
        children.push(createSectionHeader("Experience"));
        const maxExp = maxPages === 1 ? 2 : 3;
        const maxBullets = maxPages === 1 ? 2 : 4;

        for (const exp of experiences.slice(0, maxExp)) {
            const dateStr = `${exp.startDate || ""} – ${exp.endDate || "Present"}`;
            children.push(createTitleDateLine(
                `${exp.company}${exp.location ? `, ${exp.location}` : ""}`,
                dateStr
            ));
            children.push(createSubtitleLine(exp.position));

            const bulletText = [exp.responsibilities, exp.achievements].filter(Boolean).join("\n");
            if (bulletText) {
                const bullets = bulletText.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    return new Document({
        sections: [{
            properties: { page: { margin: atsPageMargins() } },
            children,
        }],
    });
}

// ============================================================================
// Modern Template (Clean Professional)
// ============================================================================

function buildModernTemplate(
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number
): Document {
    const children: Paragraph[] = [];
    const name = profile?.fullName?.trim() || "Your Name";

    // Header
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: name, bold: true, size: FONT_SIZE.name, font: FONT }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: SPACING.afterName },
        })
    );

    // Contact
    const contact: string[] = [];
    if (profile?.email) contact.push(profile.email);
    if (profile?.phone) contact.push(profile.phone);
    if (profile?.location) contact.push(profile.location);
    if (profile?.linkedinUrl) contact.push(profile.linkedinUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    if (profile?.websiteUrl) contact.push(profile.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));

    if (contact.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: contact.join(" | "), size: FONT_SIZE.body, font: FONT })],
                alignment: AlignmentType.CENTER,
                spacing: { after: SPACING.afterContact },
            })
        );
    }

    // Summary
    if (profile?.summary) {
        children.push(createSectionHeader("Professional Summary"));
        children.push(
            new Paragraph({
                children: [new TextRun({ text: profile.summary, size: FONT_SIZE.body, font: FONT })],
                spacing: { after: SPACING.afterEntry },
            })
        );
    }

    // Experience
    if (experiences.length > 0) {
        children.push(createSectionHeader("Experience"));
        const maxExp = maxPages === 1 ? 2 : 4;
        const maxBullets = maxPages === 1 ? 3 : 5;

        for (const exp of experiences.slice(0, maxExp)) {
            const dateStr = `${exp.startDate || ""} – ${exp.endDate || "Present"}`;
            children.push(createTitleDateLine(
                `${exp.position} — ${exp.company}`,
                dateStr
            ));

            if (exp.responsibilities) {
                const bullets = exp.responsibilities.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    // Projects
    if (projects.length > 0) {
        children.push(createSectionHeader("Projects"));
        const maxProj = maxPages === 1 ? 2 : 4;
        const maxBullets = maxPages === 1 ? 2 : 4;

        for (const proj of projects.slice(0, maxProj)) {
            children.push(createTitleDateLine(
                formatProjectTitle(proj.title),
                proj.techStack || ""
            ));

            if (proj.outcomes) {
                const bullets = proj.outcomes.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            } else if (proj.description) {
                children.push(createBullet(proj.description));
            }
        }
    }

    // Education
    if (profile?.education) {
        children.push(createSectionHeader("Education"));
        const eduEntries = parseEducation(profile.education);
        for (const edu of eduEntries) {
            if (edu.school) {
                children.push(createTitleDateLine(edu.school, edu.dates || ""));
                children.push(createSubtitleLine(edu.degree, edu.gpa ? `GPA: ${edu.gpa}` : undefined));
            } else {
                children.push(new Paragraph({
                    children: [new TextRun({ text: edu.degree, size: FONT_SIZE.body, font: FONT })],
                    spacing: { after: SPACING.afterEntry },
                }));
            }
        }
    }

    // Skills
    if (profile?.skills) {
        children.push(createSectionHeader("Technical Skills"));
        const skillCategories = parseSkills(profile.skills);
        for (const cat of skillCategories) {
            children.push(createSkillLine(cat.category, cat.skills));
        }
    }

    return new Document({
        sections: [{
            properties: { page: { margin: standardPageMargins() } },
            children,
        }],
    });
}

// ============================================================================
// Technical Template (Skills-First, Dense)
// ============================================================================

function buildTechnicalTemplate(
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number
): Document {
    const children: Paragraph[] = [];
    const name = profile?.fullName?.trim() || "Your Name";

    // Compact header
    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: name, bold: true, size: FONT_SIZE.name, font: FONT }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
        })
    );

    // Contact
    const contact: string[] = [];
    if (profile?.email) contact.push(profile.email);
    if (profile?.phone) contact.push(profile.phone);
    if (profile?.linkedinUrl) contact.push(profile.linkedinUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    if (profile?.websiteUrl) contact.push(profile.websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));

    if (contact.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: contact.join(" • "), size: FONT_SIZE.small, font: FONT })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 60 },
            })
        );
    }

    // Skills FIRST in technical template
    if (profile?.skills) {
        children.push(createSectionHeader("Technical Skills"));
        const skillCategories = parseSkills(profile.skills);
        for (const cat of skillCategories) {
            children.push(createSkillLine(cat.category, cat.skills));
        }
    }

    // Projects (more prominent in technical)
    if (projects.length > 0) {
        children.push(createSectionHeader("Technical Projects"));
        const maxProj = maxPages === 1 ? 3 : 5;
        const maxBullets = maxPages === 1 ? 3 : 4;

        for (const proj of projects.slice(0, maxProj)) {
            const techStr = proj.techStack ? ` | ${proj.techStack}` : "";
            children.push(createTitleDateLine(
                `${formatProjectTitle(proj.title)}${techStr}`,
                proj.startDate || proj.endDate ? `${proj.startDate || ""} – ${proj.endDate || ""}` : ""
            ));

            if (proj.outcomes) {
                const bullets = proj.outcomes.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            } else if (proj.description) {
                children.push(createBullet(proj.description));
            }
        }
    }

    // Experience
    if (experiences.length > 0) {
        children.push(createSectionHeader("Professional Experience"));
        const maxExp = maxPages === 1 ? 2 : 4;
        const maxBullets = maxPages === 1 ? 3 : 5;

        for (const exp of experiences.slice(0, maxExp)) {
            const dateStr = `${exp.startDate || ""} – ${exp.endDate || "Present"}`;
            children.push(createTitleDateLine(
                `${exp.company}${exp.location ? `, ${exp.location}` : ""}`,
                dateStr
            ));
            children.push(createSubtitleLine(exp.position));

            const bulletText = [exp.responsibilities, exp.achievements].filter(Boolean).join("\n");
            if (bulletText) {
                const bullets = bulletText.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    // Education
    if (profile?.education) {
        children.push(createSectionHeader("Education"));
        const eduEntries = parseEducation(profile.education);
        for (const edu of eduEntries) {
            if (edu.school) {
                children.push(createTitleDateLine(edu.school, edu.dates || ""));
                children.push(createSubtitleLine(edu.degree, edu.gpa ? `GPA: ${edu.gpa}` : undefined));
            } else {
                children.push(new Paragraph({
                    children: [new TextRun({ text: edu.degree, size: FONT_SIZE.body, font: FONT })],
                    spacing: { after: SPACING.afterEntry },
                }));
            }
        }
    }

    return new Document({
        sections: [{
            properties: { page: { margin: atsPageMargins() } },
            children,
        }],
    });
}

// ============================================================================
// Minimal Template (Clean, Less Dense)
// ============================================================================

function buildMinimalTemplate(
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number
): Document {
    // Minimal uses the modern layout with slightly larger margins
    const children: Paragraph[] = [];
    const name = profile?.fullName?.trim() || "Your Name";

    children.push(
        new Paragraph({
            children: [
                new TextRun({ text: name, bold: true, size: 30, font: FONT }), // 15pt
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 40 },
        })
    );

    // Contact on separate line, left-aligned
    const contact: string[] = [];
    if (profile?.email) contact.push(profile.email);
    if (profile?.phone) contact.push(profile.phone);
    if (profile?.location) contact.push(profile.location);
    if (profile?.linkedinUrl) contact.push(profile.linkedinUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""));

    if (contact.length > 0) {
        children.push(
            new Paragraph({
                children: [new TextRun({ text: contact.join("  •  "), size: FONT_SIZE.body, font: FONT, color: "555555" })],
                spacing: { after: 100 },
            })
        );
    }

    // Summary
    if (profile?.summary) {
        children.push(createSectionHeader("About"));
        children.push(
            new Paragraph({
                children: [new TextRun({ text: profile.summary, size: FONT_SIZE.body, font: FONT })],
                spacing: { after: SPACING.afterEntry },
            })
        );
    }

    // Experience
    if (experiences.length > 0) {
        children.push(createSectionHeader("Experience"));
        for (const exp of experiences.slice(0, maxPages === 1 ? 2 : 4)) {
            const dateStr = `${exp.startDate || ""} – ${exp.endDate || "Present"}`;
            children.push(createTitleDateLine(`${exp.position}, ${exp.company}`, dateStr));

            if (exp.responsibilities) {
                const bullets = exp.responsibilities.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxPages === 1 ? 3 : 5)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    // Projects
    if (projects.length > 0) {
        children.push(createSectionHeader("Projects"));
        for (const proj of projects.slice(0, maxPages === 1 ? 2 : 4)) {
            children.push(createTitleDateLine(formatProjectTitle(proj.title), proj.techStack || ""));
            if (proj.outcomes) {
                const bullets = proj.outcomes.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxPages === 1 ? 2 : 3)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    // Education
    if (profile?.education) {
        children.push(createSectionHeader("Education"));
        children.push(new Paragraph({
            children: [new TextRun({ text: profile.education, size: FONT_SIZE.body, font: FONT })],
            spacing: { after: SPACING.afterEntry },
        }));
    }

    // Skills
    if (profile?.skills) {
        children.push(createSectionHeader("Skills"));
        const skillCategories = parseSkills(profile.skills);
        for (const cat of skillCategories) {
            children.push(createSkillLine(cat.category, cat.skills));
        }
    }

    return new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(0.6),
                        right: convertInchesToTwip(0.7),
                        bottom: convertInchesToTwip(0.6),
                        left: convertInchesToTwip(0.7),
                    },
                },
            },
            children,
        }],
    });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format project title: convert kebab-case/snake_case to Title Case
 */
function formatProjectTitle(title: string): string {
    return title
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// Archer IRM Template — Exact match to reference resume
// ============================================================================

/**
 * Archer IRM Template
 * 
 * Layout: Left-aligned name (bold, ALL CAPS), pipe-separated contact,
 * underlined bold ALL CAPS section headers.
 * Section order: EDUCATION → TECHNICAL SKILLS → CORE ENGINEERING PROJECTS → 
 *                PROFESSIONAL EXPERIENCE & LEADERSHIP
 * Projects: Bold title | italic tech | [Link], then bullet points
 * Skills: Bullet list with bold category prefix
 */
function buildArcherIRMTemplate(
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number
): Document {
    const children: Paragraph[] = [];
    const name = profile?.fullName?.trim() || "Your Name";

    // ── Name (bold, ALL CAPS, left-aligned, ~14pt) ───────────
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: name.toUpperCase(),
                    bold: true,
                    size: 28, // 14pt
                    font: FONT,
                }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 30 },
        })
    );

    // ── Contact line (pipe separated, left-aligned) ─────────
    const contactParts: string[] = [];
    if (profile?.location) contactParts.push(profile.location);
    if (profile?.phone) contactParts.push(profile.phone);
    if (profile?.email) contactParts.push(profile.email);

    if (contactParts.length > 0) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: contactParts.join(" | "),
                        size: FONT_SIZE.body,
                        font: FONT,
                    }),
                ],
                spacing: { after: 20 },
            })
        );
    }

    // ── GitHub / LinkedIn line ──────────────────────────────
    const linkParts: TextRun[] = [];
    if (profile?.websiteUrl || true) {
        // Try to extract GitHub URL
        const githubUrl = profile?.websiteUrl?.includes("github")
            ? profile.websiteUrl
            : null;

        if (githubUrl) {
            linkParts.push(
                new TextRun({ text: "GitHub: ", bold: true, size: FONT_SIZE.body, font: FONT }),
                new TextRun({
                    text: githubUrl.replace(/^https?:\/\//, ""),
                    size: FONT_SIZE.body,
                    font: FONT,
                    color: "0563C1",
                    underline: { type: UnderlineType.SINGLE },
                })
            );
        }
    }

    if (profile?.linkedinUrl) {
        if (linkParts.length > 0) {
            linkParts.push(new TextRun({ text: " | ", size: FONT_SIZE.body, font: FONT }));
        }
        linkParts.push(
            new TextRun({ text: "LinkedIn: ", bold: true, size: FONT_SIZE.body, font: FONT }),
            new TextRun({
                text: profile.linkedinUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
                size: FONT_SIZE.body,
                font: FONT,
                color: "0563C1",
                underline: { type: UnderlineType.SINGLE },
            })
        );
    }

    if (linkParts.length > 0) {
        children.push(
            new Paragraph({
                children: linkParts,
                spacing: { after: SPACING.afterContact },
            })
        );
    }

    // ── EDUCATION (underlined header) ────────────────────────
    if (profile?.education) {
        children.push(createArcherSectionHeader("EDUCATION"));
        const eduEntries = parseEducation(profile.education);

        for (const edu of eduEntries) {
            // Format: Institution | Degree | Dates
            const parts: string[] = [];
            if (edu.school) parts.push(edu.school);
            if (edu.degree) parts.push(edu.degree);
            if (edu.dates) parts.push(edu.dates);

            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: parts.join(" | "),
                            bold: true,
                            size: FONT_SIZE.body,
                            font: FONT,
                        }),
                    ],
                    spacing: { after: 10 },
                })
            );

            // GPA line
            if (edu.gpa) {
                children.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `GPA: ${edu.gpa}`,
                                size: FONT_SIZE.body,
                                font: FONT,
                            }),
                        ],
                        spacing: { after: 10 },
                    })
                );
            }

            if (edu.coursework) {
                children.push(createSkillLine("Relevant Coursework", edu.coursework));
            }
        }
    }

    // ── TECHNICAL SKILLS (underlined header) ─────────────────
    if (profile?.skills) {
        children.push(createArcherSectionHeader("TECHNICAL SKILLS"));
        const skillCategories = parseSkills(profile.skills);
        for (const cat of skillCategories) {
            // Bullet point with bold category
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${cat.category}: `,
                            bold: true,
                            size: FONT_SIZE.body,
                            font: FONT,
                        }),
                        new TextRun({
                            text: cat.skills,
                            size: FONT_SIZE.body,
                            font: FONT,
                        }),
                    ],
                    bullet: { level: 0 },
                    spacing: { after: 10 },
                })
            );
        }
    }

    // ── CORE ENGINEERING PROJECTS (underlined header) ─────────
    if (projects.length > 0) {
        children.push(createArcherSectionHeader("CORE ENGINEERING PROJECTS"));
        const maxProj = maxPages === 1 ? 5 : 7;
        const maxBullets = maxPages === 1 ? 2 : 4;

        for (const proj of projects.slice(0, maxProj)) {
            // Project Title | Tech Stack (italic) | [Link]
            const titleRuns: TextRun[] = [
                new TextRun({
                    text: formatProjectTitle(proj.title),
                    bold: true,
                    size: FONT_SIZE.body,
                    font: FONT,
                }),
            ];

            if (proj.techStack) {
                titleRuns.push(
                    new TextRun({ text: " | ", size: FONT_SIZE.body, font: FONT }),
                    new TextRun({
                        text: proj.techStack,
                        italics: true,
                        size: FONT_SIZE.body,
                        font: FONT,
                    })
                );
            }

            // Add link if available (from project data)
            titleRuns.push(
                new TextRun({ text: " | ", size: FONT_SIZE.body, font: FONT }),
                new TextRun({
                    text: "[Link]",
                    size: FONT_SIZE.body,
                    font: FONT,
                    color: "0563C1",
                    underline: { type: UnderlineType.SINGLE },
                })
            );

            children.push(
                new Paragraph({
                    children: titleRuns,
                    spacing: { before: 60, after: 10 },
                })
            );

            // Bullet points for the project
            if (proj.outcomes) {
                const bullets = proj.outcomes.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            } else if (proj.description) {
                children.push(createBullet(proj.description));
            }
        }
    }

    // ── PROFESSIONAL EXPERIENCE & LEADERSHIP ─────────────────
    if (experiences.length > 0) {
        children.push(createArcherSectionHeader("PROFESSIONAL EXPERIENCE & LEADERSHIP"));
        const maxExp = maxPages === 1 ? 3 : 5;
        const maxBullets = maxPages === 1 ? 2 : 4;

        for (const exp of experiences.slice(0, maxExp)) {
            // Organization | Role (italic) | Dates
            const expRuns: TextRun[] = [
                new TextRun({
                    text: exp.company,
                    bold: true,
                    size: FONT_SIZE.body,
                    font: FONT,
                }),
            ];

            if (exp.position) {
                expRuns.push(
                    new TextRun({ text: " | ", size: FONT_SIZE.body, font: FONT }),
                    new TextRun({
                        text: exp.position,
                        italics: true,
                        size: FONT_SIZE.body,
                        font: FONT,
                    })
                );
            }

            const dateStr = `${exp.startDate || ""} – ${exp.endDate || "Present"}`;
            if (dateStr.trim() !== "–") {
                expRuns.push(
                    new TextRun({ text: " | ", size: FONT_SIZE.body, font: FONT }),
                    new TextRun({
                        text: dateStr,
                        italics: true,
                        size: FONT_SIZE.body,
                        font: FONT,
                    })
                );
            }

            children.push(
                new Paragraph({
                    children: expRuns,
                    spacing: { before: 60, after: 10 },
                })
            );

            // Bullets
            const bulletText = [
                exp.responsibilities,
                exp.achievements,
            ].filter(Boolean).join("\n");

            if (bulletText) {
                const bullets = bulletText.split(/\n/).filter(s => s.trim());
                for (const b of bullets.slice(0, maxBullets)) {
                    children.push(createBullet(b));
                }
            }
        }
    }

    // ── Other Experience / Certifications ─────────────────
    if (profile?.otherExperience) {
        children.push(createArcherSectionHeader("ADDITIONAL EXPERIENCE"));
        const lines = profile.otherExperience.split(/\n/).filter(l => l.trim());
        for (const line of lines.slice(0, 4)) {
            children.push(createBullet(line));
        }
    }

    return new Document({
        sections: [{
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
        }],
    });
}

/**
 * Archer IRM section header: Bold, ALL CAPS, Underlined
 */
function createArcherSectionHeader(text: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({
                text: text.toUpperCase(),
                bold: true,
                size: FONT_SIZE.sectionHeader,
                font: FONT,
                underline: { type: UnderlineType.SINGLE },
            }),
        ],
        spacing: { before: SPACING.beforeSection, after: SPACING.afterSection },
    });
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Export resume as buffer
 */
export async function renderResumeWithTemplate(
    template: ResumeTemplate,
    profile: Profile,
    experiences: Experience[],
    projects: Project[],
    maxPages: number = 1
): Promise<Buffer> {
    const doc = buildResumeWithTemplate(template, profile, experiences, projects, maxPages);
    return Buffer.from(await Packer.toBuffer(doc));
}

