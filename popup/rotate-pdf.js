/**
 * ScanPro Chrome Extension - Rotate PDF Tool
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
const rotationTypeRadios = document.getElementsByName('rotationType');
const pageRangesSection = document.getElementById('pageRangesSection');
const pageRangesInput = document.getElementById('pageRangesInput');
const rotationButtons = document.querySelectorAll('.rotation-button');
const rotateBtn = document.getElementById('rotateBtn');
const rotateProgress = document.getElementById('rotateProgress');
const rotateProgressFill = rotateProgress.querySelector('.progress-fill');
const rotateProgressText = rotateProgress.querySelector('.progress-text');
const rotateResult = document.getElementById('rotateResult');
const rotateResultCloseBtn = document.getElementById('rotateResultCloseBtn');
const rotateDownloadBtn = document.getElementById('rotateDownloadBtn');
const resultFileNameText = document.getElementById('resultFileNameText');
const pagesRotatedText = document.getElementById('pagesRotatedText');

// State variables
let selectedFile = null;
let pdfPageCount = 0;
let rotationAngle = 90; // Default rotation angle (90 degrees clockwise)
let rotateResultUrl = null;
let isOperationInProgress = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
  updatePageRangesVisibility();
});

// Set up event listeners
function setupEventListeners() {
  closeBtn.addEventListener('click', closeTool);
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelection);
  clearFileBtn.addEventListener('click', clearFile);
  rotateBtn.addEventListener('click', rotatePdf);
  rotateResultCloseBtn.addEventListener('click', () => rotateResult.classList.add('hidden'));
  rotateDownloadBtn.addEventListener('click', downloadRotatedPdf);
  
  // Rotation type change
  rotationTypeRadios.forEach(radio => {
    radio.addEventListener('change', updatePageRangesVisibility);
  });
  
  // Rotation angle buttons
  rotationButtons.forEach(button => {
    button.addEventListener('click', () => {
      rotationButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      rotationAngle = parseInt(button.dataset.angle, 10);
    });
  });
  
  // Set default active rotation button
  rotationButtons[0].classList.add('active');
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

// Update page ranges section visibility
function updatePageRangesVisibility() {
  const selectedType = document.querySelector('input[name="rotationType"]:checked').value;
  
  if (selectedType === 'selected') {
    pageRangesSection.style.display = 'block';
  } else {
    pageRangesSection.style.display = 'none';
  }
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
  
  // Enable rotate button
  updateRotateButtonState();
  
  // Get page count from PDF (mock implementation - would need PDF.js in a real app)
  getPdfPageCount(file)
    .then(count => {
      pdfPageCount = count;
      pageCount.textContent = `${count} pages`;
      
      // Update page range placeholder with actual page count
      pageRangesInput.placeholder = `E.g.: 1, 3-5, 7-${count}`;
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
  updateRotateButtonState();
}

// Update rotate button state
function updateRotateButtonState() {
  rotateBtn.disabled = !selectedFile || isOperationInProgress;
}

// Parse page ranges from input
function parsePageRanges(input, maxPages) {
  if (!input.trim()) {
    return [];
  }
  
  const ranges = [];
  const parts = input.split(',');
  
  for (const part of parts) {
    const trimmedPart = part.trim();
    
    if (trimmedPart.includes('-')) {
      // Range format (e.g., "1-3")
      const [start, end] = trimmedPart.split('-').map(num => parseInt(num.trim(), 10));
      
      if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > maxPages) {
        return null; // Invalid range
      }
      
      for (let i = start; i <= end; i++) {
        if (!ranges.includes(i)) {
          ranges.push(i);
        }
      }
    } else {
      // Single page format (e.g., "5")
      const pageNum = parseInt(trimmedPart, 10);
      
      if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
        return null; // Invalid page number
      }
      
      if (!ranges.includes(pageNum)) {
        ranges.push(pageNum);
      }
    }
  }
  
  return ranges.sort((a, b) => a - b);
}

// Validate rotation options
function validateRotationOptions() {
  const rotationType = document.querySelector('input[name="rotationType"]:checked').value;
  
  if (rotationType === 'selected') {
    const pageRanges = parsePageRanges(pageRangesInput.value, pdfPageCount);
    
    if (pageRanges === null || pageRanges.length === 0) {
      alert('Please enter valid page numbers or ranges.');
      return false;
    }
  }
  
  return true;
}

// Rotate PDF
async function rotatePdf() {
  if (!selectedFile || isOperationInProgress) return;
  
  if (!validateRotationOptions()) {
    return;
  }
  
  isOperationInProgress = true;
  updateRotateButtonState();
  
  try {
    // Show progress
    rotateProgress.classList.remove('hidden');
    updateProgress(10);
    
    // Prepare rotation data
    const rotationType = document.querySelector('input[name="rotationType"]:checked').value;
    let rotations = [];
    
    if (rotationType === 'all') {
      // Rotate all pages
      rotations = Array.from({ length: pdfPageCount }, (_, i) => ({
        page: i + 1,
        angle: rotationAngle
      }));
    } else {
      // Rotate selected pages
      const pageRanges = parsePageRanges(pageRangesInput.value, pdfPageCount);
      
      rotations = pageRanges.map(page => ({
        page,
        angle: rotationAngle
      }));
    }
    
    // Call API to rotate PDF
    const result = await ScanProAPI.rotatePdf(selectedFile, rotations);
    
    updateProgress(100);
    
    if (result.success) {
      // Store download URL
      rotateResultUrl = result.fileUrl;
      
      // Update stats
      resultFileNameText.textContent = selectedFile.name;
      pagesRotatedText.textContent = rotations.length;
      
      // Show result section
      rotateResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error rotating PDF: ${error.message}`);
    rotateProgress.classList.add('hidden');
  } finally {
    isOperationInProgress = false;
    updateRotateButtonState();
  }
}

// Download rotated PDF
async function downloadRotatedPdf() {
  if (!rotateResultUrl) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url: rotateResultUrl,
      filename: `rotated-${selectedFile.name}`
    });
    
    // Clear after successful download
    setTimeout(() => {
      clearFile();
      rotateResult.classList.add('hidden');
      rotateProgress.classList.add('hidden');
      rotateResultUrl = null;
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Update progress bar
function updateProgress(value) {
  rotateProgressFill.style.width = `${value}%`;
  rotateProgressText.textContent = `${Math.round(value)}%`;
}

// Close the tool window
function closeTool() {
  window.close();
}