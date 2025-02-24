const box = document.querySelector(".box");
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
  box.classList.add("box-animated");
});

startStopButton.addEventListener("mouseout", function () {
  if (_started) return;
  box.classList.remove("box-animated");
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
  sendMessage(`_startChorus({ tolerance: ${tolerance}, chorusDuration: ${chorusDuration} });`);
  saveToLocalStorage();
  reloadUI();
}

function _stop() {
  if (!_started) {
    return;
  }
  _started = false;
  sendMessage("_stopChorus();");
  saveToLocalStorage();
  reloadUI();
}

if (chrome.action && chrome.action.isEnabled()) {
  console.log("YouTube Music Extension is active!");
  document.querySelector(".ytmc-container").style.display = "block";
  document.querySelector(".ytmc-error").style.display = "none";
  reloadUI();
} else {
  document.querySelector(".ytmc-container").style.display = "block";
  document.querySelector(".ytmc-error").style.display = "block";
}

function sendMessage(code) {
  chrome.runtime.sendMessage({ action: "runScript", code: code }, (response) => {
    console.log(response.result);
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
  if (box) {
    if (_started) {
      box.classList.add("box-animated");
      startStopButton.classList.add("button-animated");
    } else {
      box.classList.remove("box-animated");
      startStopButton.classList.remove("button-animated");
    }
  }
}