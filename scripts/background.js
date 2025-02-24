// Listen for tab updates (navigation, URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && !tab.url.includes("music.youtube.com")) {
    disableExtension(tabId); // Disable extension icon on other websites
  } else {
    enableExtension(tabId); // Enable extension icon on YouTube Music
  }
});

// Also listen for when the active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url && !tab.url.includes("music.youtube.com")) {
      disableExtension(activeInfo.tabId);
    } else {
      enableExtension(activeInfo.tabId);
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log(`background: message received: ${JSON.stringify(message)}, sender: ${sender}}`);
  if (message.action === "runScript") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) return;
      const tabId = tabs[0].id;

      // Attach debugger to the tab
      chrome.debugger.attach({ tabId }, "1.3", () => {
        if (chrome.runtime.lastError) {
          console.error("Debugger attach error:", chrome.runtime.lastError.message);
          sendResponse({ result: "Debugger attach failed." });
          return;
        }

        // Execute JavaScript using Chrome DevTools Protocol
        chrome.debugger.sendCommand({ tabId }, "Runtime.evaluate", {
          expression: message.code, // JavaScript Code
          returnByValue: true
        }, (result) => {
          console.log("Execution Result:", result);
          sendResponse({ result: result.result.value || "Execution completed." });

          // Detach debugger after execution
          chrome.debugger.detach({ tabId });
        });
      });
    });

    // Required to keep `sendResponse` async
    return true;
  } else if (message.action === 'ytmcNotify') {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({ action: "ytmcUpdate", data: message.data });
    }
  }
});

function enableExtension(tabId) {
  chrome.action.enable(tabId);
  chrome.action.setIcon({ tabId: tabId, path: "../assets/icon128.png" });
}

function disableExtension(tabId) {
  chrome.action.disable(tabId);
  chrome.action.setIcon({ tabId: tabId, path: "../assets/icon_disabled128.png" });
}