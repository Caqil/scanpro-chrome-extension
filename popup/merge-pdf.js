/**
 * ScanPro Chrome Extension - Merge PDF Tool
 */

import ScanProAPI from '../lib/api.js';
import Utils from '../lib/utils.js';

// DOM Elements
const closeBtn = document.getElementById('closeBtn');
const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileList = document.getElementById('fileList');
const clearBtn = document.getElementById('clearBtn');
const mergeBtn = document.getElementById('mergeBtn');
const mergeProgress = document.getElementById('mergeProgress');
const mergeProgressFill = mergeProgress.querySelector('.progress-fill');
const mergeProgressText = mergeProgress.querySelector('.progress-text');
const mergeResult = document.getElementById('mergeResult');
const mergeResultCloseBtn = document.getElementById('mergeResultCloseBtn');
const mergeDownloadBtn = document.getElementById('mergeDownloadBtn');
const fileCountText = document.getElementById('fileCountText');
const resultSizeText = document.getElementById('resultSizeText');

// State variables
let selectedFiles = [];
let mergeResultUrl = null;
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
  clearBtn.addEventListener('click', clearFiles);
  mergeBtn.addEventListener('click', mergePdfs);
  mergeResultCloseBtn.addEventListener('click', () => mergeResult.classList.add('hidden'));
  mergeDownloadBtn.addEventListener('click', downloadMergedPdf);
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
      handleFiles(e.dataTransfer.files);
    }
  });
  
  // Handle file list sorting
  new Sortable(fileList, {
    animation: 150,
    handle: '.file-handle',
    onEnd: () => {
      // Update the selectedFiles array based on the new order
      const fileItems = Array.from(fileList.querySelectorAll('.file-item'));
      const newOrder = fileItems.map(item => {
        const fileId = item.dataset.fileId;
        return selectedFiles.find(file => file.id === fileId);
      });
      
      selectedFiles = newOrder;
    }
  });
}

// Handle file selection from input
function handleFileSelection(e) {
  if (e.target.files.length > 0) {
    handleFiles(e.target.files);
  }
}

// Process selected files
function handleFiles(files) {
  // Filter PDF files
  const pdfFiles = Array.from(files).filter(file => Utils.isPdfFile(file));
  
  if (pdfFiles.length === 0) {
    alert('Please select PDF files only.');
    return;
  }
  
  // Add files to our list
  pdfFiles.forEach(file => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add to selectedFiles array
    selectedFiles.push({
      id: fileId,
      file: file,
      name: file.name,
      size: file.size
    });
    
    // Add to UI
    addFileToList(fileId, file.name, file.size);
  });
  
  // Reset file input
  fileInput.value = '';
  
  // Enable merge button if we have files
  updateMergeButtonState();
}

// Add file to the list UI
function addFileToList(fileId, fileName, fileSize) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.dataset.fileId = fileId;
  
  fileItem.innerHTML = `
    <div class="file-handle">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </div>
    <div class="file-info">
      <span class="file-name">${fileName}</span>
      <span class="file-size">${Utils.formatFileSize(fileSize)}</span>
    </div>
    <div class="file-actions">
      <button class="icon-btn remove-file-btn" data-file-id="${fileId}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
  
  // Add remove file event listener
  fileItem.querySelector('.remove-file-btn').addEventListener('click', () => {
    removeFile(fileId);
  });
  
  fileList.appendChild(fileItem);
}

// Remove file from list
function removeFile(fileId) {
  // Remove from UI
  const fileItem = document.querySelector(`.file-item[data-file-id="${fileId}"]`);
  if (fileItem) {
    fileItem.remove();
  }
  
  // Remove from selectedFiles array
  selectedFiles = selectedFiles.filter(file => file.id !== fileId);
  
  // Update merge button state
  updateMergeButtonState();
}

// Clear all files
function clearFiles() {
  fileList.innerHTML = '';
  selectedFiles = [];
  updateMergeButtonState();
}

// Update merge button state
function updateMergeButtonState() {
  mergeBtn.disabled = selectedFiles.length < 2 || isOperationInProgress;
}

// Merge PDFs
async function mergePdfs() {
  if (selectedFiles.length < 2 || isOperationInProgress) return;
  
  isOperationInProgress = true;
  updateMergeButtonState();
  
  try {
    // Show progress
    mergeProgress.classList.remove('hidden');
    updateProgress(10);
    
    // Extract actual File objects for API call
    const files = selectedFiles.map(item => item.file);
    
    // Call API to merge PDFs
    const result = await ScanProAPI.mergePdfs(files);
    
    updateProgress(100);
    
    if (result.success) {
      // Store download URL
      mergeResultUrl = result.fileUrl;
      
      // Update stats
      fileCountText.textContent = selectedFiles.length;
      resultSizeText.textContent = Utils.formatFileSize(result.fileSize || 0);
      
      // Show result section
      mergeResult.classList.remove('hidden');
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    alert(`Error merging PDFs: ${error.message}`);
    mergeProgress.classList.add('hidden');
  } finally {
    isOperationInProgress = false;
    updateMergeButtonState();
  }
}

// Download merged PDF
async function downloadMergedPdf() {
  if (!mergeResultUrl) return;
  
  try {
    await chrome.runtime.sendMessage({
      type: 'DOWNLOAD_FILE',
      url: mergeResultUrl,
      filename: `merged-document-${Date.now()}.pdf`
    });
    
    // Clear after successful download
    setTimeout(() => {
      clearFiles();
      mergeResult.classList.add('hidden');
      mergeProgress.classList.add('hidden');
      mergeResultUrl = null;
    }, 1000);
  } catch (error) {
    alert(`Error downloading file: ${error.message}`);
  }
}

// Update progress bar
function updateProgress(value) {
  mergeProgressFill.style.width = `${value}%`;
  mergeProgressText.textContent = `${Math.round(value)}%`;
}

// Close the tool window
function closeTool() {
  window.close();
}

// For Sortable.js - add to the global scope
class Sortable {
  constructor(element, options) {
    this.element = element;
    this.options = options || {};
    this.init();
  }
  
  init() {
    this.bindEvents();
  }
  
  bindEvents() {
    const items = this.element.querySelectorAll('.file-item');
    let draggedItem = null;
    
    items.forEach(item => {
      const handle = item.querySelector('.file-handle');
      
      handle.addEventListener('mousedown', e => {
        e.preventDefault();
        draggedItem = item;
        
        // Add dragging class
        item.classList.add('dragging');
        
        // Record initial position
        const initialX = e.clientX;
        const initialY = e.clientY;
        const initialLeft = item.offsetLeft;
        const initialTop = item.offsetTop;
        
        // Mouse move handler
        const onMouseMove = e => {
          const dx = e.clientX - initialX;
          const dy = e.clientY - initialY;
          
          item.style.position = 'absolute';
          item.style.zIndex = 1000;
          item.style.left = `${initialLeft + dx}px`;
          item.style.top = `${initialTop + dy}px`;
          
          // Find closest element
          const closestItem = this.findClosestItem(e.clientX, e.clientY, item);
          if (closestItem) {
            this.swapItems(item, closestItem);
          }
        };
        
        // Mouse up handler
        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          
          // Reset styles
          item.style.position = '';
          item.style.zIndex = '';
          item.style.left = '';
          item.style.top = '';
          item.classList.remove('dragging');
          
          // Call onEnd callback
          if (this.options.onEnd) {
            this.options.onEnd();
          }
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    });
  }
  
  findClosestItem(x, y, excludeItem) {
    const items = Array.from(this.element.querySelectorAll('.file-item')).filter(item => item !== excludeItem);
    
    let closest = null;
    let closestDistance = Infinity;
    
    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = item;
      }
    });
    
    return closest;
  }
  
  swapItems(item1, item2) {
    const next1 = item1.nextElementSibling;
    const next2 = item2.nextElementSibling;
    
    if (next1 === item2) {
      // item1 is directly before item2
      this.element.insertBefore(item2, item1);
    } else if (next2 === item1) {
      // item2 is directly before item1
      this.element.insertBefore(item1, item2);
    } else {
      // items are not adjacent
      const placeholder = document.createElement('div');
      this.element.insertBefore(placeholder, item2);
      this.element.insertBefore(item2, item1);
      this.element.insertBefore(item1, placeholder);
      this.element.removeChild(placeholder);
    }
  }
}