/**
 * ATS (Applicant Tracking System) Score Calculator
 * Analyzes resume content for ATS compatibility and provides actionable feedback
 */

export type ATSIssue = {
    severity: "critical" | "warning" | "info";
    category: string;
    message: string;
    suggestion: string;
};

export type ATSScore = {
    score: number; // 0-100
    breakdown: {
        formatting: number; // 0-30
        keywords: number; // 0-40
        content: number; // 0-30
    };
    issues: ATSIssue[];
    strengths: string[];
};

/**
 * Calculate ATS compatibility score for resume content
 */
export function calculateATSScore(
    resumeText: string,
    jobDescription?: string
): ATSScore {
    const issues: ATSIssue[] = [];
    const strengths: string[] = [];
    let formattingScore = 30;
    let keywordScore = 40;
    let contentScore = 30;

    // Check formatting issues
    const formattingChecks = checkFormatting(resumeText);
    formattingScore -= formattingChecks.deductions;
    issues.push(...formattingChecks.issues);
    strengths.push(...formattingChecks.strengths);

    // Check content quality
    const contentChecks = checkContent(resumeText);
    contentScore -= contentChecks.deductions;
    issues.push(...contentChecks.issues);
    strengths.push(...contentChecks.strengths);

    // Check keyword matching if job description provided
    if (jobDescription) {
        const keywordChecks = checkKeywords(resumeText, jobDescription);
        keywordScore -= keywordChecks.deductions;
        issues.push(...keywordChecks.issues);
        strengths.push(...keywordChecks.strengths);
    } else {
        // Without job description, give partial keyword score
        keywordScore = 25;
        issues.push({
            severity: "info",
            category: "Keywords",
            message: "No job description provided for keyword analysis",
            suggestion: "Paste a job description to get keyword matching feedback",
        });
    }

    const totalScore = Math.max(
        0,
        Math.min(100, formattingScore + keywordScore + contentScore)
    );

    return {
        score: Math.round(totalScore),
        breakdown: {
            formatting: Math.max(0, Math.round(formattingScore)),
            keywords: Math.max(0, Math.round(keywordScore)),
            content: Math.max(0, Math.round(contentScore)),
        },
        issues,
        strengths,
    };
}

function checkFormatting(text: string) {
    const issues: ATSIssue[] = [];
    const strengths: string[] = [];
    let deductions = 0;

    // Check for special characters that might confuse ATS
    const problematicChars = /[│┃║╔╗╚╝═]/g;
    if (problematicChars.test(text)) {
        issues.push({
            severity: "warning",
            category: "Formatting",
            message: "Special box-drawing characters detected",
            suggestion: "Use simple dashes (-) or asterisks (*) for bullet points",
        });
        deductions += 3;
    } else {
        strengths.push("Clean formatting without special characters");
    }

    // Check for email (critical for ATS)
    const hasEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text);
    if (hasEmail) {
        strengths.push("Email address present");
    } else {
        issues.push({
            severity: "critical",
            category: "Contact",
            message: "No email address found",
            suggestion: "ATS systems require an email. Add your email to the contact section.",
        });
        deductions += 8;
    }

    // Check for standard section headers
    const standardHeaders = [
        /experience/i,
        /education/i,
        /skills/i,
        /projects/i,
    ];
    const foundHeaders = standardHeaders.filter((regex) => regex.test(text));
    if (foundHeaders.length >= 3) {
        strengths.push("Standard section headers present");
    } else {
        issues.push({
            severity: "warning",
            category: "Structure",
            message: "Missing standard section headers",
            suggestion:
                "Include clear sections: Experience, Education, Skills, Projects",
        });
        deductions += 5;
    }

    // Check for phone number (supplemental)
    const hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text);
    if (hasPhone) {
        strengths.push("Phone number included");
    } else {
        issues.push({
            severity: "info",
            category: "Contact",
            message: "No phone number detected",
            suggestion: "Consider adding a phone number",
        });
        deductions += 1;
    }

    // Check for excessive length
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 800) {
        issues.push({
            severity: "warning",
            category: "Length",
            message: "Resume may be too long",
            suggestion:
                "Aim for 400-600 words for students, 600-800 for experienced professionals",
        });
        deductions += 3;
    } else if (wordCount >= 300) {
        strengths.push("Appropriate resume length");
    }

    // Check for categorized skills section ("Category: skill1, skill2")
    const hasCategorizedSkills = /\b(Languages|Frameworks|Tools|Technologies|Cloud|Platforms|Databases)\s*:/i.test(text);
    if (hasCategorizedSkills) {
        strengths.push("Skills organized by category (ATS-friendly)");
    } else {
        const hasSkillsSection = /skills/i.test(text);
        if (hasSkillsSection) {
            issues.push({
                severity: "info",
                category: "Structure",
                message: "Skills section found but not categorized",
                suggestion: "Organize skills by category (e.g., Languages: Python, Java | Frameworks: React, Django)",
            });
            deductions += 2;
        }
    }

    return { issues, strengths, deductions };
}

function checkContent(text: string) {
    const issues: ATSIssue[] = [];
    const strengths: string[] = [];
    let deductions = 0;

    // Check for action verbs
    const actionVerbs = [
        "developed", "created", "implemented", "designed", "built",
        "led", "managed", "improved", "increased", "reduced",
        "achieved", "collaborated", "analyzed", "optimized",
        "engineered", "architected", "deployed", "integrated",
        "automated", "streamlined", "spearheaded", "orchestrated",
        "established", "transformed", "delivered", "launched",
    ];
    const foundVerbs = actionVerbs.filter((verb) =>
        new RegExp(`\\b${verb}\\b`, "i").test(text)
    );
    if (foundVerbs.length >= 6) {
        strengths.push(`Strong action verbs used (${foundVerbs.length} found)`);
    } else if (foundVerbs.length >= 3) {
        strengths.push("Good action verb usage");
    } else {
        issues.push({
            severity: "warning",
            category: "Content",
            message: "Limited use of action verbs",
            suggestion:
                "Start bullet points with strong action verbs (Engineered, Implemented, Architected, Optimized, etc.)",
        });
        deductions += 5;
    }

    // Check for quantifiable achievements
    const hasNumbers = /\b\d+%|\b\d+x\b|\b\d+\+/.test(text);
    if (hasNumbers) {
        strengths.push("Quantifiable achievements included");
    } else {
        issues.push({
            severity: "info",
            category: "Content",
            message: "No quantifiable metrics found",
            suggestion:
                "Add numbers to show impact (e.g., 'Improved performance by 30%')",
        });
        deductions += 3;
    }

    // Check for buzzwords without substance
    const buzzwords = ["synergy", "rockstar", "ninja", "guru", "wizard"];
    const foundBuzzwords = buzzwords.filter((word) =>
        new RegExp(`\\b${word}\\b`, "i").test(text)
    );
    if (foundBuzzwords.length > 0) {
        issues.push({
            severity: "warning",
            category: "Content",
            message: "Buzzwords detected: " + foundBuzzwords.join(", "),
            suggestion:
                "Replace buzzwords with specific skills and achievements",
        });
        deductions += 4;
    }

    // Check for personal pronouns (should avoid in resume)
    const pronouns = /\b(I|me|my|we|our)\b/g;
    const pronounMatches = text.match(pronouns);
    if (pronounMatches && pronounMatches.length > 3) {
        issues.push({
            severity: "info",
            category: "Style",
            message: "Excessive use of personal pronouns",
            suggestion:
                "Remove 'I', 'me', 'my' - start bullet points with action verbs",
        });
        deductions += 2;
    }

    return { issues, strengths, deductions };
}

function checkKeywords(resumeText: string, jobDescription: string) {
    const issues: ATSIssue[] = [];
    const strengths: string[] = [];
    let deductions = 0;

    // Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);

    // Calculate keyword match percentage
    const matchedKeywords = jobKeywords.filter((kw) =>
        resumeKeywords.includes(kw)
    );
    const matchPercentage = (matchedKeywords.length / jobKeywords.length) * 100;

    if (matchPercentage >= 60) {
        strengths.push(
            `Strong keyword match: ${Math.round(matchPercentage)}% of job keywords found`
        );
    } else if (matchPercentage >= 40) {
        issues.push({
            severity: "warning",
            category: "Keywords",
            message: `Moderate keyword match: ${Math.round(matchPercentage)}%`,
            suggestion: `Add these missing keywords: ${jobKeywords.filter((kw) => !resumeKeywords.includes(kw)).slice(0, 5).join(", ")}`,
        });
        deductions += 10;
    } else {
        issues.push({
            severity: "critical",
            category: "Keywords",
            message: `Low keyword match: ${Math.round(matchPercentage)}%`,
            suggestion: `Your resume is missing key terms from the job description. Add: ${jobKeywords.filter((kw) => !resumeKeywords.includes(kw)).slice(0, 8).join(", ")}`,
        });
        deductions += 20;
    }

    // Check for required skills
    const requiredSkills = extractRequiredSkills(jobDescription);
    const missingSkills = requiredSkills.filter(
        (skill) => !new RegExp(`\\b${skill}\\b`, "i").test(resumeText)
    );
    if (missingSkills.length > 0 && missingSkills.length < requiredSkills.length) {
        issues.push({
            severity: "warning",
            category: "Skills",
            message: "Missing some required skills",
            suggestion: `Consider adding: ${missingSkills.slice(0, 5).join(", ")}`,
        });
        deductions += 5;
    }

    return { issues, strengths, deductions };
}

function extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful keywords
    const commonWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "from",
        "as",
        "is",
        "was",
        "are",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "should",
        "could",
        "may",
        "might",
        "must",
        "can",
        "this",
        "that",
        "these",
        "those",
    ]);

    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s+#.-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !commonWords.has(w));

    // Extract multi-word phrases (bigrams)
    const phrases: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
        const phrase = `${words[i]} ${words[i + 1]}`;
        if (
            /^[a-z]+\s[a-z]+$/.test(phrase) &&
            !commonWords.has(words[i]) &&
            !commonWords.has(words[i + 1])
        ) {
            phrases.push(phrase);
        }
    }

    return Array.from(new Set([...words, ...phrases]));
}

function extractRequiredSkills(jobDescription: string): string[] {
    const skills: string[] = [];
    const text = jobDescription.toLowerCase();

    // Common tech skills
    const techSkills = [
        "python",
        "java",
        "javascript",
        "typescript",
        "react",
        "node.js",
        "angular",
        "vue",
        "sql",
        "nosql",
        "mongodb",
        "postgresql",
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "git",
        "ci/cd",
        "agile",
        "scrum",
        "rest api",
        "graphql",
        "machine learning",
        "data analysis",
        "tensorflow",
        "pytorch",
    ];

    techSkills.forEach((skill) => {
        if (text.includes(skill)) {
            skills.push(skill);
        }
    });

    return skills;
}
