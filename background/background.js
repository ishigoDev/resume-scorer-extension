// Resume Scorer - Background Service Worker

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      settings: {
        weights: { keywords: 30, experience: 25, skills: 25, education: 20 },
        aiEnabled: false
      }
    });
    console.log('Resume Scorer installed');
  }
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getSettings':
      getSettings().then(sendResponse);
      return true;

    case 'saveSettings':
      saveSettings(message.settings).then(sendResponse);
      return true;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});


async function getSettings() {
  const data = await chrome.storage.local.get('settings');
  return data.settings || {};
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
  return { success: true };
}

// Context menu for quick scoring (optional)
chrome.contextMenus.create({
  id: 'scoreResume',
  title: 'Score with Resume Scorer',
  contexts: ['page'],
  documentUrlPatterns: [
    '*://*.linkedin.com/jobs/*',
    '*://*.indeed.com/viewjob*',
    '*://*.indeed.com/job/*',
    '*://*.glassdoor.com/Job/*'
  ]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'scoreResume' && tab?.id) {
    chrome.action.openPopup();
  }
});

// Keyboard shortcut handling
chrome.commands.onCommand.addListener((command) => {
  if (command === 'score-resume') {
    chrome.action.openPopup();
  }
});