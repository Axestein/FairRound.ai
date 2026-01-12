// // Simple background script
// let tabSwitchCount = 0;
// let pasteCount = 0;

// // Listen for tab switches
// chrome.tabs.onActivated.addListener((activeInfo) => {
//   tabSwitchCount++;
//   console.log(`Tab switched! Total: ${tabSwitchCount}`);
  
//   sendEventToBackend({
//     type: "TAB_SWITCH",
//     timestamp: Date.now(),
//     data: {
//       count: tabSwitchCount,
//       tabId: activeInfo.tabId
//     }
//   });
  
//   updatePopup();
// });

// // Listen for messages from content script
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Background received:", message);
  
//   if (message.type === "PASTE_EVENT") {
//     pasteCount++;
//     console.log(`Paste detected! Total: ${pasteCount}`);
    
//     sendEventToBackend({
//       type: "PASTE_EVENT",
//       timestamp: Date.now(),
//       data: {
//         count: pasteCount,
//         url: sender.tab?.url
//       }
//     });
    
//     updatePopup();
//   }
  
//   sendResponse({ received: true });
//   return true;
// });

// // Send event to backend
// async function sendEventToBackend(eventData) {
//   try {
//     console.log("Sending to backend:", eventData);
    
//     const response = await fetch("http://localhost:8000/api/events", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify(eventData)
//     });
    
//     if (response.ok) {
//       const result = await response.json();
//       console.log("Backend response:", result);
//     } else {
//       console.error("Backend error:", response.status);
//     }
//   } catch (error) {
//     console.error("Failed to send to backend:", error);
//   }
// }

// // Update popup with current counts
// function updatePopup() {
//   // Send message to popup if it's open
//   try {
//     chrome.runtime.sendMessage({
//       type: "UPDATE_COUNTS",
//       tabSwitches: tabSwitchCount,
//       pasteEvents: pasteCount
//     });
//   } catch (e) {
//     // Popup not open, that's fine
//   }
// }

// // Provide counts when popup asks
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "GET_COUNTS") {
//     sendResponse({
//       tabSwitches: tabSwitchCount,
//       pasteEvents: pasteCount
//     });
//   }
//   return true;
// });

// console.log("Background script loaded!");
// Production API URL - UPDATE THIS WITH YOUR ACTUAL BACKEND URL
const API_BASE_URL = 'https://ai-interview-monitor-backend.onrender.com';

class InterviewMonitor {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Load saved counts
    const data = await this.getStorageData();
    this.tabSwitchCount = data.tabSwitchCount || 0;
    this.pasteCount = data.pasteCount || 0;
    this.isMonitoring = data.isMonitoring !== false;
    
    console.log(`🎯 Interview Monitor Initialized`);
    console.log(`🔗 Backend: ${API_BASE_URL}`);
    
    this.setupListeners();
  }

  async getStorageData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        ['tabSwitchCount', 'pasteCount', 'isMonitoring'],
        (result) => resolve(result || {})
      );
    });
  }

  async saveStorageData() {
    await chrome.storage.local.set({
      tabSwitchCount: this.tabSwitchCount,
      pasteCount: this.pasteCount,
      isMonitoring: this.isMonitoring
    });
  }

  setupListeners() {
    // Tab switch detection
    chrome.tabs.onActivated.addListener((activeInfo) => {
      if (!this.isMonitoring) return;
      
      this.tabSwitchCount++;
      console.log(`🔄 Tab Switch #${this.tabSwitchCount}`);
      
      this.sendEventToBackend({
        type: "TAB_SWITCH",
        timestamp: Date.now(),
        data: {
          count: this.tabSwitchCount,
          tabId: activeInfo.tabId,
          risk: this.calculateRisk()
        }
      });
      
      this.saveStorageData();
      this.notifyPopup('TAB_SWITCH');
    });

    // Message listener from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!this.isMonitoring) {
        sendResponse({ status: 'monitoring_inactive' });
        return true;
      }

      switch (message.type) {
        case 'PASTE_EVENT':
          this.handlePasteEvent(message, sender);
          break;
        
        case 'GET_STATUS':
          sendResponse(this.getStatus());
          break;
        
        case 'TOGGLE_MONITORING':
          this.toggleMonitoring();
          sendResponse({ isMonitoring: this.isMonitoring });
          break;
        
        case 'RESET_COUNTS':
          this.resetCounts();
          sendResponse({ success: true });
          break;
        
        case 'TEST_CONNECTION':
          this.testConnection().then(result => {
            sendResponse(result);
          });
          return true; // Keep channel open for async
      }
      
      sendResponse({ received: true });
      return true;
    });
  }

  handlePasteEvent(message, sender) {
    this.pasteCount++;
    console.log(`📋 Paste Event #${this.pasteCount}`);
    
    this.sendEventToBackend({
      type: "PASTE_EVENT",
      timestamp: Date.now(),
      data: {
        count: this.pasteCount,
        url: sender.tab?.url || 'unknown',
        risk: this.calculateRisk()
      }
    });
    
    this.saveStorageData();
    this.notifyPopup('PASTE_EVENT');
  }

  async sendEventToBackend(eventData) {
    try {
      console.log(`📤 Sending to ${API_BASE_URL}/api/events`);
      
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Event sent (Risk: ${result.risk_score})`);
        return result;
      } else {
        console.error(`❌ Backend error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(`Error details: ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      // Store locally for later sync
      this.storeEventLocally(eventData);
    }
  }

  storeEventLocally(eventData) {
    // Store events locally if backend is down
    chrome.storage.local.get(['pendingEvents'], (result) => {
      const pendingEvents = result.pendingEvents || [];
      pendingEvents.push({
        ...eventData,
        timestamp: Date.now()
      });
      
      chrome.storage.local.set({ pendingEvents }, () => {
        console.log(`📦 Event stored locally (${pendingEvents.length} pending)`);
      });
    });
  }

  async testConnection() {
    try {
      console.log(`🧪 Testing connection to ${API_BASE_URL}`);
      
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `✅ Connected to backend\nStatus: ${data.status}`,
          data 
        };
      } else {
        return { 
          success: false, 
          message: `❌ Backend error: ${response.status}` 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `❌ Network error: ${error.message}` 
      };
    }
  }

  notifyPopup(eventType) {
    chrome.runtime.sendMessage({
      type: 'EVENT_UPDATE',
      eventType,
      counts: {
        tabSwitches: this.tabSwitchCount,
        pasteEvents: this.pasteCount
      },
      risk: this.calculateRisk()
    }).catch(() => {
      // Popup not open, that's fine
    });
  }

  getStatus() {
    return {
      tabSwitches: this.tabSwitchCount,
      pasteEvents: this.pasteCount,
      isMonitoring: this.isMonitoring,
      risk: this.calculateRisk(),
      backendUrl: API_BASE_URL,
      lastUpdated: new Date().toISOString()
    };
  }

  toggleMonitoring() {
    this.isMonitoring = !this.isMonitoring;
    this.saveStorageData();
    console.log(`Monitoring ${this.isMonitoring ? '🟢 Started' : '🔴 Stopped'}`);
    return this.isMonitoring;
  }

  resetCounts() {
    this.tabSwitchCount = 0;
    this.pasteCount = 0;
    this.saveStorageData();
    console.log('🧹 Counts reset to zero');
  }

  calculateRisk() {
    if (this.tabSwitchCount === 0 && this.pasteCount === 0) {
      return '0.00';
    }
    
    let risk = 0;
    risk += Math.min(this.tabSwitchCount * 0.03, 0.4);
    risk += Math.min(this.pasteCount * 0.05, 0.6);
    return Math.min(risk, 1).toFixed(2);
  }
}

// Initialize
const monitor = new InterviewMonitor();