console.log("Content script is running...");

/**
 * Inject a script into the document
 * @param {string} file_path - The path to the script to inject
 * @param {string} tag - The tag to inject the script into
 */
function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

// Listen for messages from the background script
window.addEventListener("message", (event) => {
  if (!chrome || !chrome.runtime || !chrome.runtime?.id) {
    return;
  }
  if (event && event.data) {
    if (event.data.from === 'ytmc' && event.data.value) {
      // console.log(`event: ${JSON.stringify(event.data)}`);
      chrome.runtime.sendMessage({ action: "ytmcNotify", data: event.data.value });
    }
  }
});

/**
 * Inject the ytmc script into the document
 */
injectScript(chrome.runtime.getURL('scripts/ytmc.js'), 'body');