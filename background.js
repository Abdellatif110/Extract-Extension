// Store the extracted data by Tab ID
const extractedDataMap = new Map();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "EXTRACTED_DATA" && sender.tab) {
    const tabId = sender.tab.id;
    extractedDataMap.set(tabId, message.payload);
    console.log(`Data updated for tab ${tabId}:`, message.payload);

    // Optionally update badge
    const count = (message.payload.emails.length + message.payload.phones.length + Object.values(message.payload.socialMedia).flat().length);
    if (count > 0) {
      chrome.action.setBadgeText({ tabId: tabId, text: count.toString() });
    } else {
      chrome.action.setBadgeText({ tabId: tabId, text: "" });
    }
  }
});

// Clean up when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  if (extractedDataMap.has(tabId)) {
    extractedDataMap.delete(tabId);
  }
});

// Handle popup requests for data
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    port.onMessage.addListener(async (msg) => {
      if (msg.type === "GET_DATA") {
        // Get the active tab in the current window
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && extractedDataMap.has(tab.id)) {
          port.postMessage({ type: "DATA", data: extractedDataMap.get(tab.id) });
        } else {
          port.postMessage({ type: "DATA", data: null });
        }
      }
    });
  }
});