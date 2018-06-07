const slugify = require('slugify');
const Clip = require('../models/clips.js');

const slugDigit = Math.floor(Math.random()*90000) + 10000;

// Get all clips
exports.clip_list = async (req, res) => {
  const clips = await Clip.find();
  res.send(clips);
};

// Get one clip
exports.clip_detail = async (req, res) => {
  const clip = await Clip.findOne({ slug: req.params.slug });
  res.send(clip);
};

// Post new clip
exports.clip_create_post = function (req, res) {
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
};

// Put update clip
exports.clip_update_put = async (req, res) => {
  let slug = req.params.slug;
  if (req.body.title) {
    req.body.slug = slugify(`${req.body.title}-${slugDigit}`);
    slug = req.body.slug;
  }
  await Clip.findOneAndUpdate({ slug: req.params.slug }, req.body, (err) => {
    if (err) {
      return res.status(500).send({ error: 'Unsuccessful'});
    }
  });
  res.redirect(`/api/clip/${slug}`);
};

// Delete clip
exports.clip_delete = async (req, res) => {
  await Clip.findOneAndDelete({ slug: req.params.slug });
  res.send('Clip removed');
};