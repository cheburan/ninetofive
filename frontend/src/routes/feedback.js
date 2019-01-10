"use strict";

let express = require('express');
let router = express.Router();

let config = require('config');
let general_conf = config.get('General');
let style_conf = config.get('Style');

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('feedback_pub', {
    title: 'Feedback Form',
    path: '',
    general: general_conf,
    style: style_conf
  });
});

module.exports = router;
