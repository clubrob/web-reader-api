require('dotenv').config();
const rp = require('request-promise');

const mercuryRead = function(url) {
  const mercuryApi = process.env.MERCURY_READER_API;

  const rpOptions = {
    uri: `https://mercury.postlight.com/parser?url=${url}`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': mercuryApi
    },
    json: true
  };

  return rp(rpOptions)
    .then(data => data)
    .catch(err => console.log(err.message));
};

module.exports = mercuryRead;
