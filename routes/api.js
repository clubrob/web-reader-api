const express = require('express');
const router = express.Router();

const clip_controller = require('../controllers/clipController.js');

// GET api/
router.get('/', clip_controller.clip_list);

// POST api/
router.post('/', clip_controller.clip_create_post);

// GET api/save/{url}
router.get('/save', clip_controller.clip_save_clip);
// POST api/save/{url}
router.post('/save', clip_controller.clip_save_clip);

// GET api/clip/{id}
router.get('/clip/:slug', clip_controller.clip_detail);

// PUT api/{id}
router.put('/clip/:slug', clip_controller.clip_update_put);

// DELETE api/{id}
router.delete('/clip/:slug', clip_controller.clip_delete);

module.exports = router;
