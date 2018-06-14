const slugify = require('slugify');
const rp = require('request-promise');
const scrape = require('../helpers/scrape.js');
const read = require('../helpers/read.js');
const Clip = require('../models/clips.js');

const slugDigit = Math.floor(Math.random() * 90000) + 10000;

// Get all clips
exports.clip_list = async (req, res) => {
  const clips = await Clip.find();
  res.send(clips);
};

// Get one clip
exports.clip_detail = async (req, res) => {
  const clip = await Clip.findOne({
    slug: req.params.slug
  });
  res.send(clip);
};

// Post new clip
/* exports.clip_create_post = function(req, res) {
  const clip = new Clip({
    title: req.body.title,
    summary: req.body.summary,
    url: req.body.url,
    slug: slugify(`${req.body.title}-${slugDigit}`),
    tags: req.body.tags
  });
  clip.save(err => {
    if (err) console.log(err);
  });

  res.send(clip);
}; */

// Get save clip
exports.clip_save_clip = async (req, res) => {
  const url = req.query.url || req.body.url;
  await rp(url)
    .then(page => {
      const data = scrape(page, url);
      const clip = new Clip({
        title: data.pageTitle,
        summary: data.pageSummary,
        url: data.pageUrl,
        slug: slugify(`${data.pageTitle}-${slugDigit}`)
      });
      clip
        .save()
        .then(res.send(clip))
        .catch(err => console.log(err.message));
    })
    .catch(err => console.log(err.message));
};

// Put update clip
exports.clip_update_put = async (req, res) => {
  let slug = req.params.slug;
  if (req.body.title) {
    req.body.slug = slugify(`${req.body.title}-${slugDigit}`);
    slug = req.body.slug;
  }
  await Clip.findOneAndUpdate(
    {
      slug: req.params.slug
    },
    req.body,
    err => {
      if (err) {
        return res.status(500).send({
          error: 'Unsuccessful'
        });
      }
    }
  );
  res.redirect(`/api/clip/${slug}`);
};

// Delete clip
exports.clip_delete = async (req, res) => {
  await Clip.findOneAndDelete({
    slug: req.params.slug
  });
  res.send('Clip removed');
};

// Get read clip
exports.clip_read = async (req, res) => {
  const readerContent = await read(req.query.url);
  res.send(readerContent);
};
