"use strict";

let config = require('config');
let general_conf = config.get('General');

let express = require('express');
let router = express.Router();


/* GET Cookie Policy page. */
router.get('/', (req, res, next) => {
  res.render('research_pub', {
    title: 'Research Policy',
    path: '',
    general: general_conf
  });
});

module.exports = router;
