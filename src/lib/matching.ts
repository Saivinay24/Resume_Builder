/**
 * Enhanced matching algorithm using TF-IDF and semantic analysis
 */

type TokenFrequency = Map<string, number>;
type DocumentVector = Map<string, number>;

export type MatchedProject = {
  id: string;
  title: string;
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  relevanceReason: string;
};

export type MatchResult = {
  projects: MatchedProject[];
  jobKeywords: string[];
  suggestedMissing: string[];
  topSkills: string[];
};

/**
 * Enhanced project matching using TF-IDF and semantic analysis
 */
export function matchProjectsToJob(
  jobDescription: string,
  projects: Array<{
    id: string;
    title: string;
    description: string | null;
    techStack: string | null;
    outcomes: string | null;
    tags: string | null;
    role: string | null;
  }>
): MatchResult {
  // Extract and normalize keywords from job description
  const jobTokens = tokenizeWithPhrases(jobDescription);
  const jobKeywords = Array.from(new Set(jobTokens));

  // Calculate TF-IDF scores for all projects
  const projectScores = projects.map((project) => {
    const projectText = [
      project.title,
      project.description || "",
      project.techStack || "",
      project.outcomes || "",
      project.tags || "",
      project.role || "",
    ].join(" ");

    const projectTokens = tokenizeWithPhrases(projectText);
    const score = calculateTFIDFScore(jobTokens, projectTokens, projects.length);
    const matchedKeywords = findMatchedKeywords(jobKeywords, projectTokens);
    const missingKeywords = jobKeywords.filter(
      (kw) => !matchedKeywords.includes(kw)
    );

    // Calculate relevance reason
    const relevanceReason = generateRelevanceReason(
      project,
      matchedKeywords,
      score
    );

    return {
      id: project.id,
      title: project.title,
      score,
      matchedKeywords,
      missingKeywords,
      relevanceReason,
    };
  });

  // Sort by score descending
  projectScores.sort((a, b) => b.score - a.score);

  // Extract top skills from job description
  const topSkills = extractTopSkills(jobDescription);

  // Find keywords missing across all top projects
  const topProjects = projectScores.slice(0, 5);
  const allMatchedKeywords = new Set(
    topProjects.flatMap((p) => p.matchedKeywords)
  );
  const suggestedMissing = jobKeywords
    .filter((kw) => !allMatchedKeywords.has(kw))
    .slice(0, 10);

  return {
    projects: projectScores,
    jobKeywords,
    suggestedMissing,
    topSkills,
  };
}

/**
 * Tokenize text with support for multi-word phrases and technical terms
 */
function tokenizeWithPhrases(text: string): string[] {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s+#.-]/g, " ");
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  const tokens: string[] = [];
  const stopWords = new Set([
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
    "will",
    "would",
    "should",
    "could",
  ]);

  // Add individual words (excluding stop words)
  words.forEach((word) => {
    if (word.length > 2 && !stopWords.has(word)) {
      tokens.push(word);
    }
  });

  // Add bigrams (two-word phrases)
  for (let i = 0; i < words.length - 1; i++) {
    if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
      tokens.push(`${words[i]} ${words[i + 1]}`);
    }
  }

  // Add trigrams for technical terms
  for (let i = 0; i < words.length - 2; i++) {
    const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    if (
      /^[a-z]+\s[a-z]+\s[a-z]+$/.test(trigram) &&
      (trigram.includes("machine") ||
        trigram.includes("learning") ||
        trigram.includes("data") ||
        trigram.includes("software"))
    ) {
      tokens.push(trigram);
    }
  }

  return tokens;
}

/**
 * Calculate TF-IDF score between job description and project
 */
function calculateTFIDFScore(
  jobTokens: string[],
  projectTokens: string[],
  totalProjects: number
): number {
  const jobFreq = calculateTermFrequency(jobTokens);
  const projectFreq = calculateTermFrequency(projectTokens);

  let score = 0;
  const matchedTerms = new Set<string>();

  jobFreq.forEach((jobTF, term) => {
    if (projectFreq.has(term)) {
      matchedTerms.add(term);
      const projectTF = projectFreq.get(term)!;

      // TF-IDF calculation
      // TF: term frequency in both documents
      // IDF: inverse document frequency (simplified)
      const tf = Math.min(jobTF, projectTF);
      const idf = Math.log(totalProjects / (1 + 1)); // Simplified IDF

      // Boost score for exact matches
      const boost = term.includes(" ") ? 1.5 : 1.0; // Boost phrases
      score += tf * idf * boost;
    }
  });

  // Normalize score by job description length
  const normalizedScore = (score / jobTokens.length) * 100;

  // Add bonus for keyword coverage
  const coverage = matchedTerms.size / jobFreq.size;
  const coverageBonus = coverage * 20;

  return Math.min(100, normalizedScore + coverageBonus);
}

/**
 * Calculate term frequency for tokens
 */
function calculateTermFrequency(tokens: string[]): TokenFrequency {
  const freq = new Map<string, number>();
  tokens.forEach((token) => {
    freq.set(token, (freq.get(token) || 0) + 1);
  });
  return freq;
}

/**
 * Find keywords that match between job and project
 */
function findMatchedKeywords(
  jobKeywords: string[],
  projectTokens: string[]
): string[] {
  const projectTokenSet = new Set(projectTokens);
  return jobKeywords.filter((kw) => projectTokenSet.has(kw));
}

/**
 * Generate human-readable relevance reason
 */
function generateRelevanceReason(
  project: { title: string; techStack: string | null },
  matchedKeywords: string[],
  score: number
): string {
  if (score > 70) {
    return `Strong match: ${matchedKeywords.slice(0, 3).join(", ")}`;
  } else if (score > 40) {
    return `Good match: ${matchedKeywords.slice(0, 2).join(", ")}`;
  } else if (score > 20) {
    return `Moderate match: ${matchedKeywords.slice(0, 1).join(", ")}`;
  } else {
    return "Low relevance to job description";
  }
}

/**
 * Extract top skills from job description
 */
function extractTopSkills(jobDescription: string): string[] {
  const text = jobDescription.toLowerCase();
  const skills: { skill: string; count: number }[] = [];

  // Common technical skills database
  const skillDatabase = [
    // Programming Languages
    "python",
    "java",
    "javascript",
    "typescript",
    "c++",
    "c#",
    "go",
    "rust",
    "swift",
    "kotlin",
    "ruby",
    "php",
    "scala",

    // Frontend
    "react",
    "angular",
    "vue",
    "svelte",
    "next.js",
    "html",
    "css",
    "sass",
    "tailwind",

    // Backend
    "node.js",
    "express",
    "django",
    "flask",
    "spring boot",
    "asp.net",

    // Databases
    "sql",
    "nosql",
    "mongodb",
    "postgresql",
    "mysql",
    "redis",
    "elasticsearch",

    // Cloud & DevOps
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "terraform",
    "jenkins",
    "ci/cd",

    // Data & ML
    "machine learning",
    "deep learning",
    "data analysis",
    "tensorflow",
    "pytorch",
    "pandas",
    "numpy",
    "scikit-learn",

    // Other
    "git",
    "agile",
    "scrum",
    "rest api",
    "graphql",
    "microservices",
    "testing",
    "unit testing",
  ];

  skillDatabase.forEach((skill) => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = text.match(regex);
    if (matches) {
      skills.push({ skill, count: matches.length });
    }
  });

  // Sort by frequency and return top 10
  return skills
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((s) => s.skill);
}
