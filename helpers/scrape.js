const cheerio = require('cheerio');

const scrape = function(htmlString, url) {
  const $ = cheerio.load(htmlString);

  let props = {};

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
    $('meta[property="og:url"]').attr('content') ||
    $('link[rel="canonical"]').attr('href') ||
    url;

  return props;
};
module.exports = scrape;
