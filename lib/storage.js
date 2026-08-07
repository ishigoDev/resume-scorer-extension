// Resume Scorer - Storage Utilities

export class Storage {
  static async getResume() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['resume'], (result) => {
        resolve(result.resume || null);
      });
    });
  }

  static async saveResume(text, fileName) {
    return new Promise((resolve) => {
      chrome.storage.local.set({
        resume: { text, fileName, timestamp: Date.now() }
      }, resolve);
    });
  }

  static async clearResume() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('resume', resolve);
    });
  }

  static async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings || {
          weights: { keywords: 30, experience: 25, skills: 25, education: 20 },
          aiEnabled: false
        });
      });
    });
  }

  static async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings }, resolve);
    });
  }

  static async getHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        resolve(result.history || []);
      });
    });
  }

  static async addHistory(entry) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['history'], (result) => {
        const history = result.history || [];
        history.unshift(entry);
        // Keep last 50 entries
        if (history.length > 50) history.pop();
        chrome.storage.local.set({ history }, resolve);
      });
    });
  }

  static async clearHistory() {
    return new Promise((resolve) => {
      chrome.storage.local.remove('history', resolve);
    });
  }

  static async getAllData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  }

  static async clearAllData() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }
}