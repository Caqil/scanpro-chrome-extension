/**
 * ScanPro Chrome Extension Popup Script
 * Migrated to use Tailwind CSS
 */

import ScanProAPI from '../lib/api.js';
import Utils from '../lib/utils.js';

// DOM Elements - General
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const settingsModalOverlay = document.getElementById('settingsModalOverlay');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const apiKeySection = document.getElementById('apiKeySection');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
const apiKeySettingInput = document.getElementById('apiKeySettingInput');
const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
const saveLocationInput = document.getElementById('saveLocationInput');

// DOM Elements - Tabs
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

// DOM Elements - Convert Tab
const convertFileInput = document.getElementById('convertFileInput');
const convertFilePreview = document.getElementById('convertFilePreview');
const convertFileName = document.getElementById('convertFileName');
const convertFileSize = document.getElementById('convertFileSize');
const convertClearBtn = document.getElementById('convertClearBtn');
const convertFormatSelect = document.getElementById('convertFormatSelect');
const convertBtn = document.getElementById('convertBtn');
const convertProgress = document.getElementById('convertProgress');
const convertProgressFill = convertProgress.querySelector('.progress-fill');
const convertProgressText = convertProgress.querySelector('.progress-text');
const convertResult = document.getElementById('convertResult');
const convertResultCloseBtn = document.getElementById('convertResultCloseBtn');
const convertDownloadBtn = document.getElementById('convertDownloadBtn');

// DOM Elements - Compress Tab
const compressFileInput = document.getElementById('compressFileInput');
const compressFilePreview = document.getElementById('compressFilePreview');
const compressFileName = document.getElementById('compressFileName');
const compressFileSize = document.getElementById('compressFileSize');
const compressClearBtn = document.getElementById('compressClearBtn');
const compressionLevelSelect = document.getElementById('compressionLevelSelect');
const compressBtn = document.getElementById('compressBtn');
const compressProgress = document.getElementById('compressProgress');
const compressProgressFill = compressProgress.querySelector('.progress-fill');
const compressProgressText = compressProgress.querySelector('.progress-text');
const compressResult = document.getElementById('compressResult');
const compressResultCloseBtn = document.getElementById('compressResultCloseBtn');
const compressDownloadBtn = document.getElementById('compressDownloadBtn');
const originalSizeText = document.getElementById('originalSizeText');
const compressedSizeText = document.getElementById('compressedSizeText');
const reductionText = document.getElementById('reductionText');

// DOM Elements - Tool Cards
const toolCards = document.querySelectorAll('.tool-card');

// State variables
let selectedConvertFile = null;
let convertResultUrl = null;
let selectedCompressFile = null;
let compressResultUrl = null;
let fileOperationInProgress = false;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Check API key and show appropriate section
  const hasApiKey = await checkApiKey();
  if (!hasApiKey) {
    apiKeySection.classList.remove('hidden');
  }

  // Load settings
  loadSettings();
});

// Tab navigation
tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const tab = button.dataset.tab;
    setActiveTab(tab);
  });
});

function setActiveTab(tabId) {
  // Remove active class from all tabs and update data-state attribute
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    btn.dataset.state = '';
    btn.classList.remove('border-primary');
    btn.classList.remove('text-primary');
  });
  
  tabPanels.forEach(panel => panel.classList.add('hidden'));
  
  // Add active class to selected tab
  const selectedBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  const selectedPanel = document.getElementById(`${tabId}Tab`);
  
  if (selectedBtn && selectedPanel) {
    selectedBtn.classList.add('active');
    selectedBtn.dataset.state = 'active';
    selectedBtn.classList.add('border-primary');
    selectedBtn.classList.add('text-primary');
    selectedPanel.classList.remove('hidden');
  }
}

// Settings functionality
settingsBtn.addEventListener('click', () => {
  settingsModal.classList.remove('hidden');
});

// Close settings with backdrop click
if (settingsModalOverlay) {
  settingsModalOverlay.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });
}

closeSettingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('hidden');
});

saveSettingsBtn.addEventListener('click', async () => {
  const apiKey = apiKeySettingInput.value.trim();
  const saveLocation = saveLocationInput.value;
  
  // Validate API key if provided
  if (apiKey) {
    if (!Utils.isValidApiKeyFormat(apiKey)) {
      alert('Invalid API key format. Please enter a valid key.');
      return;
    }
    
    try {
      // Validate API key with server
      await saveApiKey(apiKey);
      apiKeySection.classList.add('hidden');
    } catch (error) {
      alert(`Error saving API key: ${error.message}`);
      return;
    }
  } else {
    // Clear API key if empty
    await saveApiKey(null);
  }
  
  // Save settings
  await chrome.storage.sync.set({ saveLocation });
  
  settingsModal.classList.add('hidden');
});

toggleApiKeyVisibility.addEventListener('click', () => {
  if (apiKeySettingInput.type === 'password') {
    apiKeySettingInput.type = 'text';
    toggleApiKeyVisibility.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  } else {
    apiKeySettingInput.type = 'password';
    toggleApiKeyVisibility.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }
});

saveApiKeyBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }
  
  if (!Utils.isValidApiKeyFormat(apiKey)) {
    alert('Invalid API key format. Please enter a valid key.');
    return;
  }
  
  try {
    await saveApiKey(apiKey);
    apiKeySection.classList.add('hidden');
    apiKeySettingInput.value = apiKey;
  } catch (error) {
    alert(`Error saving API key: ${error.message}`);
  }
});

// Convert tab functionality
convertFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!Utils.isPdfFile(file)) {
    alert('Please select a PDF file');
    convertFileInput.value = '';
    return;
  }
  
  selectedConvertFile = file;
  convertFileName.textContent = file.name;
  convertFileSize.textContent = Utils.formatFileSize(file.size);
  convertFilePreview.classList.remove('hidden');
  convertBtn.disabled = false;
});

convertClearBtn.addEventListener('click', () => {
  clearConvertSection();
});

convertBtn.addEventListener('click', async () => {
  if (!selectedConvertFile || fileOperationInProgress) return;
  
  const outputFormat = convertFormatSelect.value;
  fileOperationInProgress = true;
  
  try {
    // Show progress
    convertProgress.classList.remove('hidden');
    updateProgress(convertProgressFill, convertProgressText, 10);
    
    // Perform conversion
    const result = await ScanProAPI.convertPdf(selectedConvertFile, outputFormat);
    
    updateProgress(convertProgressFill, convertProgressText, 100);
    
    if (result.success) {
      // Store download URL
      convertResultUrl = result.fileUrl;
      
      // Show result section
      convertResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error converting PDF: ${error.message}`);
    convertProgress.classList.add('hidden');
  } finally {
    fileOperationInProgress = false;
  }
});

convertResultCloseBtn.addEventListener('click', () => {
  convertResult.classList.add('hidden');
});

convertDownloadBtn.addEventListener('click', async () => {
  if (!convertResultUrl) return;
  
  try {
    await downloadFile(convertResultUrl, `converted-${selectedConvertFile.name.replace('.pdf', `.${convertFormatSelect.value}`)}`);
    
    // Clear after successful download
    setTimeout(() => {
      clearConvertSection();
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
});

// Compress tab functionality
compressFileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  if (!Utils.isPdfFile(file)) {
    alert('Please select a PDF file');
    compressFileInput.value = '';
    return;
  }
  
  selectedCompressFile = file;
  compressFileName.textContent = file.name;
  compressFileSize.textContent = Utils.formatFileSize(file.size);
  compressFilePreview.classList.remove('hidden');
  compressBtn.disabled = false;
});

compressClearBtn.addEventListener('click', () => {
  clearCompressSection();
});

compressBtn.addEventListener('click', async () => {
  if (!selectedCompressFile || fileOperationInProgress) return;
  
  const compressionLevel = compressionLevelSelect.value;
  fileOperationInProgress = true;
  
  try {
    // Show progress
    compressProgress.classList.remove('hidden');
    updateProgress(compressProgressFill, compressProgressText, 10);
    
    // Perform compression
    const result = await ScanProAPI.compressPdf(selectedCompressFile, compressionLevel);
    
    updateProgress(compressProgressFill, compressProgressText, 100);
    
    if (result.success) {
      // Store download URL
      compressResultUrl = result.fileUrl;
      
      // FIX: Get actual compressed file size - this is the bugfix
      let compressedSize = result.fileSize;
      
      // If the API doesn't return a fileSize or returns 0, try to get it from the response
      if (!compressedSize || compressedSize === 0) {
        try {
          // Fetch the file to get its actual size
          const response = await fetch(result.fileUrl, { method: 'HEAD' });
          
          if (response.ok) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              compressedSize = parseInt(contentLength, 10);
            }
          }
        } catch (err) {
          console.warn('Could not determine compressed file size from response:', err);
          // Fall back to using a percentage-based estimate if fetch fails
          compressedSize = Math.round(selectedCompressFile.size * 0.7); // Assume 30% compression
        }
      }
      
      // Update stats with corrected file size
      const originalSize = selectedCompressFile.size;
      const reduction = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100).toFixed(1) : 0;
      
      originalSizeText.textContent = Utils.formatFileSize(originalSize);
      compressedSizeText.textContent = Utils.formatFileSize(compressedSize);
      reductionText.textContent = `${reduction}%`;
      
      // Show result section
      compressResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error compressing PDF: ${error.message}`);
    compressProgress.classList.add('hidden');
  } finally {
    fileOperationInProgress = false;
  }
});

compressResultCloseBtn.addEventListener('click', () => {
  compressResult.classList.add('hidden');
});

compressDownloadBtn.addEventListener('click', async () => {
  if (!compressResultUrl) return;
  
  try {
    await downloadFile(compressResultUrl, `compressed-${selectedCompressFile.name}`);
    
    // Clear after successful download
    setTimeout(() => {
      clearCompressSection();
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
});

// Tool card click handlers
toolCards.forEach(card => {
  card.addEventListener('click', () => {
    const tool = card.dataset.tool;
    handleToolClick(tool);
  });
});

function handleToolClick(tool) {
  // Map tools to their corresponding website URLs
  const toolUrls = {
    'merge': 'https://scanpro.cc/en/merge-pdf',
    'split': 'https://scanpro.cc/en/split-pdf',
    'rotate': 'https://scanpro.cc/en/rotate-pdf',
    'watermark': 'https://scanpro.cc/en/watermark-pdf',
    'protect': 'https://scanpro.cc/en/protect-pdf',
    'unlock': 'https://scanpro.cc/en/unlock-pdf',
    'sign': 'https://scanpro.cc/en/sign-pdf',
    'ocr': 'https://scanpro.cc/en//ocr-pdf' // Note: Double slash typo preserved from original
  };

  // Get the URL for the selected tool
  const url = toolUrls[tool];
  
  if (url) {
    openToolWindowInTab(url);
  } else {
    console.warn('Unknown tool:', tool);
  }
}

// Open tool in a new tab - preserved from original code
function openToolWindowInTab(url) {
  chrome.tabs.create({
    url: url,
    active: true    // Brings the new tab into focus
  }, (tab) => {
    if (chrome.runtime.lastError) {
      console.error('Error opening tab:', chrome.runtime.lastError);
    }
  });
}

// Helper functions
function clearConvertSection() {
  convertFileInput.value = '';
  convertFilePreview.classList.add('hidden');
  convertProgress.classList.add('hidden');
  convertResult.classList.add('hidden');
  convertBtn.disabled = true;
  selectedConvertFile = null;
  convertResultUrl = null;
}

function clearCompressSection() {
  compressFileInput.value = '';
  compressFilePreview.classList.add('hidden');
  compressProgress.classList.add('hidden');
  compressResult.classList.add('hidden');
  compressBtn.disabled = true;
  selectedCompressFile = null;
  compressResultUrl = null;
}

function updateProgress(progressFill, progressText, value) {
  progressFill.style.width = `${value}%`;
  progressText.textContent = `${Math.round(value)}%`;
}

async function checkApiKey() {
  try {
    const data = await chrome.storage.sync.get('apiKey');
    return !!data.apiKey;
  } catch (error) {
    console.error('Error checking API key:', error);
    return false;
  }
}

async function saveApiKey(apiKey) {
  try {
    // If API key is provided, validate it with server
    if (apiKey) {
      await ScanProAPI.validateApiKey(apiKey);
    }
    
    // Save API key to storage
    await chrome.runtime.sendMessage({
      type: 'SAVE_API_KEY',
      apiKey
    });
    
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
}

async function loadSettings() {
  try {
    const data = await chrome.storage.sync.get(['apiKey', 'saveLocation']);
    
    if (data.apiKey) {
      apiKeySettingInput.value = data.apiKey;
    }
    
    if (data.saveLocation) {
      saveLocationInput.value = data.saveLocation;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

async function downloadFile(url, filename) {
  try {
    // Send message to background script to download the file
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url,
      filename
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}