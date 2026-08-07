// Resume Scorer - Resume Parser (PDF & DOCX)

export class ResumeParser {
  static async parseFile(file) {
    const type = file.type;
    const arrayBuffer = await file.arrayBuffer();

    if (type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      return this.parsePDF(arrayBuffer);
    } else if (
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      return this.parseDOCX(arrayBuffer);
    } else {
      throw new Error('Unsupported file type. Please upload PDF or DOCX.');
    }
  }

  static async parsePDF(arrayBuffer) {
    try {
      // Load PDF.js from CDN
      if (typeof pdfjsLib === 'undefined') {
        await this.loadPDFJS();
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return this.cleanText(fullText);
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF. Ensure it\'s not password-protected or scanned.');
    }
  }

  static async parseDOCX(arrayBuffer) {
    try {
      // Load mammoth.js from CDN
      if (typeof mammoth === 'undefined') {
        await this.loadMammoth();
      }

      const result = await mammoth.extractRawText({ arrayBuffer });
      return this.cleanText(result.value);
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file.');
    }
  }

  static getExtensionURL(path) {
    return chrome.runtime.getURL(path);
  }

  static loadPDFJS() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = this.getExtensionURL('lib/vendor/pdf.worker.min.mjs');
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = this.getExtensionURL('lib/vendor/pdf.mjs');
      script.onload = () => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = this.getExtensionURL('lib/vendor/pdf.worker.min.mjs');
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  }

  static loadMammoth() {
    return new Promise((resolve, reject) => {
      if (typeof mammoth !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.getExtensionURL('lib/vendor/mammoth.browser.min.js');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load mammoth.js'));
      document.head.appendChild(script);
    });
  }

  static cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ /g, ' ')
      .trim();
  }

  static extractSections(text) {
    const sections = {
      summary: '',
      experience: '',
      education: '',
      skills: '',
      projects: '',
      certifications: '',
      other: ''
    };

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let currentSection = 'other';

    const sectionKeywords = {
      summary: ['summary', 'profile', 'objective', 'about'],
      experience: ['experience', 'employment', 'work history', 'career', 'professional experience'],
      education: ['education', 'academic', 'degree', 'university', 'college'],
      skills: ['skills', 'technologies', 'tech stack', 'competencies', 'expertise', 'tools'],
      projects: ['projects', 'portfolio', 'personal projects'],
      certifications: ['certification', 'certificates', 'licenses', 'credentials']
    };

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      // Check if this line is a section header
      let foundSection = null;
      for (const [section, keywords] of Object.entries(sectionKeywords)) {
        if (keywords.some(k => lowerLine.includes(k)) && line.length < 50) {
          // Likely a header if short and contains keyword
          foundSection = section;
          break;
        }
      }

      if (foundSection) {
        currentSection = foundSection;
      } else {
        sections[currentSection] += line + '\n';
      }
    }

    return sections;
  }
}