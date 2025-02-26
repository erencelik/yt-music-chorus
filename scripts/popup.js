const appContainer = document.querySelector(".ytmc-app");
const toleranceSlider = document.getElementById("tolerance");
const chorusDurationSlider = document.getElementById("chorusDuration");
const videoTitle = document.querySelector(".ytmc-video-title");
const videoAuthor = document.querySelector(".ytmc-video-author");
const prevButton = document.getElementById("prevButton");
const playPauseButton = document.getElementById("playPauseButton");
const nextButton = document.getElementById("nextButton");
const repeatSwitch = document.getElementById("repeatSwitch");
const chorusModeSwitch = document.getElementById("chorusModeSwitch");
const durationText = document.getElementById("durationText");

let tolerance = 0;
let chorusDuration = 60;
let chorusMode = false;
let repeat = false;
let isPlaying = false;

/**
 * Toggle the play/pause state
 */
function _toggle() {
  if (isPlaying) {
    _pause();
  } else {
    _play();
  }
  _reloadUI();
}

/**
 * Play the current song
 */
function _play() {
  if (isPlaying) {
    return;
  }
  const msg = `tolerance: ${tolerance}, chorusDuration: ${chorusDuration}, chorusMode: ${chorusMode}, repeat: ${repeat}`;
  _sendMessage({ code: `play({ ${msg} });` });
  _saveToLocalStorage();
  _reloadUI();
}

/**
 * Pause the current song
 */
function _pause() {
  if (!isPlaying) {
    return;
  }
  _sendMessage({ code: "pause();" });
  _saveToLocalStorage();
  _reloadUI();
}

/**
 * Play the previous song
 */
function _prev() {
  if (!isPlaying) {
    return;
  }
  _sendMessage({ code: "prev();" });
}

/**
 * Play the next song in the YouTube Music queue
 */
function _next() {
  if (!isPlaying) {
    return;
  }
  _sendMessage({ code: "next();" });
}

/**
 * Set the options
 */
function _setOptions() {
  const msg = `tolerance: ${tolerance}, chorusDuration: ${chorusDuration}, chorusMode: ${chorusMode}, repeat: ${repeat}`;
  _sendMessage({ code: `setOptions({ ${msg} });` });
}

/**
 * Send a message to the background script
 * @param {Object} message - The message to send
 * @param {Function} callback - The callback to call when the message is received
 */
function _sendMessage({ code, callback = () => { } }) {
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
function _saveToLocalStorage() {
  localStorage.setItem("tolerance", tolerance);
  localStorage.setItem("chorusDuration", chorusDuration);
  localStorage.setItem("chorusMode", chorusMode);
  localStorage.setItem("repeat", repeat);
  localStorage.setItem("isPlaying", isPlaying);
}

/**
 * Reload the UI
 */
function _reloadUI() {
  const playPauseImage = playPauseButton.querySelector("img");
  playPauseImage.src = isPlaying ? "../assets/pause.svg" : "../assets/play.svg";
  playPauseButton.title = isPlaying ? "Pause" : "Play";
  playPauseImage.alt = isPlaying ? "Pause" : "Play";
  prevButton.disabled = !isPlaying;
  nextButton.disabled = !isPlaying;
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
function _setVersionText() {
  if (!chrome.runtime) {
    return;
  }
  const manifest = chrome.runtime.getManifest();
  document.querySelector(".ytmc-version-text").textContent = `v${manifest.version}`;
}

/**
 * Format the minutes
 * @param {number} time - The time to format
 * @returns {string} The formatted time
 */
function _formatMinutes(time) {
  return `${parseInt(time / 60).toString()}`;
}

/**
 * Format the seconds
 * @param {number} time - The time to format
 * @returns {string} The formatted time
 */
function _formatSeconds(time) {
  return `${(time % 60).toFixed().toString().padStart(2, '0')}`;
}

/**
 * Initialize the DOM
 */
function _initialize() {

  tolerance = localStorage.getItem("tolerance") || 0;
  chorusDuration = localStorage.getItem("chorusDuration") || 60;
  repeat = localStorage.getItem("repeat") === 'true';
  chorusMode = localStorage.getItem("chorusMode") === 'true';
  isPlaying = localStorage.getItem("isPlaying") === 'true';

  toleranceSlider.value = tolerance;
  chorusDurationSlider.value = chorusDuration;
  chorusModeSwitch.checked = chorusMode;
  repeatSwitch.checked = repeat;

  document.getElementById("toleranceValue").textContent = tolerance + " seconds";
  document.getElementById("chorusDurationValue").textContent = chorusDuration + " seconds";

  toleranceSlider.addEventListener("input", function () {
    tolerance = this.value;
    document.getElementById("toleranceValue").textContent = this.value + " seconds";
    _saveToLocalStorage();
  });

  chorusDurationSlider.addEventListener("input", function () {
    chorusDuration = this.value;
    document.getElementById("chorusDurationValue").textContent = this.value + " seconds";
    _saveToLocalStorage();
  });

  toleranceSlider.addEventListener("change", function () {
    _setOptions();
  });

  chorusDurationSlider.addEventListener("change", function () {
    _setOptions();
  });

  chorusModeSwitch.addEventListener("change", function () {
    chorusMode = this.checked;
    _saveToLocalStorage();
    _setOptions();
  });

  repeatSwitch.addEventListener("change", function () {
    repeat = this.checked;
    _saveToLocalStorage();
    _setOptions();
  });

  prevButton.addEventListener("click", _prev);
  playPauseButton.addEventListener("click", _toggle);
  nextButton.addEventListener("click", _next);

  playPauseButton.addEventListener("mouseover", function () {
    if (isPlaying) return;
    appContainer.classList.add("ytmc-app-animated");
  });

  playPauseButton.addEventListener("mouseout", function () {
    if (isPlaying) return;
    appContainer.classList.remove("ytmc-app-animated");
  });

  if (chrome.runtime && chrome.action && chrome.action.isEnabled()) {
    console.log("YouTube Music Extension is active!");
    document.querySelector(".ytmc-container").style.display = "block";
    document.querySelector(".ytmc-error").style.display = "none";
    const port = chrome.runtime.connect({ name: "ytmc-popup-channel" });
    port.onMessage.addListener((message) => {
      if (message.action === "ytmcUpdate" && message.data) {
        const { video, isPaused, currentTime, duration } = message.data;
        if (isPlaying === isPaused) {
          isPlaying = !isPaused;
          _reloadUI();
        }
        if (videoTitle.textContent !== video.title) {
          videoTitle.textContent = video.title;
        }
        if (videoAuthor.textContent !== video.author) {
          videoAuthor.textContent = video.author;
        }
        if (duration) {
          const currentTimeString = `${_formatMinutes(currentTime)}:${_formatSeconds(currentTime)}`;
          const durationString = `${_formatMinutes(duration)}:${_formatSeconds(duration)}`;
          durationText.style.display = "block";
          durationText.textContent = `${currentTimeString} / ${durationString}`;
        } else {
          durationText.style.display = "none";
        }
      }
    });
    _reloadUI();
  } else {
    document.querySelector(".ytmc-container").style.display = "none";
    document.querySelector(".ytmc-error").style.display = "block";
  }
  _setVersionText();
}

_initialize();