// let tabCount = 0;
// let pasteCount = 0;

// chrome.runtime.onMessage.addListener((message) => {
//   if (message.type === "TAB_SWITCH") {
//     document.getElementById('tabCount').textContent = ++tabCount;
//   }
//   if (message.type === "PASTE_EVENT") {
//     document.getElementById('pasteCount').textContent = ++pasteCount;
//   }
// });

// document.getElementById('toggle').addEventListener('click', () => {
//   const status = document.getElementById('status');
//   if (status.classList.contains('active')) {
//     status.className = 'status inactive';
//     status.textContent = '🔴 Monitoring Inactive';
//     document.getElementById('toggle').textContent = 'Start Monitoring';
//   } else {
//     status.className = 'status active';
//     status.textContent = '🟢 Monitoring Active';
//     document.getElementById('toggle').textContent = 'Stop Monitoring';
//   }
// });

// Popup Script - Fixed for NaN
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Elements
  const tabCountEl = document.getElementById('tabCount');
  const pasteCountEl = document.getElementById('pasteCount');
  const riskLevelEl = document.getElementById('riskLevel');
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggleMonitor');
  const testBtn = document.getElementById('testBackend');
  const resetBtn = document.getElementById('resetCounts');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  
  // Initialize
  await updateStatus();
  
  // Event Listeners
  toggleBtn?.addEventListener('click', async () => {
    const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_MONITORING' });
    if (response) {
      await updateStatus();
    }
  });
  
  testBtn?.addEventListener('click', async () => {
    testBtn.innerHTML = '🔄 Testing...';
    testBtn.disabled = true;
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' });
      
      if (response?.success) {
        showNotification('✅ ' + response.message, 'success');
      } else {
        showNotification('❌ ' + (response?.message || 'Connection failed'), 'error');
      }
    } catch (error) {
      showNotification('❌ Test failed: ' + error.message, 'error');
    } finally {
      testBtn.innerHTML = '🧪 Test Backend';
      testBtn.disabled = false;
    }
  });
  
  resetBtn?.addEventListener('click', async () => {
    if (confirm('Reset all counts to zero?')) {
      const response = await chrome.runtime.sendMessage({ type: 'RESET_COUNTS' });
      if (response?.success) {
        await updateStatus();
        showNotification('✅ Counts reset', 'success');
      }
    }
  });
  
  // Listen for updates from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'EVENT_UPDATE') {
      updateDisplay(message.counts, message.risk);
    }
  });
  
  // Auto-update every 2 seconds
  setInterval(updateStatus, 2000);
  
  // Functions
  async function updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      if (response) {
        updateDisplay(
          { 
            tabSwitches: response.tabSwitches || 0, 
            pasteEvents: response.pasteEvents || 0 
          },
          response.risk || '0.00'
        );
        
        // Update status
        if (statusEl) {
          if (response.isMonitoring) {
            statusEl.textContent = '🟢 Monitoring Active';
            statusEl.className = 'status active';
            if (toggleBtn) toggleBtn.textContent = 'Stop Monitoring';
          } else {
            statusEl.textContent = '🔴 Monitoring Inactive';
            statusEl.className = 'status inactive';
            if (toggleBtn) toggleBtn.textContent = 'Start Monitoring';
          }
        }
        
        // Update last updated
        if (lastUpdatedEl && response.lastUpdated) {
          const date = new Date(response.lastUpdated);
          lastUpdatedEl.textContent = 'Updated: ' + date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
        }
      }
    } catch (error) {
      console.error('Failed to get status:', error);
      // Set default values
      updateDisplay({ tabSwitches: 0, pasteEvents: 0 }, '0.00');
    }
  }
  
  function updateDisplay(counts, risk) {
    // Safely parse values
    const tabSwitches = parseInt(counts.tabSwitches) || 0;
    const pasteEvents = parseInt(counts.pasteEvents) || 0;
    const riskValue = parseFloat(risk) || 0;
    
    // Update UI
    if (tabCountEl) tabCountEl.textContent = tabSwitches;
    if (pasteCountEl) pasteCountEl.textContent = pasteEvents;
    
    if (riskLevelEl) {
      riskLevelEl.textContent = `${(riskValue * 100).toFixed(1)}%`;
      
      // Set risk color
      riskLevelEl.className = 'risk-level';
      if (riskValue > 0.7) {
        riskLevelEl.classList.add('high');
      } else if (riskValue > 0.4) {
        riskLevelEl.classList.add('medium');
      } else {
        riskLevelEl.classList.add('low');
      }
    }
  }
  
  function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'notification';
      notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s;
      `;
      document.body.appendChild(notification);
    }
    
    // Set style based on type
    if (type === 'success') {
      notification.style.background = '#28a745';
    } else if (type === 'error') {
      notification.style.background = '#dc3545';
    } else {
      notification.style.background = '#007bff';
    }
    
    notification.textContent = message;
    notification.style.opacity = '1';
    
    // Hide after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
    }, 3000);
  }
});


// manifest.json previous version code 
// {
//   "manifest_version": 3,
//   "name": "Interview Integrity Monitor",
//   "version": "1.0",
//   "description": "Detects AI-assisted behavior during interviews",
//   "permissions": [
//     "tabs",
//     "activeTab",
//     "scripting",
//     "storage"
//   ],
//   "host_permissions": [
//     "<all_urls>",
//     "http://localhost:8000/*"
//   ],
//   "background": {
//     "service_worker": "background.js",
//     "type": "module"
//   },
//   "content_scripts": [
//     {
//       "matches": ["<all_urls>"],
//       "js": ["content.js"],
//       "run_at": "document_end"
//     }
//   ],
//   "action": {
//     "default_popup": "popup.html",
//     "default_title": "Interview Monitor"
//   }
// }