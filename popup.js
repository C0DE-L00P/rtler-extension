document.addEventListener('DOMContentLoaded', () => {
  const toggleSwitch = document.getElementById('toggleSwitch');

  // Load initial state
  chrome.storage.local.get(['enabled'], (result) => {
    toggleSwitch.checked = result.enabled !== false;
  });

  // Handle toggle changes
  toggleSwitch.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    chrome.storage.local.set({ enabled });
    
    // Notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleRTL', enabled });
    });
  });
}); 