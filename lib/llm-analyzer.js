// Resume Scorer - LLM Analyzer (AI Enhancement)

export class LLMAnalyzer {
  /**
   * Calls an external agent API for review
   * @param {string} cleanResume - The cleaned resume text
   * @param {string} cleanJD - The cleaned job description text
   * @param {Object} keywordResult - Results from keyword matcher
   * @returns {Promise<Object>} Parsed API response
   */
  static async callAgentToReview(cleanResume, cleanJD, keywordResult) {
    try {
      const response = await fetch('https://resume-scorer-server.vercel.app/check-resume-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume: cleanResume, jobDescription: cleanJD, keywordResult }),
      });
     
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const aiResult = await response.json();
      const aiStructuredResponse = JSON.parse(aiResult?.data?.content);
      // Ensure expected fields exist; fallback to empty defaults if needed
      return {
        overallScore: aiStructuredResponse.overallScore ?? 0,
        breakdown: aiStructuredResponse.breakdown ?? { keywords: 0, experience: 0, skills: 0, education: 0 },
        missingKeywords: aiStructuredResponse.missingKeywords ?? [],
        missingSkills: aiStructuredResponse.missingSkills ?? [],
        suggestions: aiStructuredResponse.suggestions ?? [],
        atsIssues: aiStructuredResponse.atsIssues ?? [],
        atsScore: aiStructuredResponse.atsScore ?? 0,
        analysis: aiStructuredResponse.analysis ?? "",
        strengths: aiStructuredResponse.strengths ?? [],
        redFlags: aiStructuredResponse.redFlags ?? [],
      };
    } catch (error) {
      console.error('Agent API error:', error);
      throw new Error(`Agent review failed: ${error.message}`);
    }
  }
}