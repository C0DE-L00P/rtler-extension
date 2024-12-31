// Check if current site is excluded
async function isExcluded() {
  const currentSite = window.location.hostname;
  return new Promise(resolve => {
    chrome.storage.local.get(['excludedSites'], (result) => {
      const excludedSites = result.excludedSites || [];
      resolve(excludedSites.includes(currentSite));
    });
  });
}

// Configuration object for different sites
const SITE_CONFIGS = {
  default: {
    selectors: ['body'],
    observerTarget: 'body'
  }
};

let isEnabled = true;
let observer = null;

// Helper function to detect if text is RTL
function isRTL(text) {
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

// Helper function to check if element or its children contain RTL text
function containsRTLText(element) {
  // Check element's direct text content
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() && isRTL(node.textContent)) {
      return true;
    }
  }

  // Check children's text content
  for (const child of element.children) {
    if (containsRTLText(child)) {
      return true;
    }
  }

  return false;
}

// Function to process a single element
function processElement(element) {
  if (!isEnabled) return;

  // Skip if element is a script or style tag
  if (['SCRIPT', 'STYLE'].includes(element.tagName)) return;

  // Special handling for UL elements
  if (element.tagName === 'UL' || element.tagName === 'OL') {
    if (containsRTLText(element)) {
      element.setAttribute('dir', 'rtl');
    } else if (!element.hasAttribute('dir')) {
      element.setAttribute('dir', 'auto');
    }
  } 
  // For all other elements
  else if (element.childNodes.length > 0) {
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        if (!element.hasAttribute('dir')) {
          element.setAttribute('dir', 'auto');
        }
        break;
      }
    }
  }

  // Process all child elements
  for (const child of element.children) {
    processElement(child);
  }
}

// Main function to handle elements
async function handleElements() {
  if (await isExcluded()) return;
  
  const config = SITE_CONFIGS.default;
  
  config.selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      processElement(element);
    });
  });
}

// Set up MutationObserver
async function setupObserver() {
  if (await isExcluded()) return;
  
  const config = SITE_CONFIGS.default;

  observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      // Process added nodes
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          processElement(node);
        }
      });

      // Check if attributes were modified
      if (mutation.type === 'attributes' && mutation.attributeName === 'dir') {
        const element = mutation.target;
        if (!element.hasAttribute('dir')) {
          processElement(element);
        }
      }
    });
  });

  const targetNode = document.querySelector(config.observerTarget);
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['dir']
    });
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleRTL') {
    isEnabled = request.enabled;
    if (isEnabled) {
      handleElements();
    }
  }
});

// Initialize
chrome.storage.local.get(['enabled'], async (result) => {
  isEnabled = result.enabled !== false;
  if (isEnabled && !(await isExcluded())) {
    handleElements();
    setupObserver();
  }
});

// Run initial check
(async () => {
  if (isEnabled && !(await isExcluded())) {
    handleElements();
  }
})(); 