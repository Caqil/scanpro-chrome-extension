/**
 * ScanPro Chrome Extension - Protect PDF Tool
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
const pageCount = document.getElementById('pageCount');
const clearFileBtn = document.getElementById('clearFileBtn');
const userPassword = document.getElementById('userPassword');
const ownerPassword = document.getElementById('ownerPassword');
const toggleUserPassword = document.getElementById('toggleUserPassword');
const toggleOwnerPassword = document.getElementById('toggleOwnerPassword');
const userPasswordStrength = document.getElementById('userPasswordStrength');
const ownerPasswordStrength = document.getElementById('ownerPasswordStrength');
const userPasswordStrengthText = document.getElementById('userPasswordStrengthText');
const ownerPasswordStrengthText = document.getElementById('ownerPasswordStrengthText');
const allowPrinting = document.getElementById('allowPrinting');
const allowModifying = document.getElementById('allowModifying');
const allowCopying = document.getElementById('allowCopying');
const allowAnnotating = document.getElementById('allowAnnotating');
const allowFormFilling = document.getElementById('allowFormFilling');
const protectBtn = document.getElementById('protectBtn');
const protectProgress = document.getElementById('protectProgress');
const protectProgressFill = protectProgress.querySelector('.progress-fill');
const protectProgressText = protectProgress.querySelector('.progress-text');
const protectResult = document.getElementById('protectResult');
const protectResultCloseBtn = document.getElementById('protectResultCloseBtn');
const protectDownloadBtn = document.getElementById('protectDownloadBtn');
const resultFileNameText = document.getElementById('resultFileNameText');
const securityLevelText = document.getElementById('securityLevelText');

// State variables
let selectedFile = null;
let pdfPageCount = 0;
let protectResultUrl = null;
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
  protectBtn.addEventListener('click', protectPdf);
  protectResultCloseBtn.addEventListener('click', () => protectResult.classList.add('hidden'));
  protectDownloadBtn.addEventListener('click', downloadProtectedPdf);
  
  // Password visibility toggle
  toggleUserPassword.addEventListener('click', () => togglePasswordVisibility(userPassword, toggleUserPassword));
  toggleOwnerPassword.addEventListener('click', () => togglePasswordVisibility(ownerPassword, toggleOwnerPassword));
  
  // Password strength meter
  userPassword.addEventListener('input', () => updatePasswordStrength(userPassword, userPasswordStrength, userPasswordStrengthText));
  ownerPassword.addEventListener('input', () => updatePasswordStrength(ownerPassword, ownerPasswordStrength, ownerPasswordStrengthText));
  
  // Update protect button state when password changes
  userPassword.addEventListener('input', updateProtectButtonState);
  ownerPassword.addEventListener('input', updateProtectButtonState);
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

// Toggle password visibility
function togglePasswordVisibility(passwordInput, toggleBtn) {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    passwordInput.type = 'password';
    toggleBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

// Update password strength meter
function updatePasswordStrength(passwordInput, strengthMeter, strengthText) {
  const password = passwordInput.value;
  
  if (!password) {
    strengthMeter.style.width = '0%';
    strengthMeter.style.backgroundColor = '';
    strengthText.textContent = 'No password';
    return;
  }
  
  // Simple password strength calculation
  let strength = 0;
  let color = '';
  let label = '';
  
  // Length check
  if (password.length >= 8) {
    strength += 25;
  }
  
  // Contains lowercase letters
  if (/[a-z]/.test(password)) {
    strength += 25;
  }
  
  // Contains uppercase letters
  if (/[A-Z]/.test(password)) {
    strength += 25;
  }
  
  // Contains numbers or special characters
  if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strength += 25;
  }
  
  // Set color and label based on strength
  if (strength <= 25) {
    color = '#ef4444'; // red
    label = 'Weak';
  } else if (strength <= 50) {
    color = '#f59e0b'; // amber
    label = 'Fair';
  } else if (strength <= 75) {
    color = '#3b82f6'; // blue
    label = 'Good';
  } else {
    color = '#22c55e'; // green
    label = 'Strong';
  }
  
  // Update UI
  strengthMeter.style.width = `${strength}%`;
  strengthMeter.style.backgroundColor = color;
  strengthText.textContent = label;
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
  
  // Enable protect button if password is set
  updateProtectButtonState();
  
  // Get page count from PDF (mock implementation - would need PDF.js in a real app)
  getPdfPageCount(file)
    .then(count => {
      pdfPageCount = count;
      pageCount.textContent = `${count} pages`;
    })
    .catch(error => {
      console.error('Error getting page count:', error);
      pageCount.textContent = 'Unknown pages';
    });
  
  // Reset file input
  fileInput.value = '';
}

// Get page count from PDF file
async function getPdfPageCount(file) {
  try {
    // For demo purposes, this will be mocked
    // In a real implementation, you would use PDF.js to parse the PDF
    // and get the actual page count
    
    // Simulate API call to get page info
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock page count based on file size (just for demonstration)
        const pageEstimate = Math.max(1, Math.floor(file.size / 30000));
        resolve(pageEstimate);
      }, 500);
    });
  } catch (error) {
    console.error('Error getting PDF page count:', error);
    return 0;
  }
}

// Clear file
function clearFile() {
  filePreview.classList.add('hidden');
  selectedFile = null;
  pdfPageCount = 0;
  updateProtectButtonState();
}

// Update protect button state
function updateProtectButtonState() {
  const hasPassword = userPassword.value.trim().length > 0;
  protectBtn.disabled = !selectedFile || !hasPassword || isOperationInProgress;
}

// Protect PDF
async function protectPdf() {
  if (!selectedFile || isOperationInProgress) return;
  
  const userPass = userPassword.value.trim();
  if (!userPass) {
    alert('Please enter a user password.');
    userPassword.focus();
    return;
  }
  
  isOperationInProgress = true;
  updateProtectButtonState();
  
  try {
    // Show progress
    protectProgress.classList.remove('hidden');
    updateProgress(10);
    
    // Get permissions
    const permissions = {
      printing: allowPrinting.checked,
      modifying: allowModifying.checked,
      copying: allowCopying.checked,
      annotating: allowAnnotating.checked,
      formFilling: allowFormFilling.checked
    };
    
    // Call API to protect PDF
    const result = await ScanProAPI.protectPdf(
      selectedFile,
      userPass,
      permissions,
      ownerPassword.value.trim() || null
    );
    
    updateProgress(100);
    
    if (result.success) {
      // Store download URL
      protectResultUrl = result.fileUrl;
      
      // Update stats
      resultFileNameText.textContent = selectedFile.name;
      securityLevelText.textContent = getUserPasswordStrengthLabel();
      
      // Show result section
      protectResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error protecting PDF: ${error.message}`);
    protectProgress.classList.add('hidden');
  } finally {
    isOperationInProgress = false;
    updateProtectButtonState();
  }
}

// Get user password strength label
function getUserPasswordStrengthLabel() {
  const strengthText = userPasswordStrengthText.textContent;
  
  if (strengthText === 'Strong') {
    return 'High Security';
  } else if (strengthText === 'Good') {
    return 'Medium Security';
  } else {
    return 'Basic Security';
  }
}

// Download protected PDF
async function downloadProtectedPdf() {
  if (!protectResultUrl) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url: protectResultUrl,
      filename: `protected-${selectedFile.name}`
    });
    
    // Clear after successful download
    setTimeout(() => {
      clearFile();
      protectResult.classList.add('hidden');
      protectProgress.classList.add('hidden');
      protectResultUrl = null;
      
      // Clear passwords
      userPassword.value = '';
      ownerPassword.value = '';
      updatePasswordStrength(userPassword, userPasswordStrength, userPasswordStrengthText);
      updatePasswordStrength(ownerPassword, ownerPasswordStrength, ownerPasswordStrengthText);
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Update progress bar
function updateProgress(value) {
  protectProgressFill.style.width = `${value}%`;
  protectProgressText.textContent = `${Math.round(value)}%`;
}

// Close the tool window
function closeTool() {
  window.close();
}