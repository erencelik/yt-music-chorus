const appContainer = document.querySelector(".ytmc-app");
const toleranceSlider = document.getElementById("tolerance");
const chorusDurationSlider = document.getElementById("chorusDuration");
const videoTitle = document.querySelector(".ytmc-video-title");
const prevButton = document.getElementById("prevButton");
const playPauseButton = document.getElementById("playPauseButton");
const nextButton = document.getElementById("nextButton");

let tolerance = 0;
let chorusDuration = 60;

let isPlaying = false;

/**
 * Toggle the play/pause state
 */
function toggle() {
  if (isPlaying) {
    _pause();
  } else {
    _play();
  }
  reloadUI();
}

/**
 * Play the current song
 */
function _play() {
  if (isPlaying) {
    return;
  }
  sendMessage({ code: `play({ tolerance: ${tolerance}, chorusDuration: ${chorusDuration} });` });
  saveToLocalStorage();
  reloadUI();
}

/**
 * Pause the current song
 */
function _pause() {
  if (!isPlaying) {
    return;
  }
  sendMessage({ code: "pause();" });
  saveToLocalStorage();
  reloadUI();
}

/**
 * Play the previous song
 */
function _prev() {
  if (!isPlaying) {
    return;
  }
  sendMessage({ code: "prev();" });
}

/**
 * Play the next song in the YouTube Music queue
 */
function _next() {
  if (!isPlaying) {
    return;
  }
  sendMessage({ code: "next();" });
}

/**
 * Send a message to the background script
 * @param {Object} message - The message to send
 * @param {Function} callback - The callback to call when the message is received
 */
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

/**
 * Save the current state to local storage
 */
function saveToLocalStorage() {
  localStorage.setItem("tolerance", tolerance);
  localStorage.setItem("chorusDuration", chorusDuration);
  localStorage.setItem("isPlaying", isPlaying);
}

/**
 * Reload the UI
 */
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

/**
 * Set the version text
 */
function setVersionText() {
  if (!chrome.runtime) {
    return;
  }
  const manifest = chrome.runtime.getManifest();
  document.querySelector(".ytmc-version-text").textContent = `v${manifest.version}`;
}

/**
 * Initialize the DOM
 */
function _initialize() {

  let tolerance = localStorage.getItem("tolerance") || 0;
  let chorusDuration = localStorage.getItem("chorusDuration") || 60;

  toleranceSlider.value = tolerance;
  chorusDurationSlider.value = chorusDuration;

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

  isPlaying = localStorage.getItem("isPlaying") === 'true';

  if (chrome.runtime && chrome.action && chrome.action.isEnabled()) {
    console.log("YouTube Music Extension is active!");
    document.querySelector(".ytmc-container").style.display = "block";
    document.querySelector(".ytmc-error").style.display = "none";
    const port = chrome.runtime.connect({ name: "ytmc-popup-channel" });
    port.onMessage.addListener((message) => {
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
    reloadUI();
  } else {
    document.querySelector(".ytmc-container").style.display = "none";
    document.querySelector(".ytmc-error").style.display = "block";
  }
  setVersionText();
}

_initialize();