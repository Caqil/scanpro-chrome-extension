/**
 * Background Script for ScanPro Chrome Extension
 * Handles events, messaging, and background tasks
 */

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Process different message types
  switch (message.type) {
    case 'DOWNLOAD_FILE':
      handleFileDownload(message.url, message.filename)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Indicates async response
      
    case 'SAVE_API_KEY':
      saveApiKey(message.apiKey)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Indicates async response
      
    case 'CHECK_API_KEY':
      checkApiKey()
        .then(hasKey => sendResponse({ hasKey }))
        .catch(error => sendResponse({ hasKey: false, error: error.message }));
      return true; // Indicates async response
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
});

// Handle file downloads
async function handleFileDownload(url, filename) {
  try {
    // Ensure URL is valid and absolute
    const validUrl = ensureValidUrl(url);
    
    // Create a download using Chrome's download API
    chrome.downloads.download({
      url: validUrl,
      filename: filename,
      saveAs: true
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

// Ensure URL is valid and absolute
function ensureValidUrl(url) {
  if (!url) {
    throw new Error('Invalid URL: URL is empty');
  }
  
  try {
    // Try to create a URL object to validate
    const urlObj = new URL(url);
    return urlObj.href; // Return normalized URL
  } catch (error) {
    // If URL is relative, prepend the base API URL
    if (url.startsWith('/')) {
      return `https://scanpro.cc${url}`;
    } else {
      // If it doesn't start with http:// or https://, add https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
      }
    }
    
    // If we couldn't fix it, throw an error
    throw new Error(`Invalid URL: ${url}`);
  }
}

// Save API key to Chrome's storage
async function saveApiKey(apiKey) {
  if (!apiKey) {
    await chrome.storage.sync.remove('apiKey');
    return;
  }
  
  await chrome.storage.sync.set({ apiKey });
}

// Check if API key exists
async function checkApiKey() {
  const data = await chrome.storage.sync.get('apiKey');
  return !!data.apiKey;
}

// Initialize extension when installed or updated
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // First time installation
    console.log('ScanPro extension installed');
    
    // Open onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup/onboarding.html')
    });
  } else if (details.reason === 'update') {
    // Extension update
    console.log('ScanPro extension updated to version ' + chrome.runtime.getManifest().version);
  }
});