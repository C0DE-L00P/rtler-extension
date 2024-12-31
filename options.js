// Load excluded sites
function loadExcludedSites() {
  chrome.storage.local.get(['excludedSites'], (result) => {
    const excludedSites = result.excludedSites || [];
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';

    excludedSites.forEach(site => {
      const div = document.createElement('div');
      div.className = 'site-item';
      div.innerHTML = `
        <span>${site}</span>
        <button class="remove-site" data-site="${site}">Remove</button>
      `;
      siteList.appendChild(div);
    });

    // Add remove button listeners
    document.querySelectorAll('.remove-site').forEach(button => {
      button.addEventListener('click', removeSite);
    });
  });
}

// Add new site to excluded list
function addSite() {
  const input = document.getElementById('newSite');
  const site = input.value.trim().toLowerCase();
  
  if (!site) return;

  chrome.storage.local.get(['excludedSites'], (result) => {
    const excludedSites = result.excludedSites || [];
    if (!excludedSites.includes(site)) {
      excludedSites.push(site);
      chrome.storage.local.set({ excludedSites }, () => {
        input.value = '';
        loadExcludedSites();
        showStatus();
      });
    }
  });
}

// Remove site from excluded list
function removeSite(e) {
  const site = e.target.dataset.site;
  chrome.storage.local.get(['excludedSites'], (result) => {
    const excludedSites = result.excludedSites || [];
    const newList = excludedSites.filter(s => s !== site);
    chrome.storage.local.set({ excludedSites: newList }, () => {
      loadExcludedSites();
      showStatus();
    });
  });
}

// Show status message
function showStatus() {
  const status = document.getElementById('status');
  status.style.display = 'block';
  setTimeout(() => {
    status.style.display = 'none';
  }, 2000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadExcludedSites();
  document.getElementById('addSite').addEventListener('click', addSite);
}); 