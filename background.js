// Set default state when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
}); 