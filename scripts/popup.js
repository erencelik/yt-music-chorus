const appContainer = document.querySelector(".ytmc-app");
const toleranceSlider = document.getElementById("tolerance");
const chorusDurationSlider = document.getElementById("chorusDuration");

toleranceSlider.value = localStorage.getItem("tolerance") || 0;
chorusDurationSlider.value = localStorage.getItem("chorusDuration") || 60;

let tolerance = toleranceSlider.value;
let chorusDuration = chorusDurationSlider.value;

const startStopButton = document.getElementById("startStopButton");
const statusProgress = document.getElementById("statusProgress");

document.getElementById("toleranceValue").textContent = tolerance;
document.getElementById("chorusDurationValue").textContent = chorusDuration;

toleranceSlider.addEventListener("input", function () {
  tolerange = this.value;
  document.getElementById("toleranceValue").textContent = this.value;
  saveToLocalStorage();
});

chorusDurationSlider.addEventListener("input", function () {
  chorusDuration = this.value;
  document.getElementById("chorusDurationValue").textContent = this.value;
  saveToLocalStorage();
});

startStopButton.addEventListener("click", toggle);

startStopButton.addEventListener("mouseover", function () {
  if (_started) return;
  appContainer.classList.add("ytmc-app-animated");
});

startStopButton.addEventListener("mouseout", function () {
  if (_started) return;
  appContainer.classList.remove("ytmc-app-animated");
});

let _started = localStorage.getItem("started") === 'true';

function toggle() {
  if (_started) {
    _stop();
  } else {
    _start();
  }
  reloadUI();
}

function _start() {
  if (_started) {
    return;
  }
  _started = true;
  sendMessage({ code: `_startChorus({ tolerance: ${tolerance}, chorusDuration: ${chorusDuration} });` });
  saveToLocalStorage();
  reloadUI();
}

function _stop() {
  if (!_started) {
    return;
  }
  _started = false;
  sendMessage({ code: "_stopChorus();" });
  saveToLocalStorage();
  reloadUI();
}

if (chrome.action && chrome.action.isEnabled()) {
  console.log("YouTube Music Extension is active!");
  document.querySelector(".ytmc-container").style.display = "block";
  document.querySelector(".ytmc-error").style.display = "none";
  reloadUI();
} else {
  document.querySelector(".ytmc-container").style.display = "none"; // none
  document.querySelector(".ytmc-error").style.display = "block";
}

function sendMessage({ code, callback = () => { } }) {
  chrome.runtime.sendMessage({ action: "runScript", code: code }, (response) => {
    if (response) {
      console.log(JSON.stringify(response));
      if (response.result) {
        callback(response.result);
      }
    }
  });
}

function saveToLocalStorage() {
  localStorage.setItem("tolerance", tolerance);
  localStorage.setItem("chorusDuration", chorusDuration);
  localStorage.setItem("started", _started);
}

function reloadUI() {
  toleranceSlider.disabled = _started;
  chorusDurationSlider.disabled = _started;
  startStopButton.textContent = _started ? "Stop Playing" : "Start Playing";
  // Toggle class based on _started
  if (appContainer) {
    if (_started) {
      appContainer.classList.add("ytmc-app-animated");
      startStopButton.classList.add("ytmc-button-animated");
    } else {
      appContainer.classList.remove("ytmc-app-animated");
      startStopButton.classList.remove("ytmc-button-animated");
    }
  }
}