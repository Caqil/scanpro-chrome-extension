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
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error compressing PDF:', error);
      throw error;
    }
  },
  
  // PDF Merging
  async mergePdfs(files) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });
      
      const response = await fetch(`${API_BASE_URL}/merge`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw error;
    }
  },
  
  // PDF Splitting
  async splitPdf(file, splitMethod, splitOptions) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('splitMethod', splitMethod); // 'range', 'pageCount', 'bookmarks'
      formData.append('splitOptions', JSON.stringify(splitOptions));
      
      const response = await fetch(`${API_BASE_URL}/split`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error splitting PDF:', error);
      throw error;
    }
  },
  
  // PDF Protection
  async protectPdf(file, password, permissions = {}) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      formData.append('permissions', JSON.stringify(permissions));
      
      const response = await fetch(`${API_BASE_URL}/pdf/protect`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error protecting PDF:', error);
      throw error;
    }
  },
  
  // PDF Unlock
  async unlockPdf(file, password) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      
      const response = await fetch(`${API_BASE_URL}/pdf/unlock`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error unlocking PDF:', error);
      throw error;
    }
  },
  
  // PDF Watermarking
  async watermarkPdf(file, watermarkType, options) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('watermarkType', watermarkType); // 'text' or 'image'
      
      // Add all options to formData
      Object.entries(options).forEach(([key, value]) => {
        if (key === 'watermarkImage' && value instanceof File) {
          formData.append('watermarkImage', value);
        } else {
          formData.append(key, value);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/pdf/watermark`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error watermarking PDF:', error);
      throw error;
    }
  },
  
  // PDF Signing
  async signPdf(file, elements) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('elements', JSON.stringify(elements));
      
      const response = await fetch(`${API_BASE_URL}/pdf/sign`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error signing PDF:', error);
      throw error;
    }
  },
  
  // PDF Rotation
  async rotatePdf(file, rotations) {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('rotations', JSON.stringify(rotations));
      
      const response = await fetch(`${API_BASE_URL}/pdf/rotate`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error rotating PDF:', error);
      throw error;
    }
  },
  
  // PDF OCR
  async ocrPdf(file, language = 'eng') {
    try {
      const headers = await getHeaders();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      
      const response = await fetch(`${API_BASE_URL}/ocr`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return handleResponse(response);
    } catch (error) {
      console.error('Error performing OCR on PDF:', error);
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