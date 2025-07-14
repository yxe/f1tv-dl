require('dotenv').config();
const path = require('path');

module.exports = {
    token: null,
    setToken: function(t) {
        this.token = t;
    },

    HOME: require('os').homedir(),
    PATH_SEP: path.sep,
    API_KEY: 'fCUCjWrKPu9ylJwRAv8BpGLEgiAuThx7',
    BASE_URL: 'https://f1tv.formula1.com',
    AUTH_URL: 'https://f1tv-api.formula1.com',
    ENTITLEMENT: 'F1_TV_Pro_Annual',
    HOME_COUNTRY: 'USA',

    makeItGreen: (str) => {
        return '\x1b[32m' + str + '\x1b[37m';
    }
};