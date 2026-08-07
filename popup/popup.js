// Resume Scorer - Popup Logic
import { Storage } from "../lib/storage.js";
import { ResumeParser } from "../lib/resume-parser.js";
import { KeywordMatcher } from "../lib/keyword-matcher.js";
import { ATSChecker } from "../lib/ats-checker.js";
import { LLMAnalyzer } from "../lib/llm-analyzer.js";

class ResumeScorerPopup {
  constructor() {
    this.resumeText = "";
    this.resumeFileName = "";
    this.jdText = "";
    this.jdSource = "";
    this.settings = {};
    this.isScoring = false;

    this.initElements();
    this.bindEvents();
    this.loadSettings();
    this.loadResume();
  }

  initElements() {
    // Resume elements
    this.resumeUploadArea = document.getElementById("resumeUploadArea");
    this.resumeFile = document.getElementById("resumeFile");
    this.resumeTextarea = document.getElementById("resumeText");
    this.resumePreview = document.getElementById("resumePreview");
    this.resumeFileNameEl = document.getElementById("resumeFileName");
    this.resumePreviewText = document.getElementById("resumePreviewText");
    this.clearResumeBtn = document.getElementById("clearResume");

    // JD elements
    this.jdManualText = document.getElementById("jdManualText");

    // Score button
    this.scoreBtn = document.getElementById("scoreBtn");
    this.btnText = this.scoreBtn.querySelector(".btn-text");
    this.btnLoading = this.scoreBtn.querySelector(".btn-loading");

    // Results
    this.resultsSection = document.getElementById("resultsSection");
    this.resultsContent = document.getElementById("resultsContent");

    // Settings
    this.settingsBtn = document.getElementById("settingsBtn");
    this.settingsModal = document.getElementById("settingsModal");
    this.closeSettingsBtn = document.getElementById("closeSettings");
    this.saveSettingsBtn = document.getElementById("saveSettings");
    this.aiEnabledCheckbox = document.getElementById("aiEnabled");
    this.weightInputs = {
      keywords: document.getElementById("weightKeywords"),
      experience: document.getElementById("weightExperience"),
      skills: document.getElementById("weightSkills"),
      education: document.getElementById("weightEducation"),
    };

    // Toast
    this.toast = document.getElementById("toast");
  }

  bindEvents() {
    // Resume upload
    this.resumeUploadArea.addEventListener("click", () =>
      this.resumeFile.click(),
    );
    this.resumeUploadArea.addEventListener("dragover", (e) =>
      this.handleDragOver(e),
    );
    this.resumeUploadArea.addEventListener("dragleave", () =>
      this.resumeUploadArea.classList.remove("drag-over"),
    );
    this.resumeUploadArea.addEventListener("drop", (e) => this.handleDrop(e));
    this.resumeFile.addEventListener("change", (e) => this.handleFileSelect(e));
    this.resumeTextarea.addEventListener("input", () =>
      this.handleResumeTextInput(),
    );
    this.clearResumeBtn.addEventListener("click", () => this.clearResume());

    // Score
    this.scoreBtn.addEventListener("click", () => this.scoreResume());

    // Settings
    this.settingsBtn.addEventListener("click", () => this.openSettings());
    this.closeSettingsBtn.addEventListener("click", () => this.closeSettings());
    this.settingsModal.addEventListener("click", (e) => {
      if (e.target === this.settingsModal) this.closeSettings();
    });
    this.saveSettingsBtn.addEventListener("click", () => this.saveSettings());

    // Weight sliders
    Object.values(this.weightInputs).forEach((input) => {
      input.addEventListener("input", (e) =>
        this.updateWeightDisplay(e.target),
      );
    });

    // JD manual input
    this.jdManualText.addEventListener("input", (e) => this.handleJDTextInput(e));

    // Keyboard
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeSettings();
    });
  }

  async loadSettings() {
    this.settings = await Storage.getSettings();
    this.applySettings();
  }

  applySettings() {
    const weights = this.settings.weights || {
      keywords: 30,
      experience: 25,
      skills: 25,
      education: 20,
    };
    this.weightInputs.keywords.value = weights.keywords;
    this.weightInputs.experience.value = weights.experience;
    this.weightInputs.skills.value = weights.skills;
    this.weightInputs.education.value = weights.education;

    this.updateAllWeightDisplays();
    this.aiEnabledCheckbox.checked = this.settings.aiEnabled ?? false;
  }


  updateWeightDisplay(input) {
    const valueEl = input.parentElement.querySelector(".weight-value");
    if (valueEl) valueEl.textContent = `${input.value}%`;
  }

  updateAllWeightDisplays() {
    Object.values(this.weightInputs).forEach((input) =>
      this.updateWeightDisplay(input),
    );
  }

  async saveSettings() {
    const weights = {};
    Object.entries(this.weightInputs).forEach(([key, input]) => {
      weights[key] = parseInt(input.value);
    });

    // Normalize weights to sum to 100
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(weights).forEach((key) => {
        weights[key] = Math.round((weights[key] / total) * 100);
      });
    }

    this.settings = {
      weights,
      aiEnabled: this.aiEnabledCheckbox.checked,
    };

    await Storage.saveSettings(this.settings);
    this.showToast("Settings saved", "success");
    this.closeSettings();
  }

  openSettings() {
    this.settingsModal.classList.remove("hidden");
  }

  closeSettings() {
    this.settingsModal.classList.add("hidden");
    this.applySettings();
  }

  async loadResume() {
    const data = await Storage.getResume();
    if (data) {
      this.resumeText = data.text;
      this.resumeFileName = data.fileName;
      this.showResumePreview();
      this.updateScoreButtonState();
    }
  }

  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.resumeUploadArea.classList.add("drag-over");
  }

  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.resumeUploadArea.classList.remove("drag-over");

    const file = e.dataTransfer.files[0];
    if (file) this.processResumeFile(file);
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) this.processResumeFile(file);
    e.target.value = "";
  }

  async processResumeFile(file) {
    if (!file.type.includes("pdf") && !file.type.includes("wordprocessingml")) {
      this.showToast("Please upload a PDF or DOCX file", "error");
      return;
    }

    this.showToast("Parsing resume...", "info");

    try {
      const text = await ResumeParser.parseFile(file);
      if (!text || text.trim().length < 50) {
        throw new Error("Could not extract sufficient text from file");
      }

      this.resumeText = text;
      this.resumeFileName = file.name;
      await Storage.saveResume(text, file.name);
      this.showResumePreview();
      this.updateScoreButtonState();
      this.showToast("Resume loaded successfully", "success");
    } catch (error) {
      console.error("Resume parse error:", error);
      this.showToast(`Failed to parse resume: ${error.message}`, "error");
    }
  }

  handleResumeTextInput() {
    this.resumeText = this.resumeTextarea.value.trim();
    if (this.resumeText.length >= 50) {
      Storage.saveResume(this.resumeText, "pasted-text.txt");
      this.showResumePreview();
      this.updateScoreButtonState();
    }
  }

  showResumePreview() {
    this.resumeUploadArea.classList.add("hidden");
    this.resumeTextarea.classList.add("hidden");
    this.resumePreview.classList.remove("hidden");

    this.resumeFileNameEl.textContent = this.resumeFileName || "Pasted text";
    this.resumePreviewText.textContent =
      this.resumeText.slice(0, 500) +
      (this.resumeText.length > 500 ? "..." : "");
  }

  clearResume() {
    this.resumeText = "";
    this.resumeFileName = "";
    this.resumeTextarea.value = "";
    this.resumeUploadArea.classList.remove("hidden");
    this.resumeTextarea.classList.remove("hidden");
    this.resumePreview.classList.add("hidden");
    Storage.clearResume();
    this.updateScoreButtonState();
  }

  handleJDTextInput(e) {
    this.jdText = e.target.value.trim();
    if(this.jdText.length >= 50){
      this.updateScoreButtonState();
    }
   }

  updateScoreButtonState() {
    const hasResume = this.resumeText.length >= 50;
    const hasJD = this.jdText.length >= 50;
    this.scoreBtn.disabled = !(hasResume && hasJD) || this.isScoring;
  }

  async scoreResume() {
    if (this.isScoring || !this.resumeText || !this.jdText) return;

    this.isScoring = true;
    this.scoreBtn.disabled = true;
    this.btnText.classList.add("hidden");
    this.btnLoading.classList.remove("hidden");
    this.resultsSection.classList.add("hidden");

    try {
      this.showToast("Analyzing resume...", "info");
      const keywordResult = KeywordMatcher.analyze(
        this.resumeText,
        this.jdText,
        this.settings.weights,
      );
      const atsResult = ATSChecker.check(this.resumeText, this.jdText);

      if (this.settings.aiEnabled) {
        // Call AI API
        const cleanResume = this.resumeText.replace(/\s+/g, ' ').trim();
        const cleanJD = this.jdText.replace(/\s+/g, ' ').trim();
        const aiResult = await LLMAnalyzer.callAgentToReview(cleanResume, cleanJD, keywordResult);
        // Combine results
        const finalResult = this.combineResults(
          keywordResult,
          atsResult,
          aiResult
        );
        this.displayResults(finalResult);
      } else {
        // Combine results
        const finalResult = this.combineResults(
          keywordResult,
          atsResult
        );

        this.displayResults(finalResult);
      }
      this.showToast("Analysis complete!", "success");
    } catch (error) {
      console.error("Scoring error:", error);
      this.showToast(`Scoring failed: ${error.message}`, "error");
    } finally {
      this.isScoring = false;
      this.btnText.classList.remove("hidden");
      this.btnLoading.classList.add("hidden");
      this.updateScoreButtonState();
    }
  }

  combineResults(keywordResult, atsResult,aiResult = null) {
    const breakdown = {
      keywords: keywordResult.keywordScore ?? 0,
      experience: keywordResult.experienceScore ?? 0,
      skills: keywordResult.skillsScore ?? 0,
      education: keywordResult.educationScore ?? 0,
    };

    let overallScore = 0;
    const weights = this.settings.weights || {
      keywords: 30,
      experience: 25,
      skills: 25,
      education: 20,
    };
    overallScore =
      (breakdown.keywords * weights.keywords +
        breakdown.experience * weights.experience +
        breakdown.skills * weights.skills +
        breakdown.education * weights.education) /
      100;

    return {
      overallScore: Math.round(overallScore),
      breakdown,
      missingKeywords: keywordResult.missingKeywords ?? [],
      missingSkills: keywordResult.missingSkills ?? [],
      suggestions:  aiResult?.suggestions ??  keywordResult.suggestions ?? [],
      atsIssues: atsResult.issues ?? [],
      atsScore: atsResult.score ?? 0,
      analysis:  aiResult?.analysis ?? [],
      strengths:  aiResult?.strengths ?? [],
      redFlags: aiResult?.redFlags ?? [],
    };
  }

  displayResults(result) {
    this.resultsSection.classList.remove("hidden");
    this.resultsContent.innerHTML = this.renderReport(result);
    this.resultsSection.scrollIntoView({ behavior: "smooth" });
  }

  renderReport(result) {
    const scoreClass =
      result.overallScore >= 70
        ? "high"
        : result.overallScore >= 40
          ? "medium"
          : "low";

    return `
      <div class="report">
        <!-- Overall Score -->
        <div class="report-section">
          <div class="overall-score ${scoreClass}">
            <div class="score-circle">
              <span class="score-value">${result.overallScore}</span>
              <span class="score-label">Match</span>
            </div>
            <div class="score-details">
              <h3>${this.getScoreLabel(result.overallScore)}</h3>
              <p>${this.getScoreDescription(result.overallScore)}</p>
            </div>
          </div>
        </div>

        <!-- Analysis -->
        ${
          result.analysis
            ? `
        <div class="report-section">
          <h4 class="subsection-title">Analysis</h4>
          <p class="analysis-text">${this.escapeHtml(result.analysis)}</p>
        </div>
        `
            : ""
        }

        <!-- Strengths -->
        ${
          result.strengths && result.strengths.length > 0
            ? `
        <div class="report-section">
          <h4 class="subsection-title">Strengths</h4>
          <ul class="strengths-list">
            ${result.strengths.map((s) => `<li>${this.escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>
        `
            : ""
        }

        <!-- Red Flags -->
        ${
          result.redFlags && result.redFlags.length > 0
            ? `
        <div class="report-section">
          <h4 class="subsection-title">Areas for Improvement</h4>
          <ul class="red-flags-list">
            ${result.redFlags.map((r) => `<li>${this.escapeHtml(r)}</li>`).join("")}
          </ul>
        </div>
        `
            : ""
        }

        <!-- Breakdown -->
        <div class="report-section">
          <h4 class="subsection-title">Category Breakdown</h4>
          <div class="breakdown-grid">
            ${this.renderBreakdownItem("Keywords", result.breakdown.keywords, result.breakdown.keywords >= 70 ? "high" : result.breakdown.keywords >= 40 ? "medium" : "low")}
            ${this.renderBreakdownItem("Experience", result.breakdown.experience, result.breakdown.experience >= 70 ? "high" : result.breakdown.experience >= 40 ? "medium" : "low")}
            ${this.renderBreakdownItem("Skills", result.breakdown.skills, result.breakdown.skills >= 70 ? "high" : result.breakdown.skills >= 40 ? "medium" : "low")}
            ${this.renderBreakdownItem("Education", result.breakdown.education, result.breakdown.education >= 70 ? "high" : result.breakdown.education >= 40 ? "medium" : "low")}
          </div>
        </div>

        <!-- ATS Score -->
        <div class="report-section">
          <h4 class="subsection-title">ATS Compatibility</h4>
          <div class="ats-score ${result.atsScore >= 70 ? "high" : result.atsScore >= 40 ? "medium" : "low"}>
            <div class="ats-circle">
              <span class="ats-value">${result.atsScore}</span>
            </div>
            <div class="ats-issues">
              ${
                result.atsIssues.length > 0
                  ? result.atsIssues
                      .map(
                        (issue) =>
                          `<div class="ats-issue">${this.escapeHtml(issue)}</div>`,
                      )
                      .join("")
                  : '<div class="ats-issue success">No major ATS issues detected</div>'
              }
            </div>
          </div>
  

        <!-- Missing Keywords -->
        ${
          result.missingKeywords.length > 0
            ? `
        <div class="report-section">
          <h4 class="subsection-title">Missing Keywords</h4>
          <div class="keyword-tags">
            ${result.missingKeywords
              .slice(0, 15)
              .map(
                (kw) =>
                  `<span class="keyword-tag missing">${this.escapeHtml(kw)}</span>`,
              )
              .join("")}
            ${result.missingKeywords.length > 15 ? `<span class="keyword-tag more">+${result.missingKeywords.length - 15} more</span>` : ""}
          </div>
        </div>
        `
            : ""
        }

        <!-- Missing Skills -->
        ${
          result.missingSkills.length > 0
            ? `
        <div class="report-section">
          <h4 class="subsection-title">Missing Skills</h4>
          <div class="keyword-tags">
            ${result.missingSkills.map((sk) => `<span class="keyword-tag skill">${this.escapeHtml(sk)}</span>`).join("")}
          </div>
        </div>
        `
            : ""
        }

        <!-- Suggestions -->
        ${
          result.suggestions.length > 0
            ? `
        <div class="report-section">
          <h4 class="subsection-title">Improvement Suggestions</h4>
          <ul class="suggestions-list">
            ${result.suggestions.map((s) => `<li>${this.escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>
        `
            : ""
        }

      </div>
    `;
  }

  renderBreakdownItem(label, score, level) {
    return `
      <div class="breakdown-item">
        <div class="breakdown-header">
          <span class="breakdown-label">${label}</span>
          <span class="breakdown-score ${level}">${score}%</span>
        </div>
        <div class="breakdown-bar">
          <div class="breakdown-fill ${level}" style="width: ${score}%"></div>
        </div>
      </div>
    `;
  }

  getScoreLabel(score) {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Fair Match";
    return "Needs Improvement";
  }

  getScoreDescription(score) {
    if (score >= 80)
      return "Your resume aligns very well with this job description.";
    if (score >= 60)
      return "Your resume matches many requirements but could be tailored further.";
    if (score >= 40)
      return "Consider adding more relevant keywords and experience.";
    return "Significant gaps exist. Review missing keywords and suggestions below.";
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async exportReport() {
    const reportData = {
      date: new Date().toISOString(),
      resumeFile: this.resumeFileName,
      jdSource: this.jdSource,
      // We'd need to capture the current result - for now export as JSON
    };

    const df = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-score-${Date.now()}.json`;
    a.click();
    a;
    URL.revokeObjectURL(url);
    this.showToast("Report exported", "success");
  }

  showToast(message, type = "info") {
    this.toast.textContent = message;
    this.toast.className = `toast ${type} show`;
    setTimeout(() => this.toast.classList.remove("show"), 3000);
  }
}

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  new ResumeScorerPopup();
});