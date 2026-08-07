# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Load Extension**: Since there's no build step, development involves editing files directly and reloading the extension in Chrome:
  1. Make changes to any file (HTML, CSS, JS)
  2. Go to `chrome://extensions/` in Chrome
  3. Ensure "Developer mode" is enabled
  4. Click the refresh icon on the Resume Scorer extension card
  5. Test changes by clicking the extension icon and using the popup

- **Debugging**:
  - Background service worker: Open `chrome://extensions/`, click "Service worker" link under the extension to inspect console
  - Popup: Right-click the extension icon → "Inspect popup" to open DevTools for the popup
  - Content scripts: Not used in this extension (features rely on popup and background)

- **Vendor Dependencies**: 
  - pdf.js and mammoth.js are vendored in `lib/vendor/` and loaded dynamically in `resume-parser.js`
  - To update vendors, replace files in `lib/vendor/` and ensure `loadPDFJS()`/`loadMammoth()` paths are correct

## Architecture Overview

### Core Components

1. **Manifest V3 Background Service Worker** (`background/background.js`):
   - Handles extension installation, settings defaults
   - Manages messaging between popup and background for settings persistence
   - Creates context menu items for job pages
   - Listens for keyboard shortcut (Ctrl+Shift+S) to open popup

2. **Popup UI** (`popup/`):
   - `popup.html`: Structure of the extension popup
   - `popup.css`: Styling
   - `popup.js`: Main application logic including:
     - Resume handling (upload, paste, parsing via `ResumeParser`)
     - Job description handling (manual paste only - auto-extraction from LinkedIn/Indeed/Glassdoor would require content scripts, which are not implemented)
     - Scoring orchestration: calls `KeywordMatcher`, `ATSChecker`, and optionally `LLMAnalyzer`
     - Results display and export
     - Settings management (LLM provider, API key, weights, history)

3. **Core Logic Modules** (`lib/`):
   - `storage.js`: Wrapper for `chrome.storage.local` with methods for resume, settings, history
   - `resume-parser.js`: 
     - Parses PDF using pdf.js (loaded from vendor)
     - Parses DOCX using mammoth.js (loaded from vendor)
     - Provides text cleaning and basic section extraction
   - `keyword-matcher.js`: 
     - Local scoring engine without API calls
     - Extracts keywords, skills (from taxonomy), experience requirements, education requirements from JD
     - Calculates match scores for keywords, skills, experience, education
     - Generates missing items, and generates suggestions
   - `llm-analyzer.js`: 
     - Optional AI enhancement using OpenAI (GPT-4o-mini) or Anthropic (Claude-3-Haiku)
     - Builds prompt from resume, JD, and local keyword results
     - Returns structured JSON with holistic score, analysis, suggestions, strengths, red flags
   - `ats-checker.js`: 
     - ATS compliance checking based on resume text heuristics
     - Checks sections, contact info, formatting (tables, columns, graphics), keyword density, achievements, date format, section order
     - Returns score (0-100) and list of issues

### Data Flow

1. User interacts with popup to upload/paste resume and manually paste JD
2. On "Score Resume":
   - Popup validates inputs
   - Calls `KeywordMatcher.analyze()` for local scoring
   - Calls `ATSChecker.check()` for ATS compliance
   - If LLM provider configured and API key present, calls `LLMAnalyzer.analyze()` for AI enhancement
   - Combines local and LLM results (weighted average: 60% local, 40% LLM)
   - Saves to history if enabled
   - Renders results report in popup

### Storage

- Uses `chrome.storage.local` for persistence:
  - `resume`: {text, fileName, timestamp} - last uploaded resume
  - `settings`: {llmProvider, apiKey, saveHistory, weights} - user preferences
  - `history`: array of past scoring results (limited to 50 entries)

### Key Implementation Notes

- **No Auto-JD Extraction**: Despite mentions in README, the extension currently only supports manual JD paste. Auto-extraction from job sites would require content scripts, which are not present in this version.
- **ES Modules**: All JS files use `import`/`export` and are loaded as modules in popup.html (`<script type="module">`)
- **Vendor Scripts**: pdf.js and mammoth.js are loaded dynamically when needed to avoid blocking initial load
- **Error Handling**: Graceful degradation - if LLM analysis fails, falls back to local scoring only
- **Security**: API keys stored only in Chrome storage and sent only to respective AI providers

### Common Tasks

- **Adding a new scoring factor**: 
  1. Update `keyword-matcher.js` to extract and score the factor
  2. Update weights interface in popup.html/settings
  3. Modify `combineResults()` in popup.js to include new factor
  4. Update default weights in background.js and storage.js

- **Modifying ATS checks**: 
  - Edit `ats-checker.js` methods to add/remove checks
  - Update scoring logic in the `check()` method

- **Changing LLM provider/model**: 
  - Update `llm-analyzer.js` constructor and API calls
  - Update provider options in popup.html settings

- **Styling changes**: 
  - Edit `popup.css` or `styles/report.css` (imported in popup.html)
