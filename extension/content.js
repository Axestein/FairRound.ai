// // Detect copy-paste events
// // Detect paste events
// document.addEventListener('paste', (e) => {
//   console.log("Paste detected on page:", window.location.href);
  
//   chrome.runtime.sendMessage({
//     type: "PASTE_EVENT",
//     url: window.location.href
//   }).catch(error => {
//     console.log("Could not send paste event (popup might be closed):", error);
//   });
// });

// console.log("Content script loaded on:", window.location.href);

// // Detect typing patterns
// let lastKeyTime = Date.now();
// let keystrokeIntervals = [];

// document.addEventListener('keydown', (e) => {
//   const now = Date.now();
//   const interval = now - lastKeyTime;
//   lastKeyTime = now;

//   keystrokeIntervals.push(interval);
  
//   if (keystrokeIntervals.length > 10) {
//     chrome.runtime.sendMessage({
//       type: "KEYSTROKE",
//       intervals: keystrokeIntervals,
//       timestamp: now
//     });
//     keystrokeIntervals = [];
//   }
// });

// // Detect focus changes
// window.addEventListener('blur', () => {
//   chrome.runtime.sendMessage({
//     type: "WINDOW_BLUR",
//     timestamp: Date.now()
//   });
// });

// window.addEventListener('focus', () => {
//   chrome.runtime.sendMessage({
//     type: "WINDOW_FOCUS",
//     timestamp: Date.now()
//   });
// });

// Simple content script for paste detection
console.log('🔍 Interview Monitor - Content Script Active');

// Listen for paste events
document.addEventListener('paste', (event) => {
    console.log('📋 Paste detected on:', window.location.href);
    
    // Send message to background script
    chrome.runtime.sendMessage({
        type: 'PASTE_EVENT',
        url: window.location.href,
        timestamp: Date.now()
    }).catch(error => {
        // Background script might not be ready, that's ok
        console.log('Note: Could not send paste event (background might be sleeping)');
    });
});

// Optional: Detect other behaviors
document.addEventListener('copy', (event) => {
    // Could also track copy events
});

console.log('✅ Content script loaded successfully');