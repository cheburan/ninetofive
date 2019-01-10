"use strict";

let express = require('express');
let router = express.Router();
let config = require('config');

const environment = config.get('Environment');

let email = config.get('Email');
let general = config.get('General');
const style = config.get('Style');

/* GET home page. */
router.get('/', (req, res, next) => {
  let message = req.flash('passwordless');
  let flashMessage ='';
  message.forEach(flash => {
    flashMessage += flash;
    console.log(flash);
  });
  res.setHeader('Cache-Control', 'no-cache');
  res.render('email', {
    title: 'Access NINEtoFIVE.work',
    flashMessage: flashMessage,
    email: email,
    environment: environment,
    general: general,
    style: style
  });
});

module.exports = router;
