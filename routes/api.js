const express = require('express');
const router = express.Router();

const clip_controller = require('../controllers/clipController.js');

// GET api/
router.get('/', clip_controller.clip_list);

// POST api/
router.post('/', clip_controller.clip_create_post);

// GET api/{id}
router.get('/:id', clip_controller.clip_detail);

// PUT api/{id}
router.put('/:id', clip_controller.clip_update_put);

// DELETE api/{id}
router.delete('/:id', clip_controller.clip_delete);

module.exports = router;