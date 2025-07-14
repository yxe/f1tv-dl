# f1tv-dl

A command-line utility to get video or audio from f1tv.

Note: a valid authentication token is required. This utility is not affiliated in any way with Formula 1 or any of its subsidiaries and should only be used for personal/educational purposes. I haven't done any extensive testing, so apologies if some things are broken.

## Requirements
* Node.js
* npm

## Installation
1.  Clone the repository.
2.  Install the dependencies:
    ```bash
    npm install
    ```

## Usage

### 1. Get your authentication token

1.  Open a browser (e.g., Chrome).
2.  Open **Developer Tools** (Right-click -> Inspect).
3.  Go to the **Network** tab.
4.  Log in to `https://f1tv.formula1.com/` as usual.
5.  In the list of network requests, find one named `by-password`.
6.  Click on it, and in the **Response** tab, find and copy the long string value for `subscriptionToken`.

### 2. Run the downloader
Use the `f1tv-dl` command with the URL of the video you want to download and your copied token.

**Basic download:**
```bash
f1tv-dl "[https://f1tv.formula1.com/detail/](https://f1tv.formula1.com/detail/)..." --token "YOUR_TOKEN_HERE"
```

**Audio-only download:**
```bash
f1tv-dl "[https://f1tv.formula1.com/detail/](https://f1tv.formula1.com/detail/)..." --token "YOUR_TOKEN_HERE" --audio-only
```

### Options
* `<url>`: The F1TV URL for the video (Required).
* `-T, --token`: Your manual entitlement token (Required).
* `--audio-only`: Download only the audio stream (saved as `.m4a`).
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