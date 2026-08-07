// Resume Scorer - ATS Compatibility Checker

export class ATSChecker {
  static check(resumeText, jdText) {
    const issues = [];
    let score = 100;

    // 1. File format checks (simulated - would need actual file)
    // In real extension, we'd check the actual file

    // 2. Section completeness
    const sections = this.checkSections(resumeText);
    if (!sections.hasSummary) {
      issues.push('Missing professional summary/objective section');
      score -= 8;
    }
    if (!sections.hasExperience) {
      issues.push('Missing work experience section');
      score -= 15;
    }
    if (!sections.hasEducation) {
      issues.push('Missing education section');
      score -= 8;
    }
    if (!sections.hasSkills) {
      issues.push('Missing skills/technologies section');
      score -= 10;
    }

    // 3. Contact information
    const contact = this.checkContactInfo(resumeText);
    if (!contact.hasEmail) {
      issues.push('No email address found');
      score -= 10;
    }
    if (!contact.hasPhone) {
      issues.push('No phone number found');
      score -= 5;
    }
    if (!contact.hasLinkedIn) {
      issues.push('No LinkedIn profile URL found');
      score -= 3;
    }

    // 4. Formatting issues
    const formatting = this.checkFormatting(resumeText);
    if (formatting.hasTables) {
      issues.push('Tables detected - may not parse correctly in ATS');
      score -= 5;
    }
    if (formatting.hasColumns) {
      issues.push('Multi-column layout detected - ATS may read out of order');
      score -= 5;
    }
    if (formatting.hasGraphics) {
      issues.push('Images/graphics detected - not readable by ATS');
      score -= 5;
    }
    if (formatting.hasHeadersFooters) {
      issues.push('Headers/footers may be ignored by ATS');
      score -= 3;
    }
    if (formatting.hasSpecialChars) {
      issues.push('Special characters/bullets may not render correctly');
      score -= 3;
    }

    // 5. Keyword density
    const keywordDensity = this.checkKeywordDensity(resumeText, jdText);
    if (keywordDensity < 0.5) {
      issues.push('Low keyword density - add more relevant terms from job description');
      score -= 10;
    } else if (keywordDensity > 3) {
      issues.push('Possible keyword stuffing - ensure natural language');
      score -= 5;
    }

    // 6. Action verbs and achievements
    const achievements = this.checkAchievements(resumeText);
    if (!achievements.hasQuantifiedResults) {
      issues.push('No quantified achievements (metrics, percentages, numbers)');
      score -= 8;
    }
    if (!achievements.hasStrongVerbs) {
      issues.push('Weak action verbs - use strong verbs (achieved, led, improved, etc.)');
      score -= 5;
    }

    // 7. Length check
    const wordCount = resumeText.split(/\s+/).length;
    if (wordCount < 200) {
      issues.push('Resume too short - add more detail');
      score -= 10;
    } else if (wordCount > 1000) {
      issues.push('Resume very long - consider condensing to 1-2 pages');
      score -= 5;
    }

    // 8. Date format consistency
    const dates = this.checkDateFormat(resumeText);
    if (!dates.consistent) {
      issues.push('Inconsistent date formats - use consistent format (MM/YYYY or Month YYYY)');
      score -= 3;
    }

    // 9. Section order (standard order preferred)
    const order = this.checkSectionOrder(resumeText);
    if (!order.standard) {
      issues.push('Non-standard section order - consider: Summary, Experience, Education, Skills');
      score -= 3;
    }

    return {
      score: Math.max(0, Math.round(score)),
      issues: issues.length > 0 ? issues : ['No major ATS issues detected']
    };
  }

  static checkSections(text) {
    const lower = text.toLowerCase();
    return {
      hasSummary: /summary|profile|objective|about me/i.test(lower),
      hasExperience: /experience|employment|work history|career|professional experience/i.test(lower),
      hasEducation: /education|degree|university|college|academic/i.test(lower),
      hasSkills: /skills|technologies|tech stack|competencies|tools|expertise/i.test(lower)
    };
  }

  static checkContactInfo(text) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const linkedInRegex = /linkedin\.com\/in\/[A-Za-z0-9_-]+/i;

    return {
      hasEmail: emailRegex.test(text),
      hasPhone: phoneRegex.test(text),
      hasLinkedIn: linkedInRegex.test(text)
    };
  }

  static checkFormatting(text) {
    // These are heuristics since we only have text
    // In reality, would need to check original PDF/DOCX structure
    return {
      hasTables: /\t{2,}|\|.*\|.*\|/.test(text), // Tab-separated or markdown tables
      hasColumns: false, // Can't detect from text alone
      hasGraphics: /\[image\]|\[figure\]|\[chart\]/i.test(text),
      hasHeadersFooters: /page \d+ of \d+|confidential|proprietary/i.test(text),
      hasSpecialChars: /[•·▪▫◦‣⁃∙]/g.test(text) // Unicode bullets
    };
  }

  static checkKeywordDensity(resumeText, jdText) {
    // Extract key terms from JD
    const jdWords = jdText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const jdFreq = {};
    for (const word of jdWords) {
      jdFreq[word] = (jdFreq[word] || 0) + 1;
    }

    // Get top 20 JD keywords
    const topKeywords = Object.entries(jdFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    if (topKeywords.length === 0) return 1;

    // Count occurrences in resume
    const resumeLower = resumeText.toLowerCase();
    let matches = 0;
    for (const kw of topKeywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      const count = (resumeLower.match(regex) || []).length;
      matches += count;
    }

    // Density = total keyword matches / resume word count * 100
    const resumeWordCount = resumeText.split(/\s+/).length;
    return (matches / resumeWordCount) * 100;
  }

  static checkAchievements(text) {
    const hasQuantifiedResults = /\d+%|\$\d+|\d+x|\d+ percent|\d+ million|\d+ thousand|increased|decreased|improved|reduced|saved|generated|achieved|delivered/i.test(text);

    const strongVerbs = [
      'achieved', 'spearheaded', 'orchestrated', 'transformed', 'accelerated',
      'optimized', 'maximized', 'minimized', 'streamlined', 'automated',
      'designed', 'architected', 'engineered', 'developed', 'built',
      'created', 'launched', 'delivered', 'executed', 'implemented',
      'led', 'managed', 'directed', 'supervised', 'mentored',
      'improved', 'enhanced', 'boosted', 'increased', 'reduced',
      'saved', 'generated', 'secured', 'negotiated', 'resolved'
    ];

    const hasStrongVerbs = strongVerbs.some(verb =>
      new RegExp(`\\b${verb}\\b`, 'i').test(text)
    );

    return { hasQuantifiedResults, hasStrongVerbs };
  }

  static checkDateFormat(text) {
    const datePatterns = [
      /\b\d{1,2}\/\d{4}\b/g,           // MM/YYYY
      /\b\d{4}\/\d{1,2}\b/g,           // YYYY/MM
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/gi, // Month YYYY
      /\b\d{4}\s*[-–]\s*\d{4}\b/g,     // YYYY-YYYY
      /\b\d{1,2}\/\d{4}\s*[-–]\s*\d{1,2}\/\d{4}\b/g // MM/YYYY - MM/YYYY
    ];

    let allDates = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) allDates.push(...matches);
    }

    if (allDates.length < 2) return { consistent: true }; // Can't determine

    // Check if all dates follow same pattern
    const patterns = allDates.map(d => {
      if (/\d{4}\s*[-–]\s*\d{4}/.test(d)) return 'YYYY-YYYY';
      if (/\d{1,2}\/\d{4}\s*[-–]\s*\d{1,2}\/\d{4}/.test(d)) return 'MM/YYYY-MM/YYYY';
      if (/\d{1,2}\/\d{4}/.test(d)) return 'MM/YYYY';
      if (/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i.test(d)) return 'Month YYYY';
      return 'other';
    });

    const uniquePatterns = [...new Set(patterns)];
    return { consistent: uniquePatterns.length <= 1 };
  }

  static checkSectionOrder(text) {
    const lines = text.split('\n').map(l => l.trim().toLowerCase()).filter(l => l.length > 0);

    const sectionOrder = [
      { name: 'summary', keywords: ['summary', 'profile', 'objective'] },
      { name: 'experience', keywords: ['experience', 'employment', 'work history'] },
      { name: 'education', keywords: ['education', 'degree', 'university'] },
      { name: 'skills', keywords: ['skills', 'technologies', 'competencies'] }
    ];

    const foundIndices = {};
    for (let i = 0; i < lines.length; i++) {
      for (const section of sectionOrder) {
        if (!foundIndices[section.name] && section.keywords.some(k => lines[i].includes(k))) {
          foundIndices[section.name] = i;
        }
      }
    }

    const found = Object.entries(foundIndices)
      .filter(([, idx]) => idx !== undefined)
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);

    // Standard order: summary, experience, education, skills
    const standard = ['summary', 'experience', 'education', 'skills'];
    return { standard: JSON.stringify(found) === JSON.stringify(standard) };
  }
}