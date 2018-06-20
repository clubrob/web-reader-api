const cheerio = require('cheerio');
const read = require('../helpers/read.js');

const scrape = function(htmlString, url) {
  const $ = cheerio.load(htmlString);

  return read(url)
    .then(readable => {
      const props = {};

      props.pageTitle =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="title"]').attr('content') ||
        $('title').text() ||
        'No Title';
      props.pageSummary =
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') ||
        'No Summary';
      props.pageUrl =
        url ||
        $('link[rel="canonical"]').attr('href') ||
        $('meta[property="og:url"]').attr('content');
      props.readableContent = readable.content;

      return props;
    })
    .catch(err => console.log(err.message));
};
module.exports = scrape;
