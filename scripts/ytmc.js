window._playerApi = undefined;

// Define common attribution keywords
const _attributionKeywords = ["lyric", "lyrics", "source", "provided by", "genius", "azlyrics", "metrolyrics", "musixmatch"];

let _playerIntervalId;
let _chorusIntervalId;
let _propagateIntervalId;

let _jumping = false;

let _options = { tolerance: 0, chorusDuration: 60 };

/**
 * Play the current song
 * @param {Object} options - The options for the chorus
 */
function play({ tolerance = 0, chorusDuration = 60 }) {
  _clearIntervals();
  if (_playerApi) {
    _options.tolerance = tolerance;
    _options.chorusDuration = chorusDuration;
    _playChorus(_options);
  } else {
    console.log("unfortunately, _playerApi is not ready yet.");
  }
}

/**
 * Pause the current song
 */
function pause() {
  _clearIntervals();
  if (_playerApi) {
    _playerApi.pauseVideo();
    _playerApi.syncVolume();
  }
}

/**
 * Play the previous song
 */
function prev() {
  _clearIntervals();
  if (!_playerApi) {
    return;
  }
  _jumping = false;
  _playerApi.setVolume(0);
  if (getCurrentTime() >= 5) {
    _playerApi.previousVideo();
    _playerApi.previousVideo();
  } else {
    _playerApi.previousVideo();
  }
  _playChorus(_options);
}

/**
 * Play the next song
 */
function next() {
  _clearIntervals();
  if (!_playerApi) {
    return;
  }
  _jumping = false;
  _playerApi.setVolume(0);
  _playerApi.nextVideo();
  _playChorus(_options);
}

/**
 * Get the video data
 * @returns {Object} The video data
 */
function getVideoData() {
  return _playerApi && _playerApi.getVideoData();
}

/**
 * Check if the player is paused
 * @returns {boolean} True if the player is paused, false otherwise
 */
function isPaused() {
  return _playerApi && _playerApi.getPlayerState() === 2;
}

/**
 * Get the current time of the player
 * @returns {number} The current time of the player
 */
function getCurrentTime() {
  return _playerApi && _playerApi.getCurrentTime();
}

/**
 * Play the chorus
 * @param {Object} options - The options for the chorus
 */
function _playChorus({ tolerance = 0, chorusDuration = 60 }) {
  if (!_playerApi) {
    console.log("Error: _playerApi is not ready or invalid.");
    return;
  }

  console.log("playing chorus...");

  _started = true;
  console.log(`Tolerance: ${tolerance}, Chorus Duration: ${chorusDuration}`);
  _playerApi.pauseVideo();

  // load lyrics by clicking it
  document.querySelector("#tabsContent > tp-yt-paper-tab:nth-child(3)").click();

  // get lyrics and calculate timestamps then seek to chorus start
  setTimeout(() => {

    const currentTime = getCurrentTime();

    let chorusTimestamps = { chorusStart: currentTime, chorusEnd: currentTime + chorusDuration };

    const duration = _playerApi.getDuration();

    const lyricsDom = document.querySelectorAll(".description.ytmusic-description-shelf-renderer");

    const lyricsArray = Array.from(lyricsDom).map(el => el?.innerText?.trim() || "")

    if (lyricsDom && lyricsArray && lyricsArray.length > 0) {

      const lyrics = _stripLyrics(lyricsArray[0]);

      console.log(lyrics);

      console.log(`Duration: ${duration}s`);

      chorusTimestamps = _calculateChorusTimestamps(lyrics, duration, tolerance, chorusDuration);

    }

    _playerApi.seekTo(chorusTimestamps.chorusStart);

    _jumping = false;
    _chorusIntervalId = setInterval(() => {
      const currentTime = _playerApi.getCurrentTime();
      if (currentTime && currentTime > chorusTimestamps.chorusEnd && !_jumping) {
        _jumping = true;
        _fadeVolume(100, 0);
        setTimeout(() => {
          clearInterval(_chorusIntervalId);
          _playerApi.pauseVideo();
          _playerApi.nextVideo();
          _playChorus(_options);
        }, 2000);
      }
    }, 500);

    _playerApi.playVideo();
    _fadeVolume(0, 100);

  }, 1000);
}

/**
 * Calculate the timestamp where the first chorus likely starts
 * @param {string} lyrics - The full lyrics text
 * @param {number} duration - Total duration of the song
 * @param {number} tolerance - The tolerance for the chorus
 * @param {number} chorusDuration - The duration of the chorus
 * @returns {Object} The calculated start and end times in seconds
 */
function _calculateChorusTimestamps(lyrics, duration, tolerance, chorusDuration) {
  const lines = lyrics.split("\n");
  const lineCount = lines.length;
  const avgLineDuration = duration / lineCount;
  const chorusFirstOccurrenceIndex = _findChorusFirstOccurrenceIndex(lyrics);

  console.log(`Chorus first occurrence index: ${chorusFirstOccurrenceIndex}`);
  console.log(`Number of lines: ${lineCount}`);
  console.log(`Average duration of each line: ${avgLineDuration}s`);

  let chorusStart = 0;
  let chorusEnd = 0;

  // Calculate chorus start timestamp based on lyrics analysis
  if (chorusFirstOccurrenceIndex >= 0) {
    // Base calculation using line timing
    chorusStart = Math.max(0, (chorusFirstOccurrenceIndex * avgLineDuration));
    // Check if calculated chorus start time is outside typical range
    if (chorusStart < duration * 0.2 || chorusStart > duration * 0.6) {
      chorusStart = duration * 0.25; // Use 25% mark as fallback
      console.log(`Chorus timing outside typical range, using fallback start time: ${chorusStart}s`);
    }
  } else {
    // Fallback if no chorus detected - try typical timing
    chorusStart = duration * 0.25; // Often starts ~25% into song
    console.log(`No chorus detected, using fallback start time: ${chorusStart}s`);
  }

  chorusStart += tolerance;

  console.log(`Calculated chorus start time: ${chorusStart}s`);

  chorusEnd = chorusStart + chorusDuration;

  return { chorusStart, chorusEnd };
}

/**
 * Fade the volume of the player
 * @param {number} from - The starting volume
 * @param {number} to - The ending volume
 * @param {number} interval - The interval between steps
 */
function _fadeVolume(from, to, interval = 200) {
  const steps = 10;
  const val = (to - from) / steps;
  _playerApi.setVolume(from);
  let volume = from;
  for (let i = 0; i < steps; i++) {
    setTimeout(() => {
      volume += val;
      _playerApi.setVolume(volume);
    }, interval * i);
  }
}

/**
 * Strip the lyrics of any attribution keywords
 * @param {string} lyrics - The full lyrics text
 * @returns {string} The cleaned lyrics
 */
function _stripLyrics(lyrics) {
  let lines = lyrics.split("\n").map(line => line.trim()).filter(line => line.length > 0); // Clean lines

  // Check if the last line contains any attribution keyword
  if (lines.length > 0) {
    let lastLine = lines[lines.length - 1].toLowerCase();
    if (_attributionKeywords.some(keyword => lastLine.includes(keyword))) {
      lines.pop(); // Remove last line
    }
  }

  return lines.join("\n"); // Return cleaned lyrics
}

/**
 * Find the first occurrence index of the most repeated line
 * @param {string} lyrics - The full lyrics text
 * @returns {number} The first occurrence index of the most repeated line
 */
function _findChorusFirstOccurrenceIndex(lyrics) {
  const lines = lyrics.split("\n").map(line => line.trim()).filter(line => line.length > 0); // Clean lines
  const lineCounts = new Map(); // Count occurrences
  const firstOccurrence = new Map(); // Store first occurrence index
  const secondOccurence = new Map(); // Store seconds to fallback

  // Count occurrences and track first appearance
  for (let i = 0; i < lines.length; i++) {
    if (!firstOccurrence.has(lines[i])) {
      firstOccurrence.set(lines[i], i); // Store first occurrence index
    } else {
      if (!secondOccurence.has(lines[i])) {
        secondOccurence.set(lines[i], i); // Store second occurrence index
      }
    }
    lineCounts.set(lines[i], (lineCounts.get(lines[i]) || 0) + 1);
  }

  // Find the most repeated line
  let mostRepeatedLine = null;
  let maxCount = 0;

  for (const [line, count] of lineCounts) {
    if (count > maxCount) {
      mostRepeatedLine = line;
      maxCount = count;
    }
  }

  // Return the first occurrence index of the most repeated line
  const firstOccurrenceIndex = mostRepeatedLine ? firstOccurrence.get(mostRepeatedLine) : -1;
  let index = firstOccurrenceIndex

  if (mostRepeatedLine) {
    index = firstOccurrence.get(mostRepeatedLine);
  }

  if (index == 0 && mostRepeatedLine) {
    index = secondOccurence.get(mostRepeatedLine);
  }

  if (index <= 0) {
    index = firstOccurrenceIndex;
  }

  return index;
}

/**
 * Initialize the player API
 */
_playerIntervalId = setInterval(() => {
  if (window.player) {
    _clearIntervals();
    _playerApi = window.player.playerApi;
    console.log("Player API is ready");
    if (!_propagateIntervalId) {
      console.log(`No interval found for propagation, so attaching new one...`);
      _propagateIntervalId = setInterval(() => {
        if (_playerApi) {
          _propagate();
        }
      }, 500);
    }
  }
}, 100);

/**
 * Clear the intervals
 */
function _clearIntervals() {
  if (_playerIntervalId) {
    clearInterval(_playerIntervalId);
  }
  if (_chorusIntervalId) {
    clearInterval(_chorusIntervalId);
  }
  // if (_propagateIntervalId) {
  //   clearInterval(_propagateIntervalId);
  // }
}

/**
 * Propagate the player data
 */
function _propagate() {
  const videoData = getVideoData();
  if (videoData) {
    const data = {
      video: videoData,
      isPaused: isPaused(),
      currentTime: getCurrentTime()
    }
    const msg = { from: "ytmc", value: data };
    // console.log(`sending message ${JSON.stringify(msg)}`);
    window.postMessage(msg, "*");
  }
}