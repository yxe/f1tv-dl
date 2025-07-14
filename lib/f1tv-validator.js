const isUrl = (string) => {
    try { return Boolean(new URL(string));}
    catch (e) { return false; }
}

const isF1tvUrl = (urlStr) => {
    try {
        if (isUrl(urlStr)) {
            let url = new URL(urlStr);
            return url.host.toLowerCase().indexOf('f1tv') !== -1 &&
                ['detail'].find(item => url.pathname.toLowerCase().indexOf(item) !== -1);
        }
        return false;
    }
    catch (e) { return false; }
}

const isRace = (content) => content.metadata.additionalStreams !== undefined;

module.exports = {
    isUrl,
    isRace,
    isF1tvUrl
};