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

// Premium Interview Monitor - Popup UI
class InterviewMonitorPopup {
  constructor() {
    this.initialize();
  }

  async initialize() {
    console.log('🎯 Popup Initializing...');
    
    // Get initial status
    await this.updateStatus();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Setup real-time updates
    this.setupRealTimeUpdates();
    
    // Update UI
    this.updateUI();
    
    console.log('✅ Popup Ready');
  }

  async updateStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
      if (response) {
        this.status = response;
        this.updateUI();
      }
    } catch (error) {
      console.error('Failed to get status:', error);
      this.status = {
        tabSwitches: 0,
        pasteEvents: 0,
        isMonitoring: true,
        risk: '0.00',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  setupEventListeners() {
    // Toggle monitoring button
    document.getElementById('toggleMonitor').addEventListener('click', async () => {
      const response = await chrome.runtime.sendMessage({ type: 'TOGGLE_MONITORING' });
      if (response) {
        this.status.isMonitoring = response.isMonitoring;
        this.updateUI();
      }
    });

    // Reset button
    document.getElementById('resetCounts').addEventListener('click', async () => {
      if (confirm('Reset all counts to zero?')) {
        const response = await chrome.runtime.sendMessage({ type: 'RESET_COUNTS' });
        if (response?.success) {
          await this.updateStatus();
        }
      }
    });

    // Test backend button
    document.getElementById('testBackend').addEventListener('click', () => {
      this.testBackendConnection();
    });

    // Open dashboard button
    document.getElementById('openDashboard').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:8000/debug' });
    });

    // View details button
    document.getElementById('viewDetails').addEventListener('click', () => {
      chrome.tabs.create({ url: 'http://localhost:3000' });
    });
  }

  setupRealTimeUpdates() {
    // Listen for updates from background script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'EVENT_UPDATE') {
        this.handleEventUpdate(message);
      }
    });
  }

  handleEventUpdate(message) {
    this.status.tabSwitches = message.counts.tabSwitches;
    this.status.pasteEvents = message.counts.pasteEvents;
    this.status.risk = message.risk;
    this.status.lastUpdated = new Date().toISOString();
    
    this.updateUI();
    this.showNotification(message.eventType);
  }

  showNotification(eventType) {
    const notifications = {
      'TAB_SWITCH': 'Tab switch detected',
      'PASTE_EVENT': 'Copy-paste detected'
    };
    
    const notification = document.getElementById('notification');
    notification.textContent = notifications[eventType] || 'New event detected';
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  updateUI() {
    if (!this.status) return;

    // Update counts
    document.getElementById('tabCount').textContent = this.status.tabSwitches;
    document.getElementById('pasteCount').textContent = this.status.pasteEvents;
    
    // Update risk
    const riskElement = document.getElementById('riskLevel');
    const riskValue = parseFloat(this.status.risk);
    riskElement.textContent = `${(riskValue * 100).toFixed(0)}%`;
    riskElement.className = 'risk-level';
    
    if (riskValue > 0.7) {
      riskElement.classList.add('high');
    } else if (riskValue > 0.4) {
      riskElement.classList.add('medium');
    } else {
      riskElement.classList.add('low');
    }

    // Update monitoring status
    const toggleBtn = document.getElementById('toggleMonitor');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    
    if (this.status.isMonitoring) {
      toggleBtn.innerHTML = '<i class="icon-stop"></i> Stop Monitoring';
      toggleBtn.classList.remove('inactive');
      toggleBtn.classList.add('active');
      statusIndicator.className = 'status-indicator active';
      statusText.textContent = 'Active';
      statusText.className = 'status-text active';
    } else {
      toggleBtn.innerHTML = '<i class="icon-play"></i> Start Monitoring';
      toggleBtn.classList.remove('active');
      toggleBtn.classList.add('inactive');
      statusIndicator.className = 'status-indicator inactive';
      statusText.textContent = 'Inactive';
      statusText.className = 'status-text inactive';
    }

    // Update last updated time
    const lastUpdated = document.getElementById('lastUpdated');
    if (this.status.lastUpdated) {
      const date = new Date(this.status.lastUpdated);
      lastUpdated.textContent = `Updated: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  }

  async testBackendConnection() {
    const testBtn = document.getElementById('testBackend');
    const originalText = testBtn.innerHTML;
    
    testBtn.innerHTML = '<i class="icon-loading"></i> Testing...';
    testBtn.disabled = true;
    
    try {
      const response = await fetch('http://localhost:8000/');
      const data = await response.json();
      
      this.showToast('✅ Backend connected successfully!', 'success');
      console.log('Backend response:', data);
      
    } catch (error) {
      this.showToast('❌ Backend connection failed!', 'error');
      console.error('Backend test failed:', error);
      
    } finally {
      testBtn.innerHTML = originalText;
      testBtn.disabled = false;
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new InterviewMonitorPopup();
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