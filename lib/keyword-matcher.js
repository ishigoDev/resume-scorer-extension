// Resume Scorer - Keyword Matcher (Local Scoring)

export class KeywordMatcher {
  // Common tech skills taxonomy
  static SKILLS_TAXONOMY = {
    languages: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css'],
    frontend: ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'webpack', 'vite', 'tailwind', 'bootstrap', 'material-ui', 'styled-components', 'redux', 'zustand', 'tanstack query', 'graphql', 'rest api'],
    backend: ['node.js', 'express', 'fastify', 'django', 'flask', 'spring boot', 'asp.net', 'rails', 'laravel', 'gin', 'echo', 'nestjs', 'graphql', 'grpc', 'websocket'],
    database: ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'sqlite', 'oracle', 'sql server', 'firebase', 'supabase', 'prisma', 'typeorm', 'sequelize'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ansible', 'ci/cd', 'github actions', 'gitlab ci', 'jenkins', 'circleci', 'vercel', 'netlify', 'cloudflare'],
    data: ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'hugging face', 'spark', 'hadoop', 'kafka', 'airflow', 'dbt', 'snowflake', 'bigquery', 'tableau', 'power bi'],
    testing: ['jest', 'vitest', 'cypress', 'playwright', 'selenium', 'pytest', 'junit', 'mockito', 'testing library', 'supertest'],
    tools: ['git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'figma', 'postman', 'insomnia', 'swagger', 'openapi', 'linux', 'bash', 'vim', 'vscode'],
    methodologies: ['agile', 'scrum', 'kanban', 'tdd', 'bdd', 'ci/cd', 'microservices', 'monorepo', 'ddd', 'clean architecture', 'solid', 'design patterns']
  };

  // Flatten all skills
  static ALL_SKILLS = Object.values(KeywordMatcher.SKILLS_TAXONOMY).flat();

  // Soft skills
  static SOFT_SKILLS = ['communication', 'leadership', 'teamwork', 'problem solving', 'analytical', 'creative', 'adaptable', 'collaborative', 'mentoring', 'project management', 'time management', 'critical thinking'];

  static analyze(resumeText, jdText, weights = {}) {
    const resumeLower = resumeText.toLowerCase();
    const jdLower = jdText.toLowerCase();

    // Extract keywords from JD
    const jdKeywords = this.extractKeywords(jdLower);
    const jdSkills = this.extractSkills(jdLower);
    const jdSoftSkills = this.extractSoftSkills(jdLower);
    const jdExperience = this.extractExperienceRequirements(jdLower);
    const jdEducation = this.extractEducationRequirements(jdLower);

    // Score each category
    const keywordScore = this.calculateMatchScore(resumeLower, jdKeywords);
    const skillsScore = this.calculateMatchScore(resumeLower, jdSkills);
    const experienceScore = this.calculateExperienceMatch(resumeLower, jdExperience);
    const educationScore = this.calculateEducationMatch(resumeLower, jdEducation);

    // Find missing items
    const missingKeywords = this.findMissing(resumeLower, jdKeywords).slice(0, 20);
    const missingSkills = this.findMissing(resumeLower, jdSkills).slice(0, 15);
    const missingSoftSkills = this.findMissing(resumeLower, jdSoftSkills).slice(0, 5);

    // Generate suggestions
    const suggestions = this.generateSuggestions({
      keywordScore,
      skillsScore,
      experienceScore,
      educationScore,
      missingKeywords,
      missingSkills,
      jdExperience,
      jdEducation
    });

    return {
      keywordScore: Math.round(keywordScore),
      skillsScore: Math.round(skillsScore),
      experienceScore: Math.round(experienceScore),
      educationScore: Math.round(educationScore),
      missingKeywords,
      missingSkills: [...missingSkills, ...missingSoftSkills],
      suggestions,
      jdKeywords: jdKeywords.slice(0, 30),
      jdSkills: jdSkills.slice(0, 20)
    };
  }

  static extractKeywords(text) {
    // Extract meaningful words, prioritizing skills and proper nouns
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use', 'with', 'from', 'they', 'this', 'that', 'will', 'your', 'have', 'been', 'were', 'when', 'make', 'like', 'time', 'just', 'know', 'take', 'into', 'year', 'come', 'show', 'also', 'around', 'form', 'three', 'small', 'work', 'well', 'such', 'here', 'most', 'after', 'many', 'must', 'about', 'than', 'then', 'other', 'could', 'these', 'first', 'would', 'there', 'their', 'what', 'which', 'each', 'very', 'more', 'some', 'any', 'should', 'because', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'once', 'where', 'while', 'being', 'having', 'doing', 'having', 'done', 'said', 'says', 'saying', 'said',
      // Additional generic terms common in job descriptions that add little value
      'job', 'role', 'position', 'team', 'company', 'experience', 'skills', 'able', 'ability', 'using', 'work', 'develop', 'developed', 'developing', 'manage', 'managed', 'managing', 'lead', 'led', 'leading', 'create', 'created', 'creating', 'build', 'built', 'building', 'design', 'designed', 'designing', 'need', 'needs', 'looking', 'seek', 'seeking', 'must', 'should', 'will', 'can', 'may', 'etc', 'etc.', 'etc', 'etc', 'etc'
    ]);

    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const freq = {};
    for (const word of words) {
      if (stopWords.has(word) || word.length < 3) continue;
      // Boost score for words that are in our skills taxonomy or appear capitalized (proper nouns/acronyms)
      const isSkill = KeywordMatcher.ALL_SKILLS.some(s => s.toLowerCase() === word);
      const isCapitalized = /^[A-Z]/.test(word); // simple check for capitalized words in original text (we lose case, so approximate)
      // We'll still count all but later we can prioritize; for simplicity, we keep freq but later filter.
      freq[word] = (freq[word] || 0) + 1;
    }

    // Return top keywords by frequency, but prefer skills and capitalized words
    const scored = Object.entries(freq).map(([word, count]) => {
      const isSkill = KeywordMatcher.ALL_SKILLS.some(s => s.toLowerCase() === word);
      const isCapitalized = /^[A-Z]/.test(word); // approximate; we lost original case, but we can check if word is all uppercase? We'll skip.
      let boost = 0;
      if (isSkill) boost += 2;
      if (isCapitalized) boost += 1;
      // Prefer longer words (more specific)
      if (word.length > 6) boost += 1;
      return { word, count, boost };
    });
    scored.sort((a, b) => {
      if (a.count + a.boost !== b.count + b.boost) {
        return (b.count + b.boost) - (a.count + a.boost);
      }
      return b.count - a.count;
    });
    return scored.slice(0, 30).map(item => item.word);
  }

  static extractSkills(text) {
    const found = [];
    for (const skill of this.ALL_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        found.push(skill);
      }
    }
    return found;
  }

  static extractSoftSkills(text) {
    const found = [];
    for (const skill of this.SOFT_SKILLS) {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        found.push(skill);
      }
    }
    return found;
  }

  static extractExperienceRequirements(text) {
    const patterns = [
      /(\d+)\+?\s*years?\s*(of\s*)?experience/gi,
      /(\d+)\+?\s*yrs?\s*(of\s*)?experience/gi,
      /minimum\s*(\d+)\s*years?/gi,
      /at least\s*(\d+)\s*years?/gi,
      /(\d+)\s*to\s*(\d+)\s*years?/gi
    ];

    const years = [];
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        years.push(parseInt(match[1]));
        if (match[2]) years.push(parseInt(match[2]));
      }
    }

    return {
      minYears: years.length > 0 ? Math.min(...years) : 0,
      maxYears: years.length > 0 ? Math.max(...years) : 0,
      mentioned: years.length > 0
    };
  }

  static extractEducationRequirements(text) {
    const degrees = [
      'phd', 'doctorate', 'master', 'mba', 'msc', 'ms ', 'm.s.', 'bachelor', 'bsc', 'bs ', 'b.s.', 'ba ', 'b.a.',
      'associate', 'diploma', 'certificate', 'bootcamp', 'high school', 'ged'
    ];

    const found = [];
    for (const degree of degrees) {
      const regex = new RegExp(`\\b${degree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(text)) {
        found.push(degree.trim());
      }
    }
    return found;
  }

  static calculateMatchScore(resumeText, jdItems) {
    if (jdItems.length === 0) return 50; // Neutral if no keywords to match

    let matches = 0;
    for (const item of jdItems) {
      const regex = new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeText)) {
        matches++;
      }
    }

    return (matches / jdItems.length) * 100;
  }

  static calculateExperienceMatch(resumeText, jdExp) {
    if (!jdExp.mentioned) return 70; // Neutral if not specified

    // Extract years from resume
    const expPatterns = [
      /(\d+)\+?\s*years?\s*(of\s*)?experience/gi,
      /(\d+)\+?\s*yrs?\s*(of\s*)?experience/gi,
      /experience[:\s]*(\d+)\+?\s*years?/gi
    ];

    let resumeYears = 0;
    for (const pattern of expPatterns) {
      const matches = resumeText.matchAll(pattern);
      for (const match of matches) {
        resumeYears = Math.max(resumeYears, parseInt(match[1]));
      }
    }

    // Also look for date ranges in experience section
    const dateRanges = resumeText.match(/(20\d{2}|19\d{2})\s*[-–]\s*(20\d{2}|19\d{2}|present|current)/gi);
    if (dateRanges) {
      let totalYears = 0;
      for (const range of dateRanges) {
        const years = range.match(/\d{4}/g);
        if (years && years.length >= 2) {
          totalYears += parseInt(years[1]) - parseInt(years[0]);
        } else if (years && /present|current/i.test(range)) {
          totalYears += new Date().getFullYear() - parseInt(years[0]);
        }
      }
      resumeYears = Math.max(resumeYears, totalYears);
    }

    if (resumeYears >= jdExp.maxYears) return 100;
    if (resumeYears >= jdExp.minYears) return 80;
    if (resumeYears >= jdExp.minYears * 0.7) return 60;
    if (resumeYears > 0) return 40;
    return 20;
  }

  static calculateEducationMatch(resumeText, jdEducation) {
    if (jdEducation.length === 0) return 70; // Neutral

    const degreeHierarchy = {
      'phd': 6, 'doctorate': 6,
      'master': 5, 'mba': 5, 'msc': 5, 'ms ': 5, 'm.s.': 5,
      'bachelor': 4, 'bsc': 4, 'bs ': 4, 'b.s.': 4, 'ba ': 4, 'b.a.': 4,
      'associate': 3, 'diploma': 3,
      'certificate': 2, 'bootcamp': 2,
      'high school': 1, 'ged': 1
    };

    let resumeMaxLevel = 0;
    for (const [degree, level] of Object.entries(degreeHierarchy)) {
      const regex = new RegExp(`\\b${degree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (regex.test(resumeText)) {
        resumeMaxLevel = Math.max(resumeMaxLevel, level);
      }
    }

    let jdMaxLevel = 0;
    for (const degree of jdEducation) {
      for (const [key, level] of Object.entries(degreeHierarchy)) {
        if (degree.includes(key)) {
          jdMaxLevel = Math.max(jdMaxLevel, level);
          break;
        }
      }
    }

    if (jdMaxLevel === 0) return 70;
    if (resumeMaxLevel >= jdMaxLevel) return 100;
    if (resumeMaxLevel >= jdMaxLevel - 1) return 80;
    if (resumeMaxLevel > 0) return 50;
    return 30;
  }

  static findMissing(resumeText, jdItems) {
    return jdItems.filter(item => {
      const regex = new RegExp(`\\b${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return !regex.test(resumeText);
    });
  }

  static generateSuggestions(data) {
    const suggestions = [];

    if (data.keywordScore < 50) {
      suggestions.push('Add more relevant keywords from the job description to your resume.');
    }
    if (data.skillsScore < 60) {
      suggestions.push(`Highlight these missing technical skills: ${data.missingSkills.slice(0, 5).join(', ')}.`);
    }
    if (data.experienceScore < 60) {
      suggestions.push('Emphasize relevant experience years and quantify achievements with metrics.');
    }
    if (data.educationScore < 60) {
      suggestions.push('Consider adding relevant certifications or coursework if you lack the required degree.');
    }
    if (data.missingKeywords.length > 10) {
      suggestions.push('Incorporate more job-specific keywords throughout your resume sections.');
    }
    if (data.missingSkills.length > 5) {
      suggestions.push('Create a dedicated "Technical Skills" section listing the missing technologies.');
    }

    // General suggestions
    suggestions.push('Use the exact terminology from the job description (e.g., "React" not "React.js").');
    suggestions.push('Quantify achievements with numbers (e.g., "Improved performance by 40%").');
    suggestions.push('Tailor your professional summary to match the job requirements.');

    return suggestions.slice(0, 8);
  }
}