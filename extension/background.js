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

// Premium Interview Monitor - Background Script
class InterviewMonitor {
  constructor() {
    this.initialize();
  }

  async initialize() {
    // Load saved counts from storage
    const data = await this.getStorageData();
    this.tabSwitchCount = data.tabSwitchCount || 0;
    this.pasteCount = data.pasteCount || 0;
    this.isMonitoring = data.isMonitoring !== false; // Default to true
    
    console.log(`   Interview Monitor Initialized`);
    console.log(`   Tab Switches: ${this.tabSwitchCount}`);
    console.log(`   Paste Events: ${this.pasteCount}`);
    console.log(`   Monitoring: ${this.isMonitoring ? '🟢 Active' : '🔴 Inactive'}`);
    
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
      console.log(`Tab Switch #${this.tabSwitchCount}`);
      
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

    // Tab update detection (when page loads)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (!this.isMonitoring || changeInfo.status !== 'complete') return;
      // Could add page load detection here
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
      }
      
      return true;
    });

    // Keep alive for service worker
    setInterval(() => {
      // Keep service worker alive
    }, 10000);
  }

  handlePasteEvent(message, sender) {
    this.pasteCount++;
    console.log(`Paste Event #${this.pasteCount} on ${sender.tab?.url}`);
    
    this.sendEventToBackend({
      type: "PASTE_EVENT",
      timestamp: Date.now(),
      data: {
        count: this.pasteCount,
        url: sender.tab?.url,
        risk: this.calculateRisk()
      }
    });
    
    this.saveStorageData();
    this.notifyPopup('PASTE_EVENT');
  }

  async sendEventToBackend(eventData) {
    try {
      const response = await fetch("http://localhost:8000/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Event sent successfully (Risk: ${result.risk_score})`);
      }
    } catch (error) {
      console.error("❌ Failed to send event:", error);
    }
  }

  notifyPopup(eventType) {
    // Notify popup if it's open
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
    let risk = 0;
    risk += Math.min(this.tabSwitchCount * 0.03, 0.4);
    risk += Math.min(this.pasteCount * 0.05, 0.6);
    return Math.min(risk, 1).toFixed(2);
  }
}

// Initialize monitor
const monitor = new InterviewMonitor();