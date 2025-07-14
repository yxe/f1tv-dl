#!/usr/bin/env node
const config = require('./lib/config');
const yargs = require('yargs');
const log = require('loglevel');
const util = require('util');
const { spawn } = require('child_process');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

const { isF1tvUrl, isRace } = require('./lib/f1tv-validator');
const { getContentInfo, getContentStreamUrl, getAdditionalStreamsInfo, getContentParams, getProgramStreamId } = require('./lib/f1tv-api');

const getTokenizedUrl = async (url, content, channel) => {
    let f1tvUrl;
    log.debug(JSON.stringify(content.metadata, 2, 4));
    if (content.metadata.additionalStreams == null) {
        f1tvUrl = await getContentStreamUrl(content.id);
    } else {
        if (isRace(content) && channel == null)
            channel = "F1 LIVE";
        const stream = getAdditionalStreamsInfo(content.metadata.additionalStreams, channel);
        const channelId = (stream.playbackUrl !== null && stream.playbackUrl.indexOf('channelId') == -1) ? null : stream.channelId;
        f1tvUrl = await getContentStreamUrl(content.id, channelId);
    }
    return f1tvUrl;
};

(async () => {
    try {
        const {
            url,
            token,
            channel,
            channelList,
            audioOnly,
            internationalAudio,
            itsoffset,
            audioStream,
            videoSize,
            format,
            outputDirectory: outputDir,
            streamUrl,
            logLevel
        } = yargs
            .command('$0 <url>', 'Download a video from F1TV using a manual token.', (yarg) => {
                yarg
                    .positional('url', {
                        type: 'string',
                        desc: 'The F1TV URL for the video',
                        coerce: (urlStr) => {
                            if (isF1tvUrl(urlStr)) return urlStr;
                            throw new Error('Not a valid F1TV video page URL.');
                        }
                    })
                    .option('token', {
                        type: 'string',
                        desc: 'Manually provide the auth token.',
                        alias: 'T',
                        demandOption: true
                    })
                    .option('audio-only', {
                        type: 'boolean',
                        desc: 'Download only the audio stream.',
                        default: false
                    })
                    .option('channel', {
                        type: 'string',
                        desc: 'Choose an alternate channel (e.g., "Lewis Hamilton").',
                        default: null,
                        alias: 'c'
                    })
                    .option('international-audio', {
                        type: 'string',
                        desc: 'Include a secondary audio track from the "INTERNATIONAL" feed.',
                        choices: ['eng', 'nld', 'deu', 'fra', 'por', 'spa', 'fx'],
                        alias: 'i'
                    })
                    .option('itsoffset', {
                        type: 'string',
                        desc: 'Time offset to sync secondary audio as \'(-)hh:mm:ss.SSS\'',
                        alias: 't',
                        default: '-00:00:04.750'
                    })
                    .option('audio-stream', {
                        type: 'string',
                        desc: 'Specify primary audio stream language.',
                        default: 'eng',
                        alias: 'a'
                    })
                    .option('video-size', {
                        type: 'string',
                        desc: 'Specify video resolution (e.g., 1920x1080, best). Ignored if --audio-only is used.',
                        default: 'best',
                        alias: 's'
                    })
                    .option('format', {
                        type: 'string',
                        desc: 'Specify video output format (mp4, ts).',
                        choices: ['mp4', 'ts'],
                        default: 'mp4',
                        alias: 'f'
                    })
                    .option('output-directory', {
                        type: 'string',
                        desc: 'Directory to save the downloaded file.',
                        alias: 'o',
                        default: process.env.F1TV_OUTDIR || null,
                        coerce: (outDir) => {
                            if (outDir && !outDir.endsWith(config.PATH_SEP)) {
                                return outDir + config.PATH_SEP;
                            }
                            return outDir;
                        }
                    })
                    .option('channel-list', {
                        type: 'boolean',
                        desc: 'List available channels and exit.',
                        default: false
                    })
                    .option('stream-url', {
                        type: 'boolean',
                        desc: 'Print the tokenized stream URL and exit.',
                        default: false
                    })
                    .option('log-level', {
                        alias: 'l',
                        desc: 'Set the log level.',
                        choices: ['trace', 'debug', 'info', 'warn', 'error'],
                        default: 'info'
                    });
            })
            .demandCommand()
            .help()
            .parse();

        log.setLevel(logLevel);

        config.setToken(token);
        log.info('Using manually provided authentication token.');

        const content = await getContentInfo(url);

        if (channelList) {
            if (isRace(content)) {
                content.metadata.additionalStreams.forEach(stream => {
                    const data = (stream.type === 'obc')
                        ? `name: ${config.makeItGreen(stream.driverFirstName + ' ' + stream.driverLastName)}`.padEnd(37) + `number: ${config.makeItGreen(stream.racingNumber)}`.padEnd(22) + `tla: ${config.makeItGreen(stream.title)}`
                        : `name: ${config.makeItGreen(stream.title)}`;
                    log.info(data);
                });
            } else {
                log.info('This URL does not have additional streams.');
            }
            return;
        }

        const f1tvUrl = await getTokenizedUrl(url, content, channel);

        if (streamUrl) return log.info('Stream URL:', f1tvUrl);

        const useDash = f1tvUrl.includes('.mpd');
        const finalFormat = audioOnly ? 'm4a' : format;
        const outFile = (isRace(content) && channel) ? `${getContentParams(url).name}-${channel.split(' ').shift()}.${finalFormat}` : `${getContentParams(url).name}.${finalFormat}`;
        const outFileSpec = outputDir ? outputDir + outFile : outFile;

        const plDetails = await getProgramStreamId(f1tvUrl, audioStream, videoSize);
        log.debug(JSON.stringify(plDetails, 2, 4));

        const ffmpegPath = ffmpegInstaller.path;
        let args = ['-loglevel', 'error', '-stats'];

        if (audioOnly) {
            log.info('Starting audio-only download...');
            const audioSelectString = useDash ? '0:a:m:language:' + audioStream : '0:a:m:language:' + audioStream;
            args.push(
                '-i', f1tvUrl,
                '-map', audioSelectString,
                '-vn',
                '-c:a', 'copy',
                '-y', outFileSpec
            );
        } else {
            log.info('Starting video download...');
            const programStream = plDetails.videoId;
            const audioIndex = plDetails.audioId;

            const videoSelectString = util.format(useDash ? '0:v:m:id:%i' : '0:p:%i:v', programStream);
            const audioSelectString = useDash ? `0:a:m:language:${audioStream}` : `0:p:${programStream}:a:${audioIndex}`;

            let streamMapping = ['-map', videoSelectString, '-map', audioSelectString];
            let codecParams = ['-c:v', 'copy', '-c:a', 'copy'];

            args.push('-i', f1tvUrl);

            if (!!internationalAudio && isRace(content)) {
                log.info(`Adding ${internationalAudio} commentary as a second audio track.`);

                const intlUrl = await getTokenizedUrl(url, content, 'INTERNATIONAL');
                const intlDetails = await getProgramStreamId(intlUrl, internationalAudio, 'best');
                const intlAudioSelectString = util.format(useDash ? '1:a:m:language:%s' : `1:p:${intlDetails.videoId}:a:${intlDetails.audioId}`, internationalAudio);

                args.push('-itsoffset', itsoffset, '-i', intlUrl);
                streamMapping.push('-map', intlAudioSelectString);

                const intlLangId = internationalAudio === 'eng' ? 'Sky' : internationalAudio;
                codecParams.push(
                    `-metadata:s:a:0`, `language=${audioStream}`, `-disposition:a:0`, `default`,
                    `-metadata:s:a:1`, `language=${intlLangId}`, `-disposition:a:1`, `0`
                );
            }

            args.push(...streamMapping, ...codecParams);

            if (finalFormat === 'mp4') {
                args.push('-bsf:a', 'aac_adtstoasc', '-movflags', 'faststart');
            }
            
            args.push('-y', outFileSpec);
        }

        log.info('Output file:', config.makeItGreen(outFileSpec));
        log.debug('Executing command:', ffmpegPath, args.join(' '));

        const ffmpegProcess = spawn(ffmpegPath, args);

        ffmpegProcess.stderr.on('data', (data) => {
            const progress = data.toString().trim().split('\n').pop();
            process.stdout.write('\r' + progress);
        });

        ffmpegProcess.on('close', (code) => {
            log.info(code === 0 ? '\nDownload complete.' : `\nffmpeg process exited with code ${code}.`);
        });

        ffmpegProcess.on('error', (err) => log.error('Failed to start ffmpeg process.', err));

    } catch (e) {
        log.error('Error:', e.message);
        log.debug(e);
    }
})();