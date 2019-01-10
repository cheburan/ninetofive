/**
 * Created by b0913178 on 04/06/2017.
 */
"use strict";

//import express module
const express = require('express');

let request = require('request');
//modules and files for passwordless access
let passwordless = require('passwordless');
let config = require('config');
const host_unsubscribe = config.get('Passwordless.host') + config.get('Passwordless.host_unsubscribe');
const email_domain_name = config.get('Environment.email_domain_name');
let config_auth_type = config.get('Environment.auth_type');

const app = express();
const router = express.Router();

let db = require('../controllers/DbService');
//import validation procedures
let uValid = require('../controllers/additions/useful_func');

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


/**
* Don't see a reason to store passcode as a salted hash or encrypted one, because it's already openly send to email and
* don't considered as something really secret. For now is stored openly as a randomly generated number;
* */
router.post('/insert_temp_mail', passwordless.restricted(), function(req, res){
    //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
    //TODO Properly validate emails;
  if (req.body['recaptcha']){
    request({
          uri: "https://www.google.com/recaptcha/api/siteverify",
          method: "POST",
          json: true,
          form: {"secret": "6LeITCoUAAAAACksfpYqsoPMS9ptue7-2f9bnW8T", "response": req.body['recaptcha']}
        },
        function (error, response, body){
          if (!error && response.statusCode === 200 && body['success'] === true) {
    req.body['working_email'] += email_domain_name;
    let w_email = uValid.validateEmail(req.body['working_email']);
    //TODO: might be useful to try/catch email validation
    let email = uValid.validateEmail(req.body['email']);
    let id = req.session.id;
    let uuid = req.session.passwordless;
    if (w_email && email && id && uuid){
        let passcode = uValid.getRandomString(16);
        let emlSend = checkEmailinDB(w_email);
        emlSend.then(address => {
            if (address){
                db.addTempEmail(address[4], email, id, uuid, passcode, false) //Maybe wait till the answer from dbinserting
                    .then(answer => {
                        if (answer['code']===1){
                            uValid.sendEmail(passcode, '', address[0], email, 'NINEtoFIVE.work Update Email Request');
                            res.send({"email": "Please check your current email address to confirm your change.", "code": true});
                        } else {
                            console.log(answer);
                            res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> We couldn't find your email in our list of emails. Please check it correctness.", "code": false});
                        }
                    })
                    .catch(err => {
                        console.log ('Error in inserting temp email: ', err);
                    })
            } else {
                res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> We couldn't find your work email in our list of emails. Please check it correctness.", "code": false});
            }
        });
    } else {
        res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> Erroneous data as input. Please check information you've provided.", "code": false});
    }
    // create hash
    //let hash = crypto.createHmac('sha512', crypto_key);
    //hash.update(req.body['link']);
    //req.body['link'] = hash.digest('hex');
    console.log(id);
    console.log(uuid);
    console.log(req.body['working_email']);
    console.log(req.body['email']);
    /*db.insertMessage(req.body['message'], req.body['author'], categories, req.body['type'], req.body['link'])
        .then((response) =>{
            if (response && response['code']===1){
                res.send ("Message saved");
            } else if (response && response['code']===0){
                res.send ("Something went wrong! Can\'t save the message");
            }
        })*/
          } else {
            console.log ('something went wrong: ', error);
            res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> something went wrong. Please check if you opt-in captcha and typed your email address", "code": false});
          }
        });

  } else res.send(
      {'email': "<span style='color: red; font-weight: bold'>Error:</span> please do not forgot to tick-in recaptcha", "code": false});

});


router.post('/unsubscribe', passwordless.restricted(), function(req, res) {

  //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
  //TODO Properly validate emails;
  if (req.body['recaptcha']){
    request({
          uri: "https://www.google.com/recaptcha/api/siteverify",
          method: "POST",
          json: true,
          form: {"secret": "6LeITCoUAAAAACksfpYqsoPMS9ptue7-2f9bnW8T", "response": req.body['recaptcha']}
        },
        function (error, response, body){
          if (!error && response.statusCode === 200 && body['success'] === true) {
            req.body['working_email'] +='@ncl.ac.uk';
            let w_email = uValid.validateEmail(req.body['working_email']);
            if (w_email){
              let passcode = uValid.getRandomString(16);
              let emlSend = checkEmailinDB(w_email);
              emlSend.then(address => {
                if (address && address[3]){
                  db.addUnsubscriptionToken(w_email, passcode)
                      .then(answer => {
                        if (answer['code']===1){
                          req.session.unsubscribe_token = passcode;
                          uValid.sendAnyEmail("Sadly for us we have received unsubscription request. If it wasn't from please you ignore this message. Otherwise, please use the link below to unsubscribe from the daily summaries.\n " + host_unsubscribe + "?code=" + passcode, "<p>Sadly for us we have received unsubscription request.<br>If it was not from you please ignore this message. Otherwise, please use the link below to unsubscribe from the daily summaries. <br> <a href='" + host_unsubscribe + '?code=' + passcode + "'>Unsubscribe</a></p>", address[0],"NINEtoFIVE: Unsubscribe request");
                          res.send({"email": "Please check your current email address to confirm your change.<br> <strong><span style='color: darkred'>NOTE</span>: DO NOT CLOSE THIS BROWSER TAB/WINDOW UNTIL YOU CONFIRM YOUR CHOICE BY CLICKING EMAILED LINK.</strong>", "code": true});
                        } else {
                          console.log(answer);
                          res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> We couldn't find your email in our list of emails. Please check it correctness.", "code": false});
                        }
                      })
                      .catch(err => {
                    console.log ('Error in inserting temp email: ', err);
                  })
                } else {
                  res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> We couldn't find your work email in our list of subscribed emails. Please check it correctness.", "code": false});
                }
              });
            } else {
              res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> Erroneous data as input. Please check information you've provided.", "code": false});
            }

          } else {
            console.log ('something went wrong: ', error);
            res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> something went wrong. Please check if you opt-in captcha and typed your email address", "code": false});
          }
        });

  } else res.send(
      {'email': "<span style='color: red; font-weight: bold'>Error:</span> please do not forgot to tick-in recaptcha", "code": false});


});


module.exports = router;

function checkEmailinDB(email){
  let email_to_check = '';

  if (config_auth_type === 0 && email){
    email_to_check = email;
  } else {
    // create hash
    email_to_check = uValid.hashingString(email);
  }

    let db_answer = db.checkEmail(email, email_to_check);
    return new Promise((resolve, reject) => {
        db_answer.then((answer) =>{
            let address = null;
            //let result = {};
            console.log('Retrieved from DB in resService: ', answer);
            if (answer['code'] === 1){
                if (answer['data']['personal_email']===null || answer['data']['personal_email']===''){
                    address = [email, email, false, answer['data']['subscription'],answer['data']['email']];
                } else {
                    address =[answer['data']['personal_email'], email, true, answer['data']['subscription'],answer['data']['email']];
                }
                //send email to the specified address
                console.log('Sending token via email...');
            }
            console.log("Address is "+ address);
            resolve(address);
        }).catch((error) =>{
            console.log('Error in resService: ', error);
            reject(error);
        });
    });

}