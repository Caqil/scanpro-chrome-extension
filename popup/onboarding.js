/**
 * ScanPro Chrome Extension Onboarding Script
 */

import ScanProAPI from '../lib/api.js';
import Utils from '../lib/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const toggleApiKeyVisibility = document.getElementById('toggleApiKeyVisibility');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const exploreExtensionBtn = document.getElementById('exploreExtensionBtn');
  const readDocsBtn = document.getElementById('readDocsBtn');

  // Toggle API key visibility
  toggleApiKeyVisibility.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyVisibility.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyVisibility.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    }
  });

  // Save API key
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

    saveApiKeyBtn.disabled = true;
    saveApiKeyBtn.classList.add('opacity-50');
    saveApiKeyBtn.textContent = 'Validating...';

    try {
      // Validate and save API key
      await ScanProAPI.validateApiKey(apiKey);
      await chrome.storage.sync.set({ apiKey });
      
      // Show success message
      saveApiKeyBtn.textContent = 'Success!';
      saveApiKeyBtn.classList.remove('bg-primary');
      saveApiKeyBtn.classList.add('bg-green-600');
      
      // Redirect to main extension page after a delay
      setTimeout(() => {
        window.location.href = 'popup.html';
      }, 1500);
    } catch (error) {
      alert(`Error: ${error.message || 'Failed to validate API key'}`);
      saveApiKeyBtn.disabled = false;
      saveApiKeyBtn.classList.remove('opacity-50');
      saveApiKeyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save API Key';
    }
  });

  // Handle Explore Extension button
  exploreExtensionBtn.addEventListener('click', () => {
    window.location.href = 'popup.html';
  });

  // Handle Read Documentation button
  readDocsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://scanpro.cc/developer-api' });
  });
});