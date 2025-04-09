/**
 * Utility functions for ScanPro Chrome Extension
 */

const Utils = {
    /**
     * Format file size to human-readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Extract filename from content-disposition header or URL
     * @param {string} contentDisposition - Content-Disposition header value
     * @param {string} url - URL of the file
     * @returns {string} Extracted filename
     */
    getFilenameFromContentDisposition(contentDisposition, url) {
      // Try to get filename from content-disposition header
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          return matches[1].replace(/['"]/g, '').trim();
        }
      }
      
      // Fall back to URL
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1].split('?')[0] || 'download.pdf';
    },
    
    /**
     * Get file extension from filename
     * @param {string} filename - Name of the file
     * @returns {string} File extension (lowercase, without dot)
     */
    getFileExtension(filename) {
      return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2).toLowerCase();
    },
    
    /**
     * Check if file is PDF
     * @param {File} file - File object to check
     * @returns {boolean} True if file is PDF
     */
    isPdfFile(file) {
      return file.type === 'application/pdf' || 
            this.getFileExtension(file.name) === 'pdf';
    },
    
    /**
     * Generate a unique filename
     * @param {string} originalName - Original filename
     * @param {string} operation - Operation performed (e.g., "converted", "compressed")
     * @returns {string} Unique filename
     */
    generateUniqueFilename(originalName, operation) {
      const extension = this.getFileExtension(originalName);
      const baseName = originalName.slice(0, originalName.lastIndexOf('.'));
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      return `${baseName}-${operation}-${timestamp}.${extension}`;
    },
    
    /**
     * Create object URL from blob
     * @param {Blob} blob - Blob to create URL for
     * @returns {string} Object URL
     */
    createObjectURL(blob) {
      return URL.createObjectURL(blob);
    },
    
    /**
     * Revoke object URL
     * @param {string} url - Object URL to revoke
     */
    revokeObjectURL(url) {
      URL.revokeObjectURL(url);
    },
    
    /**
     * Convert array buffer to base64
     * @param {ArrayBuffer} buffer - Array buffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      return window.btoa(binary);
    },
    
    /**
     * Create file download link
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Name for the downloaded file
     */
    downloadBlob(blob, filename) {
      const url = this.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        this.revokeObjectURL(url);
      }, 100);
    },
    
    /**
     * Simple validation for API key format
     * @param {string} apiKey - API key to validate
     * @returns {boolean} True if format is valid
     */
    isValidApiKeyFormat(apiKey) {
      // Basic validation - typically API keys are at least 30 chars
      return typeof apiKey === 'string' && apiKey.length >= 30;
    },
    
    /**
     * Show a notification
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(title, message, type = 'info') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '../images/icon128.png',
        title,
        message,
        priority: 1
      });
    }
  };
  
  // Export the utils object
  export default Utils;