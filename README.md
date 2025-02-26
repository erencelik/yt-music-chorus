<p align="center">
  <img src="assets/icon.png" alt="YT Music Chorus Icon" width="96"/>
  <img src="assets/logo.png" alt="YT Music Chorus Logo" style="display: block;" />
</p>
<hr/>

**YT Music Chorus** is a Chrome Extension that enhances your YouTube Music experience by only playing choruses then jumping to next song repeatedly.

## ⚠️ Warning

This extension uses **Chrome Developer Tools** protocol to execute scripts as Google doesn't allow executing scripts on the target context since manifest v3.

## Features

- **Chorus Detection**: Detects the chorus of a song and plays the chorus only.
- Jumps to next song after chorus is played automatically.
- Manually enabling/disabling chorus detection mode.
- Loop current song mode.
- Player controls.

## Installation

1. Clone repository:

   - ```bash
     git clone https://github.com/erencelik/yt-music-chorus.git
     ```

2. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the repository directory

## Usage

1. Open YouTube Music desktop app or website.
2. The extension will only be enabled on YouTube Music Desktop App and [YouTube Music Web](https://music.youtube.com).
3. **Tolerance** is seconds to add detected chorus timestamp. Default is 0 seconds, (min = -30, max = 30)
4. **Chorus Duration** is duration chorus. Default is 60 seconds, (min = 30, max = 90)
5. **Chorus** is mode of chorus detection. Default is true.
6. **Repeat** is loop current song. Default is false.

## Contact

For any questions or feedback, please contact me at [erencelik.xyz](https://erencelik.xyz).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
