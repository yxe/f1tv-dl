const config = require('./config');
const axios = require('axios');
const { isF1tvUrl } = require('./f1tv-validator');
const DASH = require('mpd-parser');
const HLS = require('hls-parser');
const XmlReader = require('xml-reader');
const XmlQuery = require('xml-query');

axios.defaults.headers.common['User-Agent'] = 'AppleTV6,2/11.1';

const getAdditionalStreamsInfo = (streams, searchStr) => {
    for (const stream of streams) {
        const data = (stream.type === 'obc') ? [stream.reportingName, stream.title, stream.driverFirstName + ' ' + stream.driverLastName, String(stream.racingNumber)] : [stream.reportingName, stream.title];
        if (data.find(item => item.indexOf(searchStr) !== -1)) return stream; // case sensitive
    }
    return null;
};

const getContentParams = (url) => {
    if (!isF1tvUrl(url)) throw new Error("Invalid F1TV URL");
    const content = new URL(url);
    const temp = content.pathname.split('/');
    return {
        name: temp.pop(),
        id: temp.pop()
    };
};

const getContentInfo = async (url) => {
    const content = getContentParams(url);
    const options = {
        baseURL: config.BASE_URL,
        params: {
            'contentId': content.id,
            'entitlement': config.ENTITLEMENT,
            'homeCountry': config.HOME_COUNTRY
        }
    };
    const path = `/3.0/R/ENG/BIG_SCREEN_HLS/ALL/CONTENT/VIDEO/${content.id}/${config.ENTITLEMENT}/2`;
    const result = await axios.get(path, options);
    return result.data.resultObj.containers.shift();
};

const getContentStreamUrl = (id, channel = null) => {
    const token = config.token;

    if (!token) {
        throw new Error('Authentication token is missing. Please provide it with the --token argument.');
    }

    const params = (channel === null) ? { 'contentId': id } : { 'channelId': channel, 'contentId': id };
    const options = {
        baseURL: config.BASE_URL,
        headers: { 'entitlementToken': token },
        params: params
    };

    const path = '/2.0/R/ENG/BIG_SCREEN_HLS/ALL/CONTENT/PLAY';

    return axios.get(path, options)
        .then(result => {
            if (!['HLS', 'DASH'].includes(result.data.resultObj.streamType)) {
                console.error(`Warning: Stream type may not work. Found ${result.data.resultObj.streamType}.`);
            }
            return result.data.resultObj.url;
        });
};

const getProgramStreamId = (url, lang, res = 'best') => {
    return axios.get(url)
        .then(result => {
            const variant = {
                playlist: null,
                bandwidth: 0,
                videoId: -1,
                audioId: -1
            };

            if (url.includes('.mpd')) { // DASH
                const pl = DASH.parse(result.data, { manifestUri: url });
                for (let i = 0; i < pl.playlists.length; i++) {
                    const v = pl.playlists[i].attributes;
                    if (res === 'best') {
                        if (v.BANDWIDTH > variant.bandwidth) {
                            variant.bandwidth = v.BANDWIDTH;
                            variant.playlist = v;
                            variant.videoId = parseInt(v.NAME);
                        }
                    } else {
                        let [w, h] = res.split('x');
                        if (v.RESOLUTION.width == parseInt(w) && v.RESOLUTION.height == parseInt(h)) {
                            variant.bandwidth = v.BANDWIDTH;
                            variant.playlist = v;
                            variant.videoId = parseInt(v.NAME);
                        }
                    }
                }
                const mpd = XmlReader.parseSync(result.data);
                let audio;
                XmlQuery(mpd).find('AdaptationSet').each(node => {
                    if (node.attributes.mimeType == 'audio/mp4' && node.attributes.lang == lang) {
                        node.children.forEach(child => {
                            if (child.name == 'Representation') audio = child;
                        });
                    }
                });
                variant.audioId = parseInt(audio.attributes.id);
            } else { // HLS
                const pl = HLS.parse(result.data);
                for (let i = 0; i < pl.variants.length; i++) {
                    const v = pl.variants[i];
                    if (v.isIFrameOnly) continue;
                    if (res === 'best') {
                        if (v.bandwidth > variant.bandwidth) {
                            variant.bandwidth = v.bandwidth;
                            variant.playlist = v;
                            variant.videoId = i;
                        }
                    } else {
                        let [w, h] = res.split('x');
                        if (v.resolution.width == parseInt(w) && v.resolution.height == parseInt(h)) {
                            variant.bandwidth = v.bandwidth;
                            variant.playlist = v;
                            variant.videoId = i;
                        }
                    }
                }
                for (let i = 0; i < variant.playlist.audio.length; i++) {
                    if (variant.playlist.audio[i].language == lang) {
                        variant.audioId = i;
                    }
                }
            }
            return variant;
        });
};

module.exports = {
    getContentParams,
    getContentInfo,
    getContentStreamUrl,
    getAdditionalStreamsInfo,
    getProgramStreamId,
};