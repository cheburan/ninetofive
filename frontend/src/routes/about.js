"use strict";
let config = require('config');
let about_conf = config.get('About');
let general_conf = config.get('General');
const text = config.get('Text.about');

let express = require('express');
let router = express.Router();


/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('about', {
    title: 'FAQ',
    path: '',
    about: about_conf,
    general: general_conf,
    text: text
  });
});

module.exports = router;
