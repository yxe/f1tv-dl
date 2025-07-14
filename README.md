# f1tv-dl

A command-line utility to get video or audio from f1tv, with the option to remove vocals from audio.

Note: a valid authentication token is required. This utility is not affiliated in any way with Formula 1 or any of its subsidiaries and should only be used for personal/educational purposes. I haven't done any extensive testing, so apologies if some things are broken.

## Requirements
* Node.js
* npm

## Installation
1.  Clone the repository:
```bash
git clone https://github.com/yxe/f1tv-dl.git
cd f1tv-dl
```
2.  Install the dependencies:
```bash
npm install
```
3. *(Optional)* install keytar to store your auth token securely in your system's keychain for multiple runs:
```bash
npm install keytar
```

## Usage

### 1. Get your authentication token
1.  Open a browser (e.g., Chrome).
2.  Open **Developer Tools** (Right-click -> Inspect).
3.  Go to the **Network** tab.
4.  Log in to `https://f1tv.formula1.com/` as usual.
5.  In the list of network requests, find one named `by-password`.
6.  Click on it, and in the **Response** tab, find and copy the long string value for `subscriptionToken`.

#### 1.1 Save your token (optional)
If you installed keytar, you can save your token and run f1tv-dl without the `--token` or `-T` flag afterwards:
```bash
f1tv-dl --token "YOUR_TOKEN_HERE"
```

### 2. Run the downloader
Use the `f1tv-dl` command with the URL of the video you want to download, and your copied token. You can omit the `--token` flag if you've already saved your token.

#### 2.1 Basic download
```bash
f1tv-dl "https://f1tv.formula1.com/detail/..." --token "YOUR_TOKEN_HERE"
```

#### 2.2 Audio-only download
```bash
f1tv-dl "https://f1tv.formula1.com/detail/..." --token "YOUR_TOKEN_HERE" --audio-only
```

#### 2.3 Audio-only download and vocal removal
Downloads the original audio stream and then runs an ffmpeg filter to remove the team radio. The processed file is saved as a copy with the filename suffix `-no-vocals` in the same directory.

The below example will download the audio from Alonso's team radio in the 2022 Signapore GP, save it as `2022-singapore-grand-prix-14.m4a`, then remove the radio chatter and save this file as `2022-singapore-grand-prix-14-no-vocals.m4a`:
```bash
f1tv-dl https://f1tv.formula1.com/detail/1000005608/2022-singapore-grand-prix -c 14 -a teamradio --audio-only --remove-vocals
```


### Options
* `<url>`: The F1TV URL for the video *(required)*.
* `-T, --token`: Your manual auth token *(required if a token is not saved with keytar prior)*.
* `--audio-only`: Download only the audio stream (saved as `.m4a`).
* `--remove-vocals`: After an audio-only download, create a second file with vocals removed.
* `-c, --channel`: Select an alternate video channel (e.g., an onboard camera).
* `-a, --audio-stream`: Specify the primary audio language (e.g., `eng`, `spa`).
* `-i, --international-audio`: Add a secondary audio track from the international feed.
* `-s, --video-size`: Choose video resolution (e.g., `1920x1080`, `best`).
* `-o, --output-directory`: Specify a directory to save the file.
* `--channel-list`: List all available video/audio channels for the URL and exit.
* `--stream-url`: Print the final stream URL and exit without downloading.
* `-l, --log-level`: Set the verbosity of the log output.

## Credits
This project is a fork of the original [f1tv-dl by thedave42](https://github.com/thedave42/f1tv-dl).

This fork removes the automatic login process and replaces it with a manual token, and also allows audio-only downloads. All credit goes to the original author for the majority of the work.