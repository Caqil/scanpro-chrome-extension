/**
 * ScanPro Chrome Extension Content Script
 * This script runs in the context of web pages
 */

// Configuration
const SCANPRO_DOMAIN = 'scanpro.cc';
const PDF_EXTENSIONS = ['.pdf'];

// Initialize
init();

/**
 * Initialize the content script
 */
function init() {
  // Only run on pages that aren't ScanPro itself
  if (!window.location.hostname.includes(SCANPRO_DOMAIN)) {
    // Add listeners for PDF links
    detectPdfLinks();
    
    // Set up mutation observer to catch dynamically added links
    setupMutationObserver();
  }
}

/**
 * Detect PDF links on the page and enhance them
 */
function detectPdfLinks() {
  const links = document.querySelectorAll('a');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && isPdfLink(href) && !link.classList.contains('scanpro-enhanced')) {
      enhancePdfLink(link);
    }
  });
}

/**
 * Check if a URL points to a PDF
 * @param {string} url - URL to check
 * @returns {boolean}
 */
function isPdfLink(url) {
  try {
    // Check file extension
    const extension = url.split('.').pop().toLowerCase();
    if (extension === 'pdf') return true;
    
    // Check if URL contains PDF indicators
    if (url.includes('/pdf/') || url.includes('pdf=') || url.includes('type=pdf')) {
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Enhance a PDF link with ScanPro options
 * @param {HTMLAnchorElement} link - Link element to enhance
 */
function enhancePdfLink(link) {
  // Mark as enhanced to prevent duplicate processing
  link.classList.add('scanpro-enhanced');
  
  // Create the ScanPro button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'scanpro-link-tools';
  buttonContainer.style.display = 'none';
  buttonContainer.style.position = 'absolute';
  buttonContainer.style.zIndex = '9999';
  buttonContainer.style.backgroundColor = 'white';
  buttonContainer.style.border = '1px solid #e2e8f0';
  buttonContainer.style.borderRadius = '6px';
  buttonContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)';
  buttonContainer.style.padding = '6px';
  
  // Add ScanPro tools to the container
  const toolOptions = [
    { name: 'Open with ScanPro', action: 'open' },
    { name: 'Convert PDF', action: 'convert' },
    { name: 'Compress PDF', action: 'compress' }
  ];
  
  toolOptions.forEach(option => {
    const button = document.createElement('button');
    button.textContent = option.name;
    button.className = 'scanpro-tool-button';
    button.style.display = 'block';
    button.style.width = '100%';
    button.style.textAlign = 'left';
    button.style.padding = '8px 12px';
    button.style.border = 'none';
    button.style.backgroundColor = 'transparent';
    button.style.cursor = 'pointer';
    button.style.fontSize = '14px';
    
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = '#f8fafc';
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = 'transparent';
    });
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const pdfUrl = link.href;
      handlePdfAction(option.action, pdfUrl);
      
      hideButtonContainer();
    });
    
    buttonContainer.appendChild(button);
  });
  
  // Add the container to the document
  document.body.appendChild(buttonContainer);
  
  // Add hover event to show/hide the tools
  link.addEventListener('mouseenter', () => {
    const rect = link.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    
    buttonContainer.style.top = `${rect.bottom + scrollTop}px`;
    buttonContainer.style.left = `${rect.left + scrollLeft}px`;
    buttonContainer.style.display = 'block';
  });
  
  link.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!isMouseOverElement(buttonContainer)) {
        buttonContainer.style.display = 'none';
      }
    }, 300);
  });
  
  buttonContainer.addEventListener('mouseleave', () => {
    hideButtonContainer();
  });
  
  function hideButtonContainer() {
    buttonContainer.style.display = 'none';
  }
}

/**
 * Setup a MutationObserver to detect dynamically added PDF links
 */
function setupMutationObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldScan = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check if the added node is an element that could contain links
          if (node.nodeType === Node.ELEMENT_NODE) {
            shouldScan = true;
          }
        });
      }
    });
    
    if (shouldScan) {
      detectPdfLinks();
    }
  });
  
  // Start observing the document with configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

/**
 * Handle PDF action based on user selection
 * @param {string} action - Action to perform
 * @param {string} pdfUrl - URL of the PDF
 */
function handlePdfAction(action, pdfUrl) {
  switch (action) {
    case 'open':
      chrome.runtime.sendMessage({
        type: 'OPEN_PDF',
        pdfUrl
      });
      break;
      
    case 'convert':
      chrome.runtime.sendMessage({
        type: 'OPEN_TOOL',
        tool: 'convert',
        pdfUrl
      });
      break;
      
    case 'compress':
      chrome.runtime.sendMessage({
        type: 'OPEN_TOOL',
        tool: 'compress',
        pdfUrl
      });
      break;
      
    default:
      console.warn('Unknown PDF action:', action);
  }
}

/**
 * Check if mouse is over a specific element
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
function isMouseOverElement(element) {
  const rect = element.getBoundingClientRect();
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  
  return (
    mouseX >= rect.left &&
    mouseX <= rect.right &&
    mouseY >= rect.top &&
    mouseY <= rect.bottom
  );
}