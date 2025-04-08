/**
 * ScanPro Chrome Extension - Split PDF Tool
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
const splitMethodRadios = document.getElementsByName('splitMethod');
const pageRangeInput = document.getElementById('pageRangeInput');
const pageCountInput = document.getElementById('pageCountInput');
const bookmarkLevelSelect = document.getElementById('bookmarkLevelSelect');
const splitBtn = document.getElementById('splitBtn');
const splitProgress = document.getElementById('splitProgress');
const splitProgressFill = splitProgress.querySelector('.progress-fill');
const splitProgressText = splitProgress.querySelector('.progress-text');
const splitResult = document.getElementById('splitResult');
const splitResultCloseBtn = document.getElementById('splitResultCloseBtn');
const splitDownloadBtn = document.getElementById('splitDownloadBtn');
const originalFileNameText = document.getElementById('originalFileNameText');
const fileCountText = document.getElementById('fileCountText');

// State variables
let selectedFile = null;
let pdfPageCount = 0;
let splitResultUrl = null;
let isOperationInProgress = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
  setupSplitMethodFields();
});

// Set up event listeners
function setupEventListeners() {
  closeBtn.addEventListener('click', closeTool);
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelection);
  clearFileBtn.addEventListener('click', clearFile);
  splitBtn.addEventListener('click', splitPdf);
  splitResultCloseBtn.addEventListener('click', () => splitResult.classList.add('hidden'));
  splitDownloadBtn.addEventListener('click', downloadSplitPdfs);
  
  // Split method change
  splitMethodRadios.forEach(radio => {
    radio.addEventListener('change', setupSplitMethodFields);
  });
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

// Set up split method option fields
function setupSplitMethodFields() {
  const selectedMethod = document.querySelector('input[name="splitMethod"]:checked').value;
  
  // Hide all option fields
  document.getElementById('rangeFields').style.display = 'none';
  document.getElementById('pageCountFields').style.display = 'none';
  document.getElementById('bookmarkFields').style.display = 'none';
  
  // Show selected method fields
  switch (selectedMethod) {
    case 'range':
      document.getElementById('rangeFields').style.display = 'block';
      break;
    case 'pageCount':
      document.getElementById('pageCountFields').style.display = 'block';
      break;
    case 'bookmarks':
      document.getElementById('bookmarkFields').style.display = 'block';
      break;
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
  
  // Enable split button
  updateSplitButtonState();
  
  // Get page count from PDF (mock implementation - would need PDF.js in a real app)
  getPdfPageCount(file)
    .then(count => {
      pdfPageCount = count;
      pageCount.textContent = `${count} pages`;
      
      // Update page range placeholder with actual page count
      pageRangeInput.placeholder = `E.g.: 1-3, 4-8, 9-${count}`;
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
  updateSplitButtonState();
}

// Update split button state
function updateSplitButtonState() {
  splitBtn.disabled = !selectedFile || isOperationInProgress;
}

// Parse page ranges from input
function parsePageRanges(input, maxPages) {
  const ranges = [];
  
  if (!input.trim()) {
    return [];
  }
  
  const rangeParts = input.split(',');
  
  for (const part of rangeParts) {
    const trimmedPart = part.trim();
    
    if (trimmedPart.includes('-')) {
      // Range format (e.g., "1-3")
      const [start, end] = trimmedPart.split('-').map(num => parseInt(num.trim(), 10));
      
      if (isNaN(start) || isNaN(end) || start < 1 || end < start || end > maxPages) {
        return null; // Invalid range
      }
      
      ranges.push({ start, end });
    } else {
      // Single page format (e.g., "5")
      const pageNum = parseInt(trimmedPart, 10);
      
      if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
        return null; // Invalid page number
      }
      
      ranges.push({ start: pageNum, end: pageNum });
    }
  }
  
  return ranges;
}

// Validate split options
function validateSplitOptions() {
  const selectedMethod = document.querySelector('input[name="splitMethod"]:checked').value;
  
  switch (selectedMethod) {
    case 'range':
      const ranges = parsePageRanges(pageRangeInput.value, pdfPageCount);
      
      if (!ranges || ranges.length === 0) {
        alert('Please enter valid page ranges.');
        return false;
      }
      break;
      
    case 'pageCount':
      const pagesPerFile = parseInt(pageCountInput.value, 10);
      
      if (isNaN(pagesPerFile) || pagesPerFile < 1) {
        alert('Please enter a valid number of pages per file.');
        return false;
      }
      break;
      
    case 'bookmarks':
      // No validation needed for bookmark level
      break;
  }
  
  return true;
}

// Split PDF
async function splitPdf() {
  if (!selectedFile || isOperationInProgress) return;
  
  if (!validateSplitOptions()) {
    return;
  }
  
  isOperationInProgress = true;
  updateSplitButtonState();
  
  try {
    // Show progress
    splitProgress.classList.remove('hidden');
    updateProgress(10);
    
    // Get split options
    const selectedMethod = document.querySelector('input[name="splitMethod"]:checked').value;
    let splitOptions = {};
    
    switch (selectedMethod) {
      case 'range':
        splitOptions = {
          ranges: parsePageRanges(pageRangeInput.value, pdfPageCount)
        };
        break;
        
      case 'pageCount':
        splitOptions = {
          pagesPerFile: parseInt(pageCountInput.value, 10)
        };
        break;
        
      case 'bookmarks':
        splitOptions = {
          bookmarkLevel: parseInt(bookmarkLevelSelect.value, 10)
        };
        break;
    }
    
    // Call API to split PDF
    const result = await ScanProAPI.splitPdf(selectedFile, selectedMethod, splitOptions);
    
    updateProgress(100);
    
    if (result.success) {
      // Store download URL
      splitResultUrl = result.fileUrl;
      
      // Update stats
      originalFileNameText.textContent = selectedFile.name;
      fileCountText.textContent = result.fileCount || 'Multiple';
      
      // Show result section
      splitResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error splitting PDF: ${error.message}`);
    splitProgress.classList.add('hidden');
  } finally {
    isOperationInProgress = false;
    updateSplitButtonState();
  }
}

// Download split PDFs
async function downloadSplitPdfs() {
  if (!splitResultUrl) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url: splitResultUrl,
      filename: `split-files-${Date.now()}.zip`
    });
    
    // Clear after successful download
    setTimeout(() => {
      clearFile();
      splitResult.classList.add('hidden');
      splitProgress.classList.add('hidden');
      splitResultUrl = null;
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Update progress bar
function updateProgress(value) {
  splitProgressFill.style.width = `${value}%`;
  splitProgressText.textContent = `${Math.round(value)}%`;
}

// Close the tool window
function closeTool() {
  window.close();
}