const mongoose = require('mongoose');

const clipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true
  },
  tags: {
    type: [String]
  },
  readable: {
    type: String
  }
});

module.exports = mongoose.model('Clip', clipSchema);
