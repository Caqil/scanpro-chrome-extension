/**
 * ScanPro Chrome Extension - Unlock PDF Tool
 */

import ScanProAPI from '../lib/api.js';
import Utils from '../lib/utils.js';

// DOM Elements
const closeBtn = document.getElementById('closeBtn');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const securityStatus = document.getElementById('securityStatus');
const clearFileBtn = document.getElementById('clearFileBtn');
const passwordSection = document.getElementById('passwordSection');
const pdfPassword = document.getElementById('pdfPassword');
const togglePasswordVisibility = document.getElementById('togglePasswordVisibility');
const unlockBtn = document.getElementById('unlockBtn');
const unlockProgress = document.getElementById('unlockProgress');
const unlockProgressFill = unlockProgress.querySelector('.progress-fill');
const unlockProgressText = unlockProgress.querySelector('.progress-text');
const unlockResult = document.getElementById('unlockResult');
const unlockResultCloseBtn = document.getElementById('unlockResultCloseBtn');
const unlockDownloadBtn = document.getElementById('unlockDownloadBtn');
const resultFileNameText = document.getElementById('resultFileNameText');
const unlockStatusText = document.getElementById('unlockStatusText');

// State variables
let selectedFile = null;
let isPasswordProtected = false;
let unlockResultUrl = null;
let isOperationInProgress = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
});

// Set up event listeners
function setupEventListeners() {
  closeBtn.addEventListener('click', closeTool);
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelection);
  clearFileBtn.addEventListener('click', clearFile);
  unlockBtn.addEventListener('click', unlockPdf);
  unlockResultCloseBtn.addEventListener('click', () => unlockResult.classList.add('hidden'));
  unlockDownloadBtn.addEventListener('click', downloadUnlockedPdf);
  
  // Password visibility toggle
  togglePasswordVisibility.addEventListener('click', () => {
    if (pdfPassword.type === 'password') {
      pdfPassword.type = 'text';
      togglePasswordVisibility.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      pdfPassword.type = 'password';
      togglePasswordVisibility.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  });
  
  // Update unlock button state when password changes
  pdfPassword.addEventListener('input', updateUnlockButtonState);
}

// Set up drag and drop
function setupDragAndDrop() {
  // Highlight drop area when dragging over
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('active');
  });
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('active');
  });
  
  // Handle dropped files
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('active');
    
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
}

// Handle file selection from input
function handleFileSelection(e) {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
}

// Process selected file
function handleFile(file) {
  if (!file) return;
  
  // Check if file is PDF
  if (!Utils.isPdfFile(file)) {
    alert('Please select a PDF file.');
    fileInput.value = '';
    return;
  }
  
  // Set selected file
  selectedFile = file;
  
  // Update UI
  fileName.textContent = file.name;
  fileSize.textContent = Utils.formatFileSize(file.size);
  filePreview.classList.remove('hidden');
  
  // Check if PDF is password protected
  checkPdfSecurity(file)
    .then(isProtected => {
      isPasswordProtected = isProtected;
      
      if (isProtected) {
        securityStatus.classList.remove('hidden');
        passwordSection.classList.remove('hidden');
        pdfPassword.focus();
      } else {
        securityStatus.classList.add('hidden');
        passwordSection.classList.add('hidden');
        alert('This PDF is not password protected.');
      }
      
      updateUnlockButtonState();
    })
    .catch(error => {
      console.error('Error checking PDF security:', error);
      alert('Error checking PDF security. Please try another file.');
      clearFile();
    });
  
  // Reset file input
  fileInput.value = '';
}

// Check if PDF is password protected
async function checkPdfSecurity(file) {
  try {
    // For demo purposes, we'll assume all PDFs are password protected
    // In a real implementation, you would check the PDF's encryption status
    
    // Simulate API call to check security
    return new Promise(resolve => {
      setTimeout(() => {
        // Just for demonstration - assume all files are protected
        // In a real app, you would parse the PDF headers to check encryption
        resolve(true);
      }, 500);
    });
  } catch (error) {
    console.error('Error checking PDF security:', error);
    throw error;
  }
}

// Clear file
function clearFile() {
  filePreview.classList.add('hidden');
  passwordSection.classList.add('hidden');
  pdfPassword.value = '';
  selectedFile = null;
  isPasswordProtected = false;
  updateUnlockButtonState();
}

// Update unlock button state
function updateUnlockButtonState() {
  const hasPassword = pdfPassword.value.trim().length > 0;
  unlockBtn.disabled = !selectedFile || !isPasswordProtected || !hasPassword || isOperationInProgress;
}

// Unlock PDF
async function unlockPdf() {
  if (!selectedFile || !isPasswordProtected || isOperationInProgress) return;
  
  const password = pdfPassword.value.trim();
  if (!password) {
    alert('Please enter the PDF password.');
    pdfPassword.focus();
    return;
  }
  
  isOperationInProgress = true;
  updateUnlockButtonState();
  
  try {
    // Show progress
    unlockProgress.classList.remove('hidden');
    updateProgress(10);
    
    // Call API to unlock PDF
    const result = await ScanProAPI.unlockPdf(selectedFile, password);
    
    updateProgress(100);
    
    if (result.success) {
      // Store download URL
      unlockResultUrl = result.fileUrl;
      
      // Update stats
      resultFileNameText.textContent = selectedFile.name;
      unlockStatusText.textContent = 'Successfully Unlocked';
      
      // Show result section
      unlockResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Incorrect password or unknown error');
    }
  } catch (error) {
    alert(`Error unlocking PDF: ${error.message}`);
    unlockProgress.classList.add('hidden');
  } finally {
    isOperationInProgress = false;
    updateUnlockButtonState();
  }
}

// Download unlocked PDF
async function downloadUnlockedPdf() {
  if (!unlockResultUrl) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url: unlockResultUrl,
      filename: `unlocked-${selectedFile.name}`
    });
    
    // Clear after successful download
    setTimeout(() => {
      clearFile();
      unlockResult.classList.add('hidden');
      unlockProgress.classList.add('hidden');
      unlockResultUrl = null;
      pdfPassword.value = '';
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Update progress bar
function updateProgress(value) {
  unlockProgressFill.style.width = `${value}%`;
  unlockProgressText.textContent = `${Math.round(value)}%`;
}

// Close the tool window
function closeTool() {
  window.close();
}