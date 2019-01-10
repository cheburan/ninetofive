"use strict";

const config = require('config');
const index = config.get('Index');
const style = config.get('Style');
const general = config.get('General');
const text = config.get('Text');

const express = require('express');

let router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  let link='/email';
  if (req.session.passwordless ){
    link ='/system/browse'
  }
  res.render('index', {
    title: '9to5',
    index: index,
    general: general,
    link: link,
    style: style,
    text: text
  });
});

module.exports = router;
