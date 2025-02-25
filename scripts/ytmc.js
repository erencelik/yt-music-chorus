let outro = false;

let playerIntervalId;
let chorusIntervelId;
let propagateIntervalId;

window._playerApi = undefined;

let options = { tolerance: 0, chorusDuration: 60 };

function play({ tolerance = 0, chorusDuration = 60 }) {
  _clearIntervals();
  if (_playerApi) {
    options.tolerance = tolerance;
    options.chorusDuration = chorusDuration;
    _playChorus({ tolerance, chorusDuration });
  } else {
    console.log("unfortunately, _playerApi is not ready yet.");
  }
}

function pause() {
  _clearIntervals();
  if (_playerApi) {
    _playerApi.pauseVideo();
    _playerApi.syncVolume();
  }
}

function prev() {
  _clearIntervals();
  if (!_playerApi) {
    return;
  }
  outro = false;
  _playerApi.setVolume(0);
  if (getCurrentTime() >= 5) {
    _playerApi.previousVideo();
    _playerApi.previousVideo();
  } else {
    _playerApi.previousVideo();
  }
  _playChorus(options);
}

function next() {
  _clearIntervals();
  if (!_playerApi) {
    return;
  }
  outro = false;
  _playerApi.setVolume(0);
  _playerApi.nextVideo();
  _playChorus(options);
}

function getVideoData() {
  return _playerApi && _playerApi.getVideoData();
}

function isPaused() {
  return _playerApi && _playerApi.getPlayerState() === 2;
}

function getCurrentTime() {
  return _playerApi && _playerApi.getCurrentTime();
}

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

  // get lyrics
  setTimeout(() => {

    let chorusStart = getCurrentTime();

    const duration = _playerApi.getDuration();

    const lyricsDom = document.querySelectorAll(".description.ytmusic-description-shelf-renderer");

    const lyricsArray = Array.from(lyricsDom).map(el => el?.innerText?.trim() || "")

    if (lyricsDom && lyricsArray && lyricsArray.length > 0) {

      const lyrics = _stripLyrics(lyricsArray[0]);

      console.log(lyrics);

      console.log(`Duration: ${duration}s`);

      const chorusFirstOccurrenceIndex = _findChorusFirstOccurrenceIndex(lyrics);

      console.log(`Chorus first occurrence index: ${chorusFirstOccurrenceIndex}`);

      const lineCount = lyrics.split("\n").length;

      console.log(`Number of lines: ${lineCount}`);

      const avgLineDuration = duration / lineCount;

      console.log(`Average duration of each line: ${avgLineDuration}s`);

      chorusStart = Math.max(0, (chorusFirstOccurrenceIndex * avgLineDuration) + tolerance);

    }

    // TODO: detect chorus timestamps...
    const chorusEnd = chorusStart + chorusDuration;

    // TODO: seek to first chorus timestamp...
    // warning: YouTube music timing calculation is different as you play playlist
    // or single song so be careful while penetrating this logic...
    // document.querySelector("video").currentTime = ?;

    _playerApi.seekTo(chorusStart);

    outro = false;
    chorusIntervelId = setInterval(() => {
      if (_playerApi && typeof _playerApi.getCurrentTime === "function") {
        if (_playerApi.getCurrentTime() > chorusEnd && !outro) {
          outro = true;
          _fadeVolume(100, 0);

          setTimeout(() => {
            clearInterval(chorusIntervelId); // ✅ Correctly clear the interval
            _playerApi.pauseVideo();
            _playerApi.nextVideo();
            _playChorus({ tolerance, chorusDuration });
          }, 2000);
        }
      } else {
        console.error("Error: _playerApi is not ready or invalid.");
        clearInterval(chorusIntervelId); // Stop the loop if _playerApi is not valid
      }
    }, 500);

    // TODO: play until end of first chorus timestamp...
    _fadeVolume(0, 100);

    _playerApi.playVideo();

    // TODO: go next...

  }, 1000);
}

function _fadeVolume(from, to, interval = 200) {
  const steps = 10;
  const val = (to - from) / steps;
  _playerApi.setVolume(from);
  // video.volume = from;
  for (let i = 0; i < steps; i++) {
    setTimeout(() => {
      // video.volume += val;
      _playerApi.setVolume(_playerApi.getVolume() + val)
    }, interval * i);
  }
}

function _stripLyrics(lyrics) {
  let lines = lyrics.split("\n").map(line => line.trim()).filter(line => line.length > 0); // Clean lines

  // Define common attribution keywords
  const attributionKeywords = ["lyric", "lyrics", "source", "provided by", "genius", "azlyrics", "metrolyrics", "musixmatch"];

  // Check if the last line contains any attribution keyword
  if (lines.length > 0) {
    let lastLine = lines[lines.length - 1].toLowerCase();
    if (attributionKeywords.some(keyword => lastLine.includes(keyword))) {
      lines.pop(); // Remove last line
    }
  }

  return lines.join("\n"); // Return cleaned lyrics
}

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

playerIntervalId = setInterval(() => {
  if (window.player) {
    _clearIntervals();
    _playerApi = window.player.playerApi;
    console.log("Player API is ready");
    if (!propagateIntervalId) {
      console.log(`No interval found for propagation, so attaching new one...`);
      propagateIntervalId = setInterval(() => {
        if (_playerApi) {
          _propagate();
        }
      }, 500);
    }
  }
}, 100);

function _clearIntervals() {
  if (playerIntervalId) {
    clearInterval(playerIntervalId);
  }
  if (chorusIntervelId) {
    clearInterval(chorusIntervelId);
  }
  // if (propagateIntervalId) {
  //   clearInterval(propagateIntervalId);
  // }
}

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