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

document.getElementById("toleranceValue").textContent = tolerance + " seconds";
document.getElementById("chorusDurationValue").textContent = chorusDuration + " seconds";

toleranceSlider.addEventListener("input", function () {
  tolerance = this.value;
  document.getElementById("toleranceValue").textContent = this.value + " seconds";
  saveToLocalStorage();
});

chorusDurationSlider.addEventListener("input", function () {
  chorusDuration = this.value;
  document.getElementById("chorusDurationValue").textContent = this.value + " seconds";
  saveToLocalStorage();
});

prevButton.addEventListener("click", _prev);
playPauseButton.addEventListener("click", toggle);
nextButton.addEventListener("click", _next);

playPauseButton.addEventListener("mouseover", function () {
  if (isPlaying) return;
  appContainer.classList.add("ytmc-app-animated");
});

playPauseButton.addEventListener("mouseout", function () {
  if (isPlaying) return;
  appContainer.classList.remove("ytmc-app-animated");
});

let isPlaying = localStorage.getItem("isPlaying") === 'true';

function toggle() {
  if (isPlaying) {
    _pause();
  } else {
    _play();
  }
  reloadUI();
}

function _play() {
  if (isPlaying) {
    return;
  }
  sendMessage({ code: `play({ tolerance: ${tolerance}, chorusDuration: ${chorusDuration} });` });
  saveToLocalStorage();
  reloadUI();
}

function _pause() {
  if (!isPlaying) {
    return;
  }
  sendMessage({ code: "pause();" });
  saveToLocalStorage();
  reloadUI();
}

function _prev() {
  if (!isPlaying) {
    return;
  }
  sendMessage({ code: "prev();" });
}

function _next() {
  if (!isPlaying) {
    return;
  }
  sendMessage({ code: "next();" });
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
  localStorage.setItem("isPlaying", isPlaying);
}

function reloadUI() {
  toleranceSlider.disabled = isPlaying;
  chorusDurationSlider.disabled = isPlaying;
  const playPauseImage = playPauseButton.querySelector("img");
  playPauseImage.src = isPlaying ? "../assets/pause.svg" : "../assets/play.svg";
  playPauseButton.title = isPlaying ? "Pause" : "Play";
  playPauseImage.alt = isPlaying ? "Pause" : "Play";
  prevButton.disabled = !isPlaying;
  nextButton.disabled = !isPlaying;
  // Toggle class based on isPlaying
  if (appContainer) {
    if (isPlaying) {
      appContainer.classList.add("ytmc-app-animated");
    } else {
      appContainer.classList.remove("ytmc-app-animated");
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // console.log(`popup: message received: ${JSON.stringify(message)}, sender: ${sender}}`);
  // console.log(message);
  if (message.action === "ytmcUpdate" && message.data) {
    const { video, isPaused, currentTime } = message.data;
    if (isPlaying === isPaused) {
      isPlaying = !isPaused;
      reloadUI();
    }
    // console.log(`Playing song ${video.title}, currentTime is ${currentTime}, isPaused = ${isPaused}`);
    const title = `${video.title} • ${video.author}`
    if (videoTitle.textContent !== title) {
      videoTitle.textContent = title;
    }
  }
});