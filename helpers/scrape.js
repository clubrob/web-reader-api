const cheerio = require('cheerio');

const scrape = function(htmlString, url) {
  const $ = cheerio.load(htmlString);

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

  return props;
};
module.exports = scrape;
