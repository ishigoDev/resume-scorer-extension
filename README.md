# Resume Scorer Chrome Extension

A Chrome extension that scores your resume against job descriptions with hybrid analysis (local keyword matching + optional AI enhancement).

## Features

- **Resume Upload**: Upload PDF or DOCX, or paste text directly
- **Auto JD Extraction**: Automatically extracts job descriptions from LinkedIn, Indeed, Glassdoor
- **Hybrid Scoring**:
  - Local keyword/skills matching (fast, offline)
  - Optional AI analysis via OpenAI or Anthropic API
  - ATS compatibility checking
- **Full Report**: Overall score, category breakdown, missing keywords, suggestions, ATS issues

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the `resume-scorer-extension` folder
5. Pin the extension to your toolbar

## Usage

1. Click the extension icon
2. **Upload your resume** (PDF/DOCX) or paste text
3. **Navigate to a job posting** on LinkedIn, Indeed, or Glassdoor
4. The extension will auto-extract the job description
5. Click **"Score Resume"** to get your analysis report

## Settings

Click the gear icon to configure:
- **LLM Provider**: OpenAI (GPT-4o-mini), Anthropic (Claude-3-Haiku), or Local Only
- **API Key**: Your API key for AI-enhanced analysis
- **Scoring Weights**: Adjust importance of keywords, experience, skills, education
- **Auto-extract JD**: Toggle automatic job description extraction
- **Save History**: Keep history of scored jobs

## Scoring Breakdown

| Category | Weight (default) | What it measures |
|----------|-----------------|------------------|
| Keywords | 30% | General keyword overlap with JD |
| Experience | 25% | Years of experience vs requirements |
| Skills | 25% | Technical skills match |
| Education | 20% | Degree level match |

## ATS Compatibility Checks

- Section completeness (summary, experience, education, skills)
- Contact information presence
- Keyword density
- Quantified achievements
- Date format consistency
- Standard section ordering

## Privacy

- All data stored locally in Chrome storage
- Resume text never leaves your browser (unless using AI analysis)
- API keys stored locally, only sent to respective providers

## Tech Stack

- Manifest V3 Chrome Extension
- Vanilla JavaScript (ES Modules)
- pdf.js for PDF parsing
- mammoth.js for DOCX parsing
- Chrome Storage API for persistence

## Development

No build step required. Edit files directly and reload extension.

## License

MIT