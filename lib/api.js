/**
 * ScanPro API Client
 * This module contains functions to interact with ScanPro's API endpoints
 */

const API_BASE_URL = 'https://scanpro.cc/api';

// Get API key from storage
async function getApiKey() {
  const data = await chrome.storage.sync.get('apiKey');
  return data.apiKey || null;
}

// Set up headers with API key if available
async function getHeaders() {
  const apiKey = await getApiKey();
  const headers = {
    'Accept': 'application/json',
  };
  
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  
  return headers;
}

// Handle API responses and errors
async function handleResponse(response) {
  if (!response.ok) {
    let errorMessage;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || `HTTP Error: ${response.status}`;
    } catch (e) {
      errorMessage = `HTTP Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  
  return response.json();
}

const ScanProAPI = {
  // Authentication and setup
  async validateApiKey(apiKey) {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ apiKey })
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error validating API key:', error);
      throw error;
    }
  },
  
  // PDF Conversion
  async convertPdf(file, outputFormat) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('outputFormat', outputFormat);
      
      const response = await fetch(`${API_BASE_URL}/convert`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error converting PDF:', error);
      throw error;
    }
  },
  
  // PDF Compression
  async compressPdf(file, compressionLevel = 'medium') {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('compressionLevel', compressionLevel);
      
      const response = await fetch(`${API_BASE_URL}/compress`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      const result = await handleResponse(response);
      
      // FIX: If fileSize isn't included in the response, fetch the file to get its size
      if (result.success && result.fileUrl && !result.fileSize) {
        try {
          const fileResponse = await fetch(result.fileUrl, { 
            method: 'HEAD',
            headers: await getHeaders()
          });
          
          if (fileResponse.ok) {
            // Get file size from Content-Length header
            const contentLength = fileResponse.headers.get('Content-Length');
            if (contentLength) {
              result.fileSize = parseInt(contentLength, 10);
            }
          }
        } catch (fileSizeError) {
          console.warn('Could not determine compressed file size:', fileSizeError);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error compressing PDF:', error);
      throw error;
    }
  },
  
  // Download a processed file
  async downloadFile(fileUrl) {
    try {
      const headers = await getHeaders();
      
      return fetch(fileUrl, {
        method: 'GET',
        headers
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }
};

// Export the API client
export default ScanProAPI;