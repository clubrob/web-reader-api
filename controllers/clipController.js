const slugify = require('slugify');
const rp = require('request-promise');
const scrape = require('../helpers/scrape.js');
const read = require('../helpers/read.js');
const Clip = require('../models/clips.js');

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

// Get save clip
exports.clip_save_clip = async (req, res) => {
  const clip = req.body;
  const url = clip.url;
  const tags = clip.tags;
  const summary = clip.summary || null;
  const title = clip.title || null;

  await rp(url)
    .then(page => {
      return scrape(page, url)
        .then(clipJson => {
          // console.log(clipJson);
          const slugDigit = Math.floor(Math.random() * 90000) + 10000;
          const clip = new Clip({
            title: title || clipJson.pageTitle,
            summary: summary || clipJson.pageSummary,
            url: clipJson.pageUrl,
            slug: slugify(`${clipJson.pageTitle}-${slugDigit}`, {
              remove: /[$*_+~.()'"!,?:@]/g
            }),
            readable: clipJson.readableContent,
            tags: tags
          });
          clip
            .save()
            .then(res.send(clip))
            .catch(err => console.log(err.message));
        })
        .catch(err => console.log(err.message));
    })
    .catch(err => console.log(err.message));
};

// Put update clip
exports.clip_update_put = async (req, res) => {
  if (req.body.title) {
    const slugDigit = req.body.slug.substr(-5);
    req.body.slug = slugify(`${req.body.title}-${slugDigit}`);
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
  ).then(() => res.send('butts'));
};

// Delete clip
exports.clip_delete = async (req, res) => {
  await Clip.findOneAndDelete(
    {
      slug: req.params.slug
    },
    err => {
      if (err) {
        return res.status(500).send({
          error: 'Unsuccessful'
        });
      }
    }
  ).then(() => res.send('Clip removed'));
};

// Get read clip
exports.clip_read = async (req, res) => {
  const readerContent = await Clip.findOne({
    slug: req.query.s
  });
  res.send(readerContent);
};
