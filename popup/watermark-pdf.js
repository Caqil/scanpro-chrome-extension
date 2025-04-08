/**
 * ScanPro Chrome Extension - Watermark PDF Tool
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
const watermarkTypeRadios = document.getElementsByName('watermarkType');
const textWatermarkOptions = document.getElementById('textWatermarkOptions');
const imageWatermarkOptions = document.getElementById('imageWatermarkOptions');
const watermarkText = document.getElementById('watermarkText');
const fontSelect = document.getElementById('fontSelect');
const fontSizeSelect = document.getElementById('fontSizeSelect');
const textColorPicker = document.getElementById('textColorPicker');
const textColorValue = document.getElementById('textColorValue');
const imageInput = document.getElementById('imageInput');
const imageUploadArea = document.getElementById('imageUploadArea');
const imagePreview = document.getElementById('imagePreview');
const imagePreviewThumbnail = document.getElementById('imagePreviewThumbnail');
const imageFileName = document.getElementById('imageFileName');
const imageFileSize = document.getElementById('imageFileSize');
const clearImageBtn = document.getElementById('clearImageBtn');
const imageSizeSelect = document.getElementById('imageSizeSelect');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const rotationSelect = document.getElementById('rotationSelect');
const positionOptions = document.querySelectorAll('.position-option');
const pagesSelect = document.getElementById('pagesSelect');
const customPagesSection = document.getElementById('customPagesSection');
const customPagesInput = document.getElementById('customPagesInput');
const watermarkBtn = document.getElementById('watermarkBtn');
const watermarkProgress = document.getElementById('watermarkProgress');
const watermarkProgressFill = watermarkProgress.querySelector('.progress-fill');
const watermarkProgressText = watermarkProgress.querySelector('.progress-text');
const watermarkResult = document.getElementById('watermarkResult');
const watermarkResultCloseBtn = document.getElementById('watermarkResultCloseBtn');
const watermarkDownloadBtn = document.getElementById('watermarkDownloadBtn');
const resultFileNameText = document.getElementById('resultFileNameText');
const pagesWatermarkedText = document.getElementById('pagesWatermarkedText');

// State variables
let selectedFile = null;
let pdfPageCount = 0;
let selectedWatermarkImage = null;
let watermarkResultUrl = null;
let isOperationInProgress = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  setupDragAndDrop();
  updateWatermarkTypeOptions();
});

// Set up event listeners
function setupEventListeners() {
  closeBtn.addEventListener('click', closeTool);
  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelection);
  clearFileBtn.addEventListener('click', clearFile);
  watermarkBtn.addEventListener('click', watermarkPdf);
  watermarkResultCloseBtn.addEventListener('click', () => watermarkResult.classList.add('hidden'));
  watermarkDownloadBtn.addEventListener('click', downloadWatermarkedPdf);
  
  // Watermark type change
  watermarkTypeRadios.forEach(radio => {
    radio.addEventListener('change', updateWatermarkTypeOptions);
  });
  
  // Text watermark options
  watermarkText.addEventListener('input', updateWatermarkButtonState);
  textColorPicker.addEventListener('input', () => {
    textColorValue.value = textColorPicker.value;
  });
  
  // Image watermark options
  imageUploadArea.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageSelection);
  clearImageBtn.addEventListener('click', clearWatermarkImage);
  
  // Opacity slider
  opacitySlider.addEventListener('input', () => {
    opacityValue.textContent = `${opacitySlider.value}%`;
  });
  
  // Position options
  positionOptions.forEach(option => {
    option.addEventListener('click', () => {
      positionOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      option.querySelector('input').checked = true;
    });
  });
  
  // Pages select
  pagesSelect.addEventListener('change', () => {
    customPagesSection.classList.toggle('hidden', pagesSelect.value !== 'custom');
    if (pagesSelect.value === 'custom') {
      customPagesInput.focus();
    }
  });
  
  // Custom pages input
  customPagesInput.addEventListener('input', updateWatermarkButtonState);
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

// Update watermark type options
function updateWatermarkTypeOptions() {
  const selectedType = document.querySelector('input[name="watermarkType"]:checked').value;
  
  if (selectedType === 'text') {
    textWatermarkOptions.style.display = 'block';
    imageWatermarkOptions.style.display = 'none';
  } else {
    textWatermarkOptions.style.display = 'none';
    imageWatermarkOptions.style.display = 'block';
  }
  
  updateWatermarkButtonState();
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
  
  // Enable watermark button if other required fields are set
  updateWatermarkButtonState();
  
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

// Handle watermark image selection
function handleImageSelection(e) {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    
    // Check if file is image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      imageInput.value = '';
      return;
    }
    
    // Set selected image
    selectedWatermarkImage = file;
    
    // Update UI
    imageFileName.textContent = file.name;
    imageFileSize.textContent = Utils.formatFileSize(file.size);
    
    // Create image preview
    const reader = new FileReader();
    reader.onload = function(e) {
      imagePreviewThumbnail.src = e.target.result;
      imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    
    // Enable watermark button if PDF file is selected
    updateWatermarkButtonState();
  }
}

// Clear watermark image
function clearWatermarkImage() {
  imagePreview.classList.add('hidden');
  imageInput.value = '';
  selectedWatermarkImage = null;
  updateWatermarkButtonState();
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
  updateWatermarkButtonState();
}

// Parse page ranges from input
function parsePageRanges(input, maxPages) {
  if (!input.trim()) {
    return [];
  }
  
  const pages = [];
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
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }
    } else {
      // Single page format (e.g., "5")
      const pageNum = parseInt(trimmedPart, 10);
      
      if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
        return null; // Invalid page number
      }
      
      if (!pages.includes(pageNum)) {
        pages.push(pageNum);
      }
    }
  }
  
  return pages.sort((a, b) => a - b);
}

// Update watermark button state
function updateWatermarkButtonState() {
  const watermarkType = document.querySelector('input[name="watermarkType"]:checked').value;
  let isValid = selectedFile !== null && !isOperationInProgress;
  
  if (watermarkType === 'text') {
    isValid = isValid && watermarkText.value.trim().length > 0;
  } else {
    isValid = isValid && selectedWatermarkImage !== null;
  }
  
  if (pagesSelect.value === 'custom') {
    const pageRanges = parsePageRanges(customPagesInput.value, pdfPageCount);
    isValid = isValid && pageRanges !== null && pageRanges.length > 0;
  }
  
  watermarkBtn.disabled = !isValid;
}

// Get position value from selected option
function getSelectedPosition() {
  const activePositionOption = document.querySelector('.position-option.active');
  return activePositionOption ? activePositionOption.dataset.position : 'center';
}

// Get pages to watermark based on selection
function getPagesToWatermark() {
  const selectedOption = pagesSelect.value;
  
  switch (selectedOption) {
    case 'all':
      return { type: 'all' };
    
    case 'first':
      return { type: 'specific', pages: [1] };
    
    case 'last':
      return { type: 'specific', pages: [pdfPageCount] };
    
    case 'custom':
      const pages = parsePageRanges(customPagesInput.value, pdfPageCount);
      return { type: 'specific', pages };
    
    default:
      return { type: 'all' };
  }
}

// Get pages description for results
function getPagesDescription(pageInfo) {
  if (pageInfo.type === 'all') {
    return 'All pages';
  } else if (pageInfo.pages.length === 1) {
    return `Page ${pageInfo.pages[0]}`;
  } else {
    return `${pageInfo.pages.length} pages`;
  }
}

// Watermark PDF
async function watermarkPdf() {
  if (!selectedFile || isOperationInProgress) return;
  
  const watermarkType = document.querySelector('input[name="watermarkType"]:checked').value;
  
  if (watermarkType === 'text' && !watermarkText.value.trim()) {
    alert('Please enter watermark text.');
    watermarkText.focus();
    return;
  }
  
  if (watermarkType === 'image' && !selectedWatermarkImage) {
    alert('Please select an image for the watermark.');
    return;
  }
  
  if (pagesSelect.value === 'custom') {
    const pageRanges = parsePageRanges(customPagesInput.value, pdfPageCount);
    if (pageRanges === null || pageRanges.length === 0) {
      alert('Please enter valid page numbers or ranges.');
      customPagesInput.focus();
      return;
    }
  }
  
  isOperationInProgress = true;
  updateWatermarkButtonState();
  
  try {
    // Show progress
    watermarkProgress.classList.remove('hidden');
    updateProgress(10);
    
    // Get watermark options
    const options = {
      opacity: parseInt(opacitySlider.value, 10) / 100,
      rotation: parseInt(rotationSelect.value, 10),
      position: getSelectedPosition(),
      pages: getPagesToWatermark()
    };
    
    if (watermarkType === 'text') {
      options.text = watermarkText.value.trim();
      options.font = fontSelect.value;
      options.fontSize = parseInt(fontSizeSelect.value, 10);
      options.color = textColorPicker.value;
    }
    
    // Call API to watermark PDF
    const result = await ScanProAPI.watermarkPdf(
      selectedFile,
      watermarkType,
      watermarkType === 'image' ? { ...options, watermarkImage: selectedWatermarkImage } : options
    );
    
    updateProgress(100);
    
    if (result.success) {
      // Store download URL
      watermarkResultUrl = result.fileUrl;
      
      // Update stats
      resultFileNameText.textContent = selectedFile.name;
      pagesWatermarkedText.textContent = getPagesDescription(options.pages);
      
      // Show result section
      watermarkResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error watermarking PDF: ${error.message}`);
    watermarkProgress.classList.add('hidden');
  } finally {
    isOperationInProgress = false;
    updateWatermarkButtonState();
  }
}

// Download watermarked PDF
async function downloadWatermarkedPdf() {
  if (!watermarkResultUrl) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url: watermarkResultUrl,
      filename: `watermarked-${selectedFile.name}`
    });
    
    // Clear after successful download
    setTimeout(() => {
      clearFile();
      watermarkResult.classList.add('hidden');
      watermarkProgress.classList.add('hidden');
      watermarkResultUrl = null;
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Update progress bar
function updateProgress(value) {
  watermarkProgressFill.style.width = `${value}%`;
  watermarkProgressText.textContent = `${Math.round(value)}%`;
}

// Close the tool window
function closeTool() {
  window.close();
}