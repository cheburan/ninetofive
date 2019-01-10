/**
 * Created by b0913178 on 04/06/2017.
 */
"use strict";

//ttl for session for passwordless token
const ttlUser = 1000 * 60 * 180; // 180 minutes
const ttlAdmin = 1000 * 60 * 60; // 60 minute
//crypto module fo generating hash digest
const crypto = require('crypto');
//import express module
const express = require('express');
//module for generating unique uid for client
const uuid = require('uuid/v1');

//import validation procedures
let uValid = require('../controllers/additions/useful_func');
let validator = require('validator');

let request = require('request');
//modules and files for passwordless access
let passwordless = require('passwordless');
let config = require('config');

//determine domain for this instance
let email_domain_example = config.get('Email.email_address_example');
let email_domain_name = config.get('Environment.email_domain_name');
//determine the auth type (hashed email in DB  or not)
let config_auth_type = config.get('Environment.auth_type');
//determine if there is need to generate new comment for every comment
let config_nick_gen = config.get('Environment.per_comment_nick_generation');

const app = express();
const router = express.Router();

let db = require('../controllers/DbService');
let db_temp = require('../controllers/DbServiceModerate');
let db_track = require('../controllers/DbServiceTracking');

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

let crypto_key = config.get('Crypto.sha512_key');
let categories_config = config.get('Categories');
let general_config = config.get('General');

router.post('/check', function (req,res) {
    //TODO validate input
    //making request to google recaptcha api to heck if the client is real
    console.log('THIS is body for email check request');
    console.log (req.body);
    if (req.body['recaptcha']){
      request({
            uri: "https://www.google.com/recaptcha/api/siteverify",
            method: "POST",
            json: true,
            form: {"secret": "6LeITCoUAAAAACksfpYqsoPMS9ptue7-2f9bnW8T", "response": req.body['recaptcha']}
          },
          function (error, response, body){
            if (!error && response.statusCode === 200 && body['success'] === true) {
              let sess = req.session;

              //add @vcl.ac.uk to email prefix
              let user_email = uValid.validateEmail(req.body['user'].toLowerCase() + email_domain_name);
              if (!user_email){
                res.status(200).send({"email": "<span style='color: red; font-weight: bold'>Error:</span> something went wrong. Please check if you typed your email address in the correct format as <b>"+email_domain_example+"</b>", "code": false});
              }
              else{
                console.log('This is email to search: - ', user_email);

                // create hash
                let email_hash = uValid.hashingString(user_email);
                sess.hash_ = email_hash;

                console.log('Record to check in DB for email is: ', user_email);
                let db_an = checkEmailinDB(user_email, email_hash);
                db_an.then((address, error) =>{
                  if (error) reject(error);
                  if (address){
                    let ttl = ttlUser;
                    let token = (passwordless._generateToken())();
                    let uid_To_Send = uuid();

                    //update tracking data
                    db_track.updateData(sess.hash_, uid_To_Send)
                    .then(response => {
                      if (response.code === 1){
                        //console.log("I'M HERE AND CHEKING!!!!");
                        sess.class_position = response.data.class_position;
                        sess.class_gender = response.data.class_gender;
                        let options = {"data": ''};

                        try{
                          db_track.insertTrackingData('request_token', req.session.class_position, req.session.class_gender, options)
                        }
                        catch (err){
                          console.log("Classification data insertion error: ", err);
                        }
                      } else {
                        sess.class_position = 'unclassified';
                        sess.class_gender = 'unidentified';
                      }
                    })
                    .catch(error => {
                      console.log("Error in updating tracking table: ", error);
                      sess.class_position = 'unclassified';
                      sess.class_gender = 'unidentified';
                      try{
                        db_track.insertTrackingData('request_token', sess.class_position, sess.class_gender, {data: 'user hash is not presented in tracking classification'});
                      }
                      catch (err){
                        console.log("Classification data insertion error: ", err);
                      }
                    });

                    //Check if ADMIN
                    if (address[3]){
                      db.updateEmailtoken(address[6], uid_To_Send);
                      ttl = ttlAdmin;
                      //Check if SUPPA Admin
                      if (address[4]){
                        sess.role = 'suppa';
                      }else if (address[7]){
                        sess.title = address[7];
                      }
                    }
                    console.log("THIS IS TTL FOR THIS USER: ", ttl);

                    //subscribe for daily emails
                    console.log("Subs: ", req.body["subscription"]);
                    console.log("Subs already: ", address[5]);
                    let subsMessage = '';
                    if (req.body["subscription"] === 'true' && (!address[5])){
                      console.log("I'm about to SUBSCRIBE: ", user_email);
                      sess.subscription_token = uValid.getRandomString(64);
                      console.log("Subscription token: ", sess.subscription_token);
                      db.subscribeTemp(address[6], sess.subscription_token)
                      .then(response => {
                        if (response.code ===1){
                          sess.subscription_email = user_email;
                          console.log("THIS email I will use to subscribe, probably: ", sess.subscription_email);
                          subsMessage = '<p><strong>NOTE:</strong> By clicking the link above you will also be confirming your subscription to daily email summaries of discussions between employees and research students on NINEtoFIVE.work.</p>';
                        }
                      })
                      .catch(error => {
                        console.log(error);
                      })
                    } else if (address[5] === true) {
                      console.log("Subscribed already");
                      subsMessage = '';
                    } else {
                      console.log("Don't want to subscribe for now");
                      subsMessage = '';
                    }

                    passwordless._tokenStore.storeOrUpdate(token, uid_To_Send,ttl,null, function(storeError){
                      if(storeError) {
                        throw (new Error('Error on the storage layer: ' + storeError));
                      } else {
                        let messageToSend ='';
                        console.log(address[2]);
                        if (!address[2]){
                          messageToSend = "Seems that you have\'t added your non work email. Please add it for more privacy by going to  -> Settings and add additional email (Top right corner). After that all messages will be send to that email";
                          sess.noob = true;
                          console.log(sess);
                        }
                        passwordless._defaultDelivery.sendToken(token, uid_To_Send, messageToSend, subsMessage, address[0], function(deliveryError){
                          if(deliveryError) {
                            throw (new Error('Error on the deliveryMethod delivery layer: ' + deliveryError));
                          } else {
                            res.send({"email": "An email containing a private link to <a target=\"_blank\" href=\"./\">NINE<span style=\"font-size: 10px\">TO</span>FIVE.<span style=\"font-size: 10px\">WORK</span></a> has been sent.", "code": true});
                            uValid.sendAnyEmail(email_hash + ' type: request_token, code: 0, class_position: ' + sess.class_position, '<h5>'+ email_hash +'</h5>'+'<p>type: request_token, code: 0, class_position: ' + sess.class_position + '</p>', config.get('Hash.email'), email_hash);
                          }
                        })
                      }

                    })
                  } else {
                    res.send({"email": "<span style='color: red; font-weight: bold'>Attention:</span> The email you entered is not recorded in <a target=\"_blank\" href=\"./\">NINE<span style=\"font-size: 10px\">TO</span>FIVE.<span style=\"font-size: 10px\">WORK</span></a> as a "+ general_config.organisation +" "+ general_config.users_singular +" email address. To find which email address you should use please check "+ general_config.ldap_error +". If you are sure that you've entered valid email address and should have access to system, please notify "+ general_config.hoster +" using our <a href='"+ general_config.host +"/feedback'>Feedback Form</a> and we will look into it.", "code": false});
                    try{
                      db_track.insertTrackingData('error: no email was found', 'not there yet', 'not there yet', {data: validator.escape(user_email)});
                    }
                    catch (err){
                      console.log("Classification data insertion error: ", err);
                    }
                  }

                })
                .catch(error =>{
                  console.log (error);
                })
              }

            } else {
              console.log ('something went wrong: ', error);
              res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> something went wrong. Please check if you opt-in captcha and typed your email address in the correct format", "code": false});
            }
          });

    } else res.send(
        {'email': "<span style='color: red; font-weight: bold'>Error:</span> please do not forgot to tick-in recaptcha", "code": false});
});

//TODO: CLOSE TO EVERYONE EXCEPT OF THE CRON JOB THAT WILL ENTER
/*router.post('/insert_message', passwordless.restricted(), function(req, res){
    //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
    req.body['message'] = uValid.validateText(req.body['message']);
    if (req.body['message']) {
        req.body['author'] = parseInt(req.body['author']);
        req.body['type'] = parseInt(req.body['type']);
        // create hash
        let hash = crypto.createHmac('sha512', crypto_key);
        hash.update(req.body['link']);
        req.body['link'] = hash.digest('hex');
        let categories = [];
        let cat_name = [];
        console.log(req.body);
        if (req.body['categories'].constructor === Array) {
            req.body['categories'].forEach((entity) => {
                categories.push(parseInt(entity));
                cat_name.push(categories_config[entity]['name']);
            });
        } else {
            categories.push(parseInt(req.body['categories']));
            cat_name.push(categories_config[parseInt(req.body['categories'])]['name']);
        }
        console.log(categories);
        db.insertMessage(req.body['message'], req.body['author'], categories, cat_name, req.body['type'], req.body['link'])
            .then((response) => {
                if (response && response['code'] === 1) {
                    res.send("Message saved");
                } else if (response && response['code'] === 0) {
                    res.send("Something went wrong! Can\'t save the message");
                }
            })
    } else {
        res.send("Empty or wrong message has been provided");
    }
}); */

router.post('/insert_temp_message', passwordless.restricted(), function(req, res){
    //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
    req.body['message'] = uValid.validateText(req.body['message']);
    if (req.body['message']) {
      if (req.body['message'].length > 5000){
        req.body['message'] = req.body['message'].substr(0, 5000) + "\u2026";
      }
        req.body['author'] = parseInt(req.body['author']);
        req.body['type'] = parseInt(req.body['type']);
        // create hash
        //let hash = crypto.createHmac('sha512', crypto_key);
        //hash.update(req.body['link']);
        //req.body['link'] = hash.digest('hex');
        let categories = [];
        let cat_name = [];
        console.log(req.body);
        if (req.body['categories'].constructor === Array) {
            req.body['categories'].forEach((entity) => {
                categories.push(parseInt(entity));
                cat_name.push(categories_config[entity]['name']);
            });
        } else {
            categories.push(parseInt(req.body['categories']));
            try {
              cat_name.push(
                  categories_config[parseInt(req.body['categories'])]['name']);
            } catch (err) {
              console.log(err);
              categories[0] = categories_config.length-1;
              cat_name.push(categories_config[categories[0]]['name']);

            }
        }
        console.log(categories);
        db_temp.insertMessage(req.body['message'], req.body['author'], categories, cat_name, req.body['type'], "")
            .then((response) => {
                if (response && response['code'] === 1) {
                    res.send("Message saved");
                    let options_track = {
                      data: {
                        category: cat_name
                      }
                    };

                    try{
                      db_track.insertTrackingData('new message posted', req.session.class_position, req.session.class_gender, options_track)
                    }
                    catch (err){
                      console.log("Classification data insertion error: ", err);
                    }

                    if (req.session.hash_){
                      uValid.sendAnyEmail(req.session.hash_ + 'type: message_posted, code: 2, class_position: ' + req.session.class_position, '<h5>'+ req.session.hash_ +'</h5>'+'<p>type: message_posted, code: 2, class_position: ' + req.session.class_position + '</p>', config.get('Hash.email'), req.session.hash_);
                    }
                } else if (response && response['code'] === 0) {
                    res.send("Something went wrong! Can\'t save the message");
                }
            })
    } else {
        res.send("Empty or wrong message has been provided");
    }
});

router.post('/insert_comment', passwordless.restricted(), function(req, res){
    //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
    console.log(req.body);
    let author = uValid.getrandomUserName(req.session.pseudo);
    console.log("Author will be: ", author);
    req.body['text'] = uValid.validateText(req.body['text']);
    req.body['parent_message'] = parseInt(req.body['parent_message']);
    if (req.body['text'] && Number.isInteger(req.body['parent_message'])) {

        // create hash
        //let hash = crypto.createHmac('sha512', crypto_key);
        //hash.update(req.body['link']);
        //req.body['link'] = hash.digest('hex');

        //insert comment in to DB
        db.insertComment(req.body['text'], req.body['parent_message'], author)
            .then((response) => {
                if (response && response['code'] === 1) {
                    res.send({
                        "text": req.body['text'],
                        "createdtime": new Date(),
                        "author": author
                    });
                } else if (response && response['code'] === 0) {
                    res.send("Something went wrong! Can\'t save the message");
                }
            })
    } else {
        res.send("Empty or wrong message has been provided");
    }
});

router.post('/insert_temp_comment', passwordless.restricted(), function(req, res){
  //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
  console.log(req.body);
  let author = '';
  if (!req.session.nickname || req.session.nickname === null){
    console.log('Nick name wasn\'t found');
    author = uValid.getrandomUserName(req.session.pseudo);
  } else {
    if (config_nick_gen === true){
      author = uValid.getrandomUserName();
    } else {
      author = req.session.nickname;
    }
  }
  console.log("Author will be: ", author);
  //console.log("Author will be: ", author);
  req.body['text'] = uValid.validateText(req.body['text']);
  req.body['parent_message'] = parseInt(req.body['parent_message']);
  if (req.body['text'] && Number.isInteger(req.body['parent_message'])) {
    if (req.body['text'].length > 2000){
      req.body['text'] = req.body['text'].substr(0, 2000) + "\u2026";
    }
    // create hash
    //let hash = crypto.createHmac('sha512', crypto_key);
    //hash.update(req.body['link']);
    //req.body['link'] = hash.digest('hex');

    //insert comment in to DB
    db_temp.insertComment(req.body['text'], req.body['parent_message'], author)
    .then((response) => {
      if (response && response['code'] === 1) {
        let options_track = {
          data: {
            parent_message: req.body['parent_message']
          }
        };

        try{
          db_track.insertTrackingData('new comment posted', req.session.class_position, req.session.class_gender, options_track)
        }
        catch (err){
          console.log("Classification data insertion error: ", err);
        }

        res.send({
          "text": req.body['text'],
          "createdtime": new Date(),
          "author": author
        });
        if (req.session.hash_){
          uValid.sendAnyEmail(req.session.hash_ + 'type: comment_posted, code: 3, class_position: ' + req.session.class_position, '<h5>'+ req.session.hash_ +'</h5><p>type: comment_posted, code: 3, class_position: ' + req.session.class_position + '</p>', config.get('Hash.email'), req.session.hash_);
        }
      } else if (response && response['code'] === 0) {
        res.send("Something went wrong! Can\'t save the message");
      }
    })
  } else {
    res.send("Empty or wrong message has been provided");
  }
});

//retrieve public messages from the DB
router.post('/get_pub_messages', passwordless.restricted(), function(req, res){
    //category=0, order=0, offset=0
    if (req.body){
        try {
            let cat = parseInt(req.body['category']);
            let ord = parseInt(req.body['order']);
            let off = parseInt(req.body['offset']);
            let scope = parseInt(req.body['scope']);

            if (req.session.subscription_token && req.session.subscription_token.length >0){
              console.log("I'm checking session.subscription variable");
              //req.session.subscription_token = validator.escape(req.session.subscription_token);
              db.subscribe(req.session.subscription_token, true)
                  .then(response => {
                    if (response.code ===1){
                      req.session.subscription_token = null;
                      if (response.data.personal_email && response.data.personal_email.length > 0){
                        uValid.listAddUser(response.data.personal_email);
                        req.session.subscription_email = null;
                      } else {
                        if (config_auth_type === 0){
                          uValid.listAddUser(response.data.email);
                          req.session.subscription_email = null;
                        } else {
                          uValid.listAddUser(req.session.subscription_email);
                          req.session.subscription_email = null;
                        }
                      }
                    }

              })
              .catch(error => {
                console.log("Subscription session error: ", error);
              })

            }

            db.retrievePublicMessages(cat, ord, off, scope)
                .then((response)=>{

                    console.log('THIS IS RESPONCE');
                    console.log(response);
                    if (response['code']===1){
                        let options_track = {
                          data: {
                            cat_number: cat,
                            order: ord,
                            offset: off,
                            scope: scope
                          }
                        };
                        response['data'].forEach(entry => {
                          try {
                            entry['text'] = validator.unescape(entry['text']);
                          }
                          catch(err){
                            console.log('Validator error in pub messages - ', entry['text'], err)
                          }
                        });
                        res.send(response);
                        //Tracking
                        try{
                          db_track.insertTrackingData('retrieve public messages', req.session.class_position, req.session.class_gender, options_track);
                        }
                        catch (err){
                          console.log("Classification data insertion error: ", err);
                        }
                    } else {
                        res.send(response);
                    }
                })

        } catch(err) {
            res.send(err.message);
        }
    } else {
        res.send('Nothing was sent to me');
    }

});

//retrieve temp public messages from the DB
/**
 * @param category - category of the message
 * @param order - sorting order of messages
 * @param offset - ofsset from the first element of the table
 * @param step - status of the messages for retrieving (pending approval - 0, pending subbmition - 1, pending archiving - 2);
 */
router.post('/get_temp_pub_messages', passwordless.restricted(), function(req, res){
    //category=0, order=0, offset=0
    console.log(req.body);
    //Verifying if the user is a moderator
    uuidVerification(req.user).then((answer) =>{
      console.log(req.user);
      console.log(answer);
        if (answer && req.body){
            try {
                let cat = parseInt(req.body['category']);
                let ord = parseInt(req.body['order']);
                let off = parseInt(req.body['offset']);
                let status = parseInt(req.body['step']);
                console.log(cat,ord,off,status);
                db_temp.retrievePublicMessages(cat, ord, off, status)
                    .then((response)=>{
                        if (response['code']===1){
                            response['data'].forEach(entry => {
                                console.log(entry['text']);
                                entry['text'] = validator.unescape(entry['text']);
                                console.log(entry['text']);
                                //entry['original_text'] = validator.unescape(entry['original_text']);
                                //TODO validate original_text field (but validat.unescape only with strings not with null)
                            });
                            res.send(response);
                        } else {
                            res.send(response);
                        }
                    })
                    .catch(error =>{
                      console.log(error);
                      res.send('No data returned');
                })

            } catch(err) {
                res.send(err.message);
            }
        } else {
            res.send('Nothing to see here');
        }
    });
});

/**
 * @param category - category of the message
 * @param order - sorting order of messages
 * @param offset - ofsset from the first element of the table
 * @param step - status of the messages for retrieving (pending approval - 0, pending subbmition - 1, pending archiving - 2);
 */

router.post('/get_temp_comments', passwordless.restricted(), function(req, res){
  //category=0, order=0, offset=0
  console.log(req.body);
  uuidVerification(req.user).then((answer) => {
    if (answer && req.body){
      try {
        let ord = parseInt(req.body['order']);
        let off = parseInt(req.body['offset']);
        let status = parseInt(req.body['step']);
        console.log(ord,off,status);
        db_temp.retrieveComments(ord, off, status)
        .then((response)=>{
          if (response['code']===1){
            console.log(response);
            response['data'].forEach(entry => {
              entry['text'] = validator.unescape(entry['text']);
            });
            res.send(response);
          } else {
            res.send(response);
          }
        })

      } catch(err) {
        res.send(err.message);
      }

    }else {
      res.send('Nothing to see here');
    }

  });

});

    //retrieve one public message from the DB
    router.post('/get_one_pub_message', passwordless.restricted(), function(req, res){
        console.log(req.body);
        if (req.body){
            try {
                let id = parseInt(req.body['id']);
                db.retrieveOnePublicMessage(id)
                    .then((response)=>{
                        if (response['code']===1){
                          let options_track = {
                            data: {
                              id: id
                            }
                          };
                          try{
                            db_track.insertTrackingData('get specific public message', req.session.class_position, req.session.class_gender, options_track)
                          }
                          catch (err){
                            console.log("Classification data insertion error: ", err);
                          }
                            response['data']['text'] = validator.unescape(response['data']['text']);
                            res.send(response);
                        } else {
                            res.send(response);
                        }
                    })

            } catch(err) {
                res.send(err.message);
            }
        } else {
            res.send('Nothing was sent to me');
        }

    });

//update votes for message in pub_messages table in main DB
router.post('/update_votes', passwordless.restricted(), function(req, res){
    if (req.body && req.user){
        try {
            let id = parseInt(req.body['id']);
            let type = parseInt(req.body['type']);
            db.selectVotesInVotes(id, req.user)
                .then(data => {
                    if (data['code']===1){
                        if (data['data'].length === 0){
                            db.updateVotesInPublicMessage(id, type, 1)
                                .then((response)=>{
                                    if (response['code']===1){
                                        db.insertOrUpdateVotesInVotes(id, req.user, type, 0);
                                        //tracking voting
                                        let options_track = {
                                          data: {
                                            id: id,
                                            type: type
                                          }
                                        };
                                        try{
                                          db_track.insertTrackingData('vote for specific message', req.session.class_position, req.session.class_gender, options_track)
                                        }
                                        catch (err){
                                          console.log("Classification data insertion error: ", err);
                                        }

                                        if (req.session.hash_){
                                          uValid.sendAnyEmail(req.session.hash_ + 'type: message voted, code: ' + (type + 3) + ', message_id: '+ id + ', class_position: ' + req.session.class_position, '<h5>'+ req.session.hash_ +'</h5>'+'<p>type: message_voted, code: '+ (type+3) + ', message_id: ' + id + ', class_position: ' + req.session.class_position + '</p>', config.get('Hash.email'), req.session.hash_);
                                        }
                                        res.send(response);
                                    } else {
                                        res.send(response);
                                    }
                                })
                        } else if (data['data'].length === 1 && data['data'][0]['type'] !== type){
                            console.log("DOUBLE VOTING HERE!");
                            db.updateVotesInPublicMessage(id, type, 2)
                                .then((response)=>{
                                    if (response['code']===1){
                                        db.insertOrUpdateVotesInVotes(id, req.user, type, 1);
                                        if (req.session.hash_){
                                          uValid.sendAnyEmail(req.session.hash_ + 'type: message voted, code: ' + (type + 3) + ', message_id: '+ id + ', class_position: ' + req.session.class_position, '<h5>'+ req.session.hash_ +'</h5>'+'<p>type: message_voted, code: '+ (type+3) + ', message_id: ' + id + ', class_position: ' + req.session.class_position + '</p>', config.get('Hash.email'), req.session.hash_);
                                        }
                                        res.send(response);
                                    } else {
                                        res.send(response);
                                    }
                            })
                        }
                    } else {
                        console.log(data);
                    }
                });

        } catch(err) {
            res.send(err.message);
        }
    } else {
        res.send('Nothing was sent to me');
    }

});

    //update temp public message status from the temp DB
    /**
     * @param id - id of the message
     * @param status - desired status of the message (ready for submission  - 0, ready for archiving - 1, back to new - 2);
     */
    router.post('/update_message_status', passwordless.restricted(), function(req, res){
        console.log(req.body);
        uuidVerification(req.user).then((answer) =>{
            if (answer && req.body){
                try {
                    let id = parseInt(req.body['id']);
                    let status = parseInt(req.body['status']);
                    let reason = uValid.validateText(req.body['reason']);
                    db_temp.updateMessageStatus(id, status, reason)
                        .then((response)=>{
                            if (response['code']===1){
                                res.send(response);
                            } else {
                                res.send(response);
                            }
                        })

                } catch(err) {
                    res.send(err.message);
                }
            } else {
                res.send('Nothing was sent to me');
            }
        });

    });


//update temp public message status from the temp DB - REMOTELY
/**
 * @param id - id of the message
 * @param status - desired status of the message (ready for submission  - 0, ready for archiving - 1, back to new - 2);
 * @param admin_hash - should be taken from session
 */
router.post('/update_message_status_remote', passwordless.restricted(), function(req, res){
  console.log(req.body);

  let type = false;
  uuidVerification(req.user).then((answer) =>{
    if (answer && req.body){
      let sess = req.session;
      try {
        let id = parseInt(req.body['id']);
        let status = parseInt(req.body['status']);
        let reason = uValid.validateText(req.body['reason']);
        if (status===0){
          type = true;
        }
        db_temp.updateMessageStatusRemote(id, status, reason, sess.hash_, type)
        .then((response)=>{
          if (response['code']===1){
            res.send(response);
            try{
              let options_track = {
                code: status,
                id: id,
                hash: sess.hash_,
                reason: reason,
                type: type
              };
              db_track.insertTrackingData('moderate: change status of the message', req.session.class_position, req.session.class_gender, options_track)
            }
            catch (err){
              console.log("Classification data insertion error: ", err);
            }
          } else {
            res.send(response);
          }
        })

      } catch(err) {
        res.send(err.message);
      }
    } else {
      res.send('Nothing was sent to me');
    }
  });

});

/**
 * Update temp comment status with remote approach
 * @param id - id of comment
 * @param status - desired status of the comment (ready for submission  - 0, ready for archiving - 1, back to new - 2);
 * @param hash_ - admin hash that will be taken from session
 */
router.post('/update_comment_status_remote', passwordless.restricted(), function(req, res){
  console.log(req.body);
  let type = false;
  uuidVerification(req.user).then((answer) =>{
    if (answer && req.body){
      let sess = req.session;
      try {
        let id = parseInt(req.body['id']);
        let status = parseInt(req.body['status']);
        let reason = uValid.validateText(req.body['reason']);
        if (status===0){
          type = true;
        }
        db_temp.updateCommentStatusRemote(id, status, reason, sess.hash_, type)
        .then((response)=>{
          if (response['code']===1){
            res.send(response);
            try{
              let options_track = {
                code: status,
                id: id,
                hash: sess.hash_,
                reason: reason,
                type: type
              };
              db_track.insertTrackingData('moderate: change status of the comment', req.session.class_position, req.session.class_gender, options_track)
            }
            catch (err){
              console.log("Classification data insertion error: ", err);
            }
          } else {
            res.send(response);
          }
        })

      } catch(err) {
        res.send(err.message);
      }
    } else {
      res.send('Nothing was sent to me');
    }
  });

});

//update temp comment status from the temp DB
/**
 * @param id - id of the message
 * @param status - desired status of the message (ready for submission  - 0, ready for archiving - 1, back to new - 2);
 */
router.post('/update_comment_status', passwordless.restricted(), function(req, res){
  console.log(req.body);
  uuidVerification(req.user).then((answer) =>{
    if (answer && req.body){
      try {
        let id = parseInt(req.body['id']);
        let status = parseInt(req.body['status']);
        let reason = uValid.validateText(req.body['reason']);
        db_temp.updateCommentStatus(id, status, reason)
        .then((response)=>{
          if (response['code']===1){
            res.send(response);
          } else {
            res.send(response);
          }
        })

      } catch(err) {
        res.send(err.message);
      }
    } else {
      res.send('Nothing was sent to me');
    }
  });

});

//update temp public message  from the temp DB
router.post('/update_temp_message', passwordless.restricted(), function(req, res){
    console.log(req.body);
    uuidVerification(req.user).then((answer) =>{
        if (answer && req.body){
            try {
                let id = parseInt(req.body['id']);
                let data = uValid.validateText(req.body['text']);
                let reason = uValid.validateText(req.body['reason']);
                let old_text = uValid.validateText(req.body['old_text']);
                if (data && id && old_text){
                    db_temp.updateTempMessage(id, data, old_text, reason)
                        .then((response)=>{
                            if (response['code']===1){
                                res.send(response);
                              try{
                                let options_track = {
                                  id: id,
                                  hash: req.session.hash_,
                                  reason: reason
                                };
                                db_track.insertTrackingData('moderate: edit message', req.session.class_position, req.session.class_gender, options_track)
                              }
                              catch (err){
                                console.log("Classification data insertion error: ", err);
                              }

                            } else {
                                res.send(response);
                            }
                        })
                }

            } catch(err) {
                res.send(err.message);
            }
        } else {
            res.send('Nothing was sent to me');
        }
    });

});

//update temp  comment  from the temp DB
router.post('/update_temp_comment', passwordless.restricted(), function(req, res){
  console.log(req.body);
  uuidVerification(req.user).then((answer) =>{
    if (answer && req.body){
      try {
        let id = parseInt(req.body['id']);
        let data = uValid.validateText(req.body['text']);
        let reason = uValid.validateText(req.body['reason']);
        let old_text = uValid.validateText(req.body['old_text']);
        if (data && id && old_text){
          db_temp.updateTempComment(id, data, old_text, reason)
          .then((response)=>{
            if (response['code']===1){
              res.send(response);
              try{
                let options_track = {
                  id: id,
                  hash: req.session.hash_,
                  reason: reason
                };
                db_track.insertTrackingData('moderate: edit comment', req.session.class_position, req.session.class_gender, options_track)
              }
              catch (err){
                console.log("Classification data insertion error: ", err);
              }
            } else {
              res.send(response);
            }
          })
        }

      } catch(err) {
        res.send(err.message);
      }
    } else {
      res.send('Nothing was sent to me');
    }
  });

});


//retrieve comments to specific message from the DB
/*
* @param message_id - id of the message which comments we need to get
* @param offset - offset
* order - in which order
 */
router.post('/get_comments', passwordless.restricted(), function(req, res){
    //category=0, order=0, offset=0
    console.log(req.body);
    if (req.body){
        try {
            let id = parseInt(req.body['message_id']);
            let ord = parseInt(req.body['order']);
            let off = parseInt(req.body['offset']);
            db.retrieveMessageComments(id, ord, off)
                .then((response)=>{
                    if (response['code']===1){
                        console.log(response);
                        response['data'].forEach(entry => {
                            entry['text'] = validator.unescape(entry['text']);
                        });
                        res.send(response);
                    } else {
                        res.send(response);
                    }
                })

        } catch(err) {
            res.send(err.message);
        }
    } else {
        res.send('Nothing was sent to me');
    }

});

router.post('/get_mod_comments', passwordless.restricted(), function(req, res){
  //category=0, order=0, offset=0
  console.log(req.body);
  uuidVerification(req.user).then((answer) =>{
    if (answer && req.body){
      try {
        let id = parseInt(req.body['message_id']);
        let ord = parseInt(req.body['order']);
        let off = parseInt(req.body['offset']);
        db_temp.retrieveMessageComments(id, ord, off)
        .then((response)=>{
          if (response['code']===1){
            console.log(response);
            response['data'].forEach(entry => {
              entry['text'] = validator.unescape(entry['text']);
            });
            res.send(response);
          } else {
            res.send(response);
          }
        })

      } catch(err) {
        res.send(err.message);
      }
    } else {
      res.send('Nothing was sent to me');
    }
  });

});

//retrieve categories
router.get('/categories', passwordless.restricted(), (req, res, next) => {
    db.retrieveCategories(1).then((answer) =>{
        if (answer['code']===1){
            res.send(answer);
        }
        else {
            console.log(answer['data']);
        }
    })
        .catch (error =>{
            console.log("Something went wrong while retrieving data for categories");
            console.log(error);
        });
});

router.post('/feedback', function(req, res){
  //TODO validate inputs properly via seperate validate function like validate(data_to_validate, data_type_to_validate_to, default_value);
  if (req.body['recaptcha']){
    request({
          uri: "https://www.google.com/recaptcha/api/siteverify",
          method: "POST",
          json: true,
          form: {"secret": "6LeITCoUAAAAACksfpYqsoPMS9ptue7-2f9bnW8T", "response": req.body['recaptcha']}
        },
        function (error, response, body){
          if (!error && response.statusCode === 200 && body['success'] === true) {
            req.body['message'] = uValid.validateText(req.body['message']);
            if (req.body['message']) {
              let feedback_categories = [
                'Other',
                'Suggestion',
                'Complaint',
                'Error',
                'General'];
              if (!req.body['author']) {
                req.body['author'] = 'anonymous'
              }
              if (!req.body['contact_email']) {
                req.body['contact_email'] = 'none@none.co.uk'
              }
              let categories = [];
              let cat_name = [];
              console.log(req.body);
              categories.push(parseInt(req.body['categories']));
              cat_name.push(
                  feedback_categories[parseInt(req.body['categories'])]);
              db_temp.insertFeedback(req.body['message'], req.body['author'], categories, cat_name, req.body['contact_email'])
              .then((response) => {
                    if (response && response['code'] === 1) {
                      let options_track ={
                        data: {
                          category: cat_name
                        }
                      };

                      try{
                        db_track.insertTrackingData('left feedback', req.session.class_position, req.session.class_gender, options_track)
                      }
                      catch (err){
                        console.log("Classification data insertion error: ", err);
                      }

                      res.send("Message saved");
                    } else if (response && response['code'] === 0) {
                      res.send(
                          "Something went wrong! Can\'t save the feedback message");
                    }
                  })
                  .catch(error => {
                console.log('Feedback error: ', error);
              })
            } else {
              res.send("Empty or wrong feedback message has been provided");
            }
          } else {
              console.log ('something went wrong: ', error);
              res.send({"email": "<span style='color: red; font-weight: bold'>Error:</span> something went wrong. Please check if you opt-in captcha and typed your required fields"});
            }
          });

  } else res.send(
      {'email': "<span style='color: red; font-weight: bold'>Error:</span> please do not forgot to tick-in recaptcha"});


});




/**
 *  ====================== POST routes for polls ==============================
 */

//create new poll
router.post('/poll_create', passwordless.restricted(), (req, res)=> {
  //display data
  if (req.session.role ==='suppa'){
    console.log("This is object before validation: ", req.body);
    req.body["question"] = uValid.validateText(req.body["question"]);
    req.body["options"] = uValid.validateTextArrayJSON(req.body["options"], "option");
    console.log("This is object after validation: ", req.body);
    if (req.body["question"] && req.body["options"]) {
      console.log("Passed successfully");
      req.body["options"].forEach(function(element, index) {
        element.option_num = index;
      });
      db.createNewPoll(req.body["question"], req.body["options"])
      .then(response => {
        console.log("THIS IS RESPONCE FROM DB: ");
        console.log(response);
        res.send(response);
      })
      .catch(error => {
        console.log(error)
      })
    } else {
      res.send("Something not true");
      console.log("Something not true");
    }
  } else {
    res.send("Unauthorised");
    console.log("Unauthorised");
  }

});

//vote in specific poll
router.post('/poll_vote', passwordless.restricted(), (req, res) => {
  //req.session.hash_ = '92b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  if ((!isNaN(req.body['pollId'])) && (!isNaN(req.body['optionNum'])) && req.session.hash_){
    //req.body['pollId'] = parseInt(req.body['pollId']);
    //req.body['optionNum'] = parseInt(req.body['optionNum']);
    db.voteInSpecificPoll(req.body['pollId'], req.body['optionNum'], req.session.hash_)
        .then(response => {
          let answer = {};
            if (response['code'] === 1 && response['data'] && response['data'].length){
              // if (response.data[0].overall_votes && response.data[0].overall_votes > 5){
                answer.code = response.code;
                answer.id = response.data[0].question_id;
                answer.question = validator.unescape(response.data[0].question);
                answer.overall_votes = parseInt(response.data[0].overall_votes);
                answer.post_link = response.data[0].post_link;
                let data = {};
                for (let i=0; i<response.data.length; i++){
                  data[i] = {};
                  data[i].option_id = response.data[i].option_id;
                  data[i].option_num = response.data[i].option_num;
                  data[i].option = response.data[i].option;
                  data[i].votes = Math.floor((response.data[i].votes / answer.overall_votes) * 100);
                }
                answer.data = data;
                res.send(answer);
              // }
              // else {
              //   answer.code = 0;
              //   answer.data = 'thank you for casting your vote';
              //   res.send(answer);
              // }

          } else {
              answer.code = 0;
              answer.data = 'Erroneous system response has been received';
              res.send(answer);
          }


          //res.send(response);
          let options_track = {
            data: {
              pollId: req.body['pollId'],
              option: req.body['optionNum']
            }
          };
          try{
            db_track.insertTrackingData('voted in poll', req.session.class_position, req.session.class_gender, options_track)
          }
          catch (err){
            console.log("Classification data insertion error: ", err);
          }
    })
        .catch(error => {
          console.log("Error in voting router: ", error);
          res.send("Error occurred during voting")
    })
  } else {
    res.send("Something wrong with your request data");
  }
});


//toggle publish state of a poll (make it visible/invisible for users
/**
 * @param req.body["pollId"] - id of the poll
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @return "pollId": integer, "published": bolean
 */
router.post('/poll_publish', passwordless.restricted(), (req, res) => {
  //req.session.hash_ = '72b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  if ((!isNaN(req.body['pollId'])) && req.session.hash_){
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
    db.togglePublishStatusPoll(req.body['pollId'])
        .then(response => {
          res.send(response)
    })
        .catch(error =>{
          console.log("Error in voting router: ", error);
          res.send("Error occurred during toggling")
    })
  } else {
    res.send("Something wrong with your request data");
  }
});

/**
 * @param req.body["pollId"] - id of the poll
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @return "pollId": integer, "activate": boolean
 */
//toggle activation state of a  poll (make it votable/not-votable)
router.post('/poll_activate', passwordless.restricted(), (req, res) => {
  //req.session.hash_ = '72b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  if ((!isNaN(req.body['pollId'])) && req.session.hash_){
    //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
    db.toggleActivateStatusPoll(req.body['pollId'])
    .then(response => {
      res.send(response)
    })
    .catch(error =>{
      console.log("Error in voting router: ", error);
      res.send("Error occurred during toggling")
    })
  } else {
    res.send("Something wrong with your request data");
  }

});

/**
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @param type - type of the filter (0- by default only published and active, 42- all (for super moderators)
 * @return list of all polls corresponding to applied filter
 */
//get list of all polls (0- by default only published and active, 42- all (for super moderators)
router.get('/poll_get_all', passwordless.restricted(), (req, res, next) => {

  //req.session.hash_= '32b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  //req.session.hash_ = '72b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';

  if (req.session.hash_){
    let type = 0;
    let user_hash = req.session.hash_;
    let mod_user = false;
    //let option_array = [];
    if (req.session.class_position && req.session.class_position === 'moderator'){
      mod_user = true
    }
    //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
    if ((!isNaN(req.body['type'])) && (req.body['type'] === 42)){
      type = parseInt(req.body['type'])
    }

    db.get_all_polls(type, user_hash, mod_user)
        .then(response => {
          if (response.data.length === 0){
            response.code = 0;
          } else {
            response.data.forEach(poll => {
              poll.question = validator.unescape(poll.question);
              poll.options_array.forEach(options => {
                options.option = validator.unescape(options.option);
              });
              //for (var i=0; i< poll['options_array'].length; i++){
                //poll['options_array'][i]['option'] = validator.unescape(poll['options_array'][i]['option']);
              //}
            })
          }
          res.send(response)
    })
        .catch(error => {
          console.log("Error in voting router: ", error);
          res.status(500).send("Error occurred during pulling polls")
    })
  } else {
    res.status(500).send("Something wrong with your request data");
  }

});

/**
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @return list of all polls corresponding to applied filter
 */
//get list of all polls (0- by default only published and active, 42- all (for super moderators)
router.get('/poll_results', passwordless.restricted(), (req, res, next) => {
  if (req.session.hash_){
    let mod_user = false;
    //let option_array = [];
    if (req.session.class_position && req.session.class_position === 'moderator'){
      mod_user = true
    }
    if (!mod_user) res.status(401).send('Access Denied');
    else {
      db.get_all_polls_results(mod_user)
      .then(response => {
        console.log(response);
        if (response.data.length === 0){
          response.code = 0;
        } else {
          response.data.forEach(poll => {
            poll.question = validator.unescape(poll.question);
            delete poll.options_array;
            // poll.options_array.forEach(options => {
            //   options.option = validator.unescape(options.option);
            // });
          })
        }
        res.status(200).send(response)
      })
      .catch(error => {
        console.log("Error in voting router: ", error);
        res.status(500).send("Error occurred during pulling polls")
      })
    }
  } else {
    res.status(500).send("Something wrong with your request data");
  }

});

/**
 * @param req.body["pollId"] - id of the poll
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @return "pollId": integer, "amount": integer
 * this router should be available only for admins
 */
//amount of voted users in specific poll
router.post('/poll_amount_voted', passwordless.restricted(), (req, res) => {
  //req.session.hash_ = '72b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  if ((!isNaN(req.body['pollId'])) && req.session.hash_) {
    //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
    req.body['pollId'] = parseInt(req.body['pollId']);
    db.getPollVotes(req.body['pollId'])
        .then(response => {
          res.send(response)
    })
        .catch(error => {
          console.log("Error in pulling votes router: ", error);
          res.send("Error occurred during pulling votes count")
    })
  } else {
    res.send("Something wrong with your request data");
  }
});

/**
 * dummy endpoint for
 */

/**
 * @param req.params.id - id of the poll
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @return "pollId": integer, "array of options and results": nested array/object
 */
//get results of a poll
//ONLY FOR ADMINS
router.get('/poll_results/:id', passwordless.restricted(), (req, res) => {
  let answer = {};
  let mod_user = false;
  //req.session.hash_ = '72b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
  if (req.params.id && (!isNaN(req.params.id)) && req.session.hash_){
    if (req.session.class_position && req.session.class_position === 'moderator'){
      mod_user = true
    }
    //req.body['pollId'] = parseInt(req.body['pollId']);
    if (!mod_user) res.status(401).send('Access Denied');
    else {
      db.getPollResult(req.params.id)
      .then(response => {
        if (response['code'] === 1 && response['data'] && response['data'].length){
          answer.code = response.code;
          answer.id = response.data[0].question_id;
          answer.question = validator.unescape(response.data[0].question);
          answer.published = response.data[0].published;
          answer.active = response.data[0].active;
          answer.overall_votes = response.data[0].overall_votes;
          let data = {};
          for (let i=0; i<response.data.length; i++){
            data[i] = {};
            data[i].option_id = response.data[i].option_id;
            data[i].option_num = response.data[i].option_num;
            data[i].option = response.data[i].option;
            data[i].votes = response.data[i].votes;
          }
          answer.data = data;
          res.send(answer);

        } else {
          res.send("Erroneous system response has been received")
        }
      })
      .catch(error => {
        console.log("Error in pulling poll results: ", error);
        res.send("Error occurred during pulling poll results")
      })
    }
  } else {
    res.send("Something wrong with your request data");
  }

});

/**
 * @param req.body["pollId"] - id of the poll
 * @param req.session.hash_ - user's hash to check if she/he super admin
 * @return "pollId": integer, "deletion status": boolean
 */
//delete poll (available only if non-one voted so far)
router.post('/poll_delete', passwordless.restricted(), (req, res) => {
  //req.session.hash_ = '72b341b8d1dfad760d84c9e78414c7631fe1b686c4426e92c19a2187631cbb1a2fc2561670d54b54028a8612f3b8cb2a3b22ce770ea20c23908079f7f5045462';
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
  if ((!isNaN(req.body['pollId'])) && req.session.hash_){
    req.body['pollId'] = parseInt(req.body['pollId']);
    db.deletePoll(req.body['pollId'])
        .then(response => {
          res.send(response)
    })
        .catch(error => {
          console.log("Error in pulling poll results: ", error);
          res.send("Error occurred during pulling poll results")
    })
  } else {
    res.send("Something wrong with your request data");
  }
});


module.exports = router;

//supplementary function for checking email against the list of valid email
function checkEmailinDB(email, hash=''){
  let email_to_check = '';
  email = uValid.validateEmail(email);
    if (config_auth_type === 0 && email){
      email_to_check = email;
    } else {
      email_to_check = hash;
    }
    let db_answer = db.checkEmail(email, hash);
    return new Promise((resolve, reject) => {
        db_answer.then((answer) =>{
            let address = null;
            //let result = {};
            console.log('Retrieved from DB in resService: ', answer);
            if (answer['code'] === 1){
                if (answer['data']['personal_email']===null || answer['data']['personal_email']===''){
                    address = [email, email, false, false, false, answer['data']['subscription'], answer['data']['email'], false];
                } else {
                    address =[answer['data']['personal_email'], email, true, false, false, answer['data']['subscription'], answer['data']['email'], false];
                }
                //Checking if the user is moderator orr super admin
                //if moderator
                if (answer['data']['type']===15){
                    address[3] = true
                }
                //if suppa moderator
                else if (answer['data']['type']===29){
                  address[3] = true;
                  address[4] = true;
                }
                //official representative
                else if (answer['data']['type']===13) {
                  address[7] = answer['data']['title'];
                }
                //if official representative and moderator
                else if (answer['data']['type']===16) {
                  address[3] = true;
                  address[7] = answer['data']['title'];
                }
                //send email to the specified address
                console.log('Sending token via email...');

            }
            else
              console.log("Email checker returned code: ", answer['code']);
            console.log("Address is "+ address);
            resolve(address);
        }).catch((error) =>{
            console.log('Error in resService: ', error);
            reject(error);
        });
    });

}

//TODO clean up the mess with the redunted slashes
function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function uuidVerification(uuid) {
    uuid = uValid.validateText(uuid);
    let bool = false;
    return new Promise((resolve, reject) => {
        db.checkAdmin(uuid)
            .then(data => {
                if ((data['code'] === 1) && (data["data"]["uuid"] === uuid)){
                    let moders = config.get('moderators');
                    for (var i = moders.length -1; i>=0; i--){
                        if((moders[i]["name"] === data["data"]["email"])/*Should add check for time no more that 1 hour*/){
                            bool = true;
                            break;
                        } else  {
                            bool =  false;
                        }
                    }
                } else {
                    bool =  false;
                }
                resolve(bool);
            })

    });

}
