const appContainer = document.querySelector(".ytmc-app");
const toleranceSlider = document.getElementById("tolerance");
const chorusDurationSlider = document.getElementById("chorusDuration");

toleranceSlider.value = localStorage.getItem("tolerance") || 0;
chorusDurationSlider.value = localStorage.getItem("chorusDuration") || 60;

let tolerance = toleranceSlider.value;
let chorusDuration = chorusDurationSlider.value;

const videoTitle = document.querySelector(".ytmc-video-title");
const prevButton = document.getElementById("prevButton");
const playPauseButton = document.getElementById("playPauseButton");
const nextButton = document.getElementById("nextButton");

const statusProgress = document.getElementById("statusProgress");

document.getElementById("toleranceValue").textContent = tolerance;
document.getElementById("chorusDurationValue").textContent = chorusDuration;

toleranceSlider.addEventListener("input", function () {
  tolerance = this.value;
  document.getElementById("toleranceValue").textContent = this.value;
  saveToLocalStorage();
});

chorusDurationSlider.addEventListener("input", function () {
  chorusDuration = this.value;
  document.getElementById("chorusDurationValue").textContent = this.value;
  saveToLocalStorage();
});

prevButton.addEventListener("click", _prev);
playPauseButton.addEventListener("click", toggle);
nextButton.addEventListener("click", _next);

playPauseButton.addEventListener("mouseover", function () {
  if (_started) return;
  appContainer.classList.add("ytmc-app-animated");
});

playPauseButton.addEventListener("mouseout", function () {
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
  sendMessage({ code: `startChorus({ tolerance: ${tolerance}, chorusDuration: ${chorusDuration} });` });
  saveToLocalStorage();
  reloadUI();
}

function _stop() {
  if (!_started) {
    return;
  }
  _started = false;
  sendMessage({ code: "stopChorus();" });
  saveToLocalStorage();
  reloadUI();
}

function _prev() {
  if (!_started) {
    return;
  }
  sendMessage({ code: "prevSong();" });
}

function _next() {
  if (!_started) {
    return;
  }
  sendMessage({ code: "nextSong();" });
}

if (chrome.action && chrome.action.isEnabled()) {
  console.log("YouTube Music Extension is active!");
  document.querySelector(".ytmc-container").style.display = "block";
  document.querySelector(".ytmc-error").style.display = "none";
  reloadUI();
} else {
  document.querySelector(".ytmc-container").style.display = "block"; // none
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
  const playPauseImage = playPauseButton.querySelector("img");
  playPauseImage.src = _started ? "../assets/pause.svg" : "../assets/play.svg";
  playPauseButton.title = _started ? "Pause" : "Play";
  playPauseImage.alt = _started ? "Pause" : "Play";
  prevButton.disabled = !_started;
  nextButton.disabled = !_started;
  // Toggle class based on _started
  if (appContainer) {
    if (_started) {
      appContainer.classList.add("ytmc-app-animated");
    } else {
      appContainer.classList.remove("ytmc-app-animated");
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log(`popup: message received: ${JSON.stringify(message)}, sender: ${sender}}`);
  console.log(message);
  if (message.action === "ytmcUpdate" && message.data) {
    const { video, isPaused, currentTime } = message.data;
    // console.log(`Playing song ${video.title}, currentTime is ${currentTime}, isPaused = ${isPaused}`);
    const title = `${video.title} • ${video.author}`
    if (videoTitle.textContent !== title) {
      videoTitle.textContent = title;
    }
  }
});