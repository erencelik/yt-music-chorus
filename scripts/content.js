console.log("Content script is running...");

function injectScript(file_path, tag) {
  var node = document.getElementsByTagName(tag)[0];
  var script = document.createElement('script');
  script.setAttribute('type', 'text/javascript');
  script.setAttribute('src', file_path);
  node.appendChild(script);
}

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

injectScript(chrome.runtime.getURL('scripts/ytmc.js'), 'body');