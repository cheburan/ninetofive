const express = require('express');

let passwordless = require('passwordless');
let config = require('config');
const app = express();
const router = express.Router();
let token = require('../controllers/VerifyJWTToken');

let uValid = require('../controllers/additions/useful_func');

let db = require('../controllers/DbService');
let db_temp = require('../controllers/DbServiceModerate');
let db_track = require('../controllers/DbServiceTracking');
let validator = require('validator');

let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

/**
 *
 */
router.get('/class_data/:uuid', passwordless.restricted(), (req, res) => {
  let answer = {};
  if (req.params.uuid && (!isNaN(req.params.uuid))) {
    return new Promise ((resoleve, reject) => {
      db_track.retrieveClassificationDataByUuid(req.params.uuid)
      .then(response => {
        if (response.code === 1){
          console.log('Ive found: ', response);
          answer.class_position = response.data.class_position;
          answer.class_gender = response.data.class_gender;
        } else {
          answer.class_position = 'unidentified';
          answer.class_gender = 'unidentified';
        }
        try{
          db_track.insertTrackingData('accessed browse page', answer.class_position, answer.session.class_gender)
        }
        catch (err){
          console.log("Classification data insertion error: ", err);
        }
        answer.code = 1;
        res.status(200).send(answer);
      })
      .catch(error => {
        answer.class_position = 'unidentified';
        answer.class_gender = 'unidentified';
        console.log(error);
        answer.code = 1;
        res.status(200).send(answer);
      })
    })
  } else {
    answer = {
      code: 0,
      message: "No uuid were provided"
    };
    res.status(404).send(answer);
  }
});

/**
 *
 */
router.put('/class_log', token.verifyToken, (req, res, next) => {
  console.log(req.body);
  if (req.body.action ) {
    if (!req.body.position || !req.body.gender) {
      req.body.poisition = 'unclassified';
      req.body.gender = 'unidentified';
    }
    if (!req.body.options){
      req.body.options = {}
    }
    db_track.insertTrackingData(req.body.action, req.body.position, req.body.gender, req.body.options);
    //   .then(response => {
    //     console.log('3----');
    //     console.log('[BACK]: Action:' + req.body.action + ' is logged');
    //     return res.status(200).send('Data logged');
    //   })
    //   .catch(error => {
    //     console.log('4----');
    //     console.log('[BACK]: Error while inserting log data:', error);
    //     return res.status(500).send('Error while logging');
    //   });
    // } else {
    //   console.log('5----');
    //   return res.status(500).send('No valid data was provided');
    // }
  }
  console.log('[BACK]: Action: \"' + req.body.action + '\" is logged');
  return res.status(200).send("Done");
});

router.get('/get_post/:id', token.verifyToken, (req,res,next) => {
  let answer = {};
  if (req.params.id && (!isNaN(req.params.id))) {
      db.retrieveOnePublicMessage(req.params.id)
          .then( data => {
            console.log("[BACK] Sending: ", data);
            answer = data;
            res.status(200).send(answer)
      })
          .catch(err => {
            answer = {
              code: 0,
              message: err.message
            };
            res.status(500).send(answer);
      })
  } else {
    answer = {
      code: 0,
      message: "No post id were provided"
    };
    res.status(404).send(answer);
  }
});


/**
 *
 * @type {Router|router}
 */
router.get('/check_role/:user', token.verifyToken, (req,res, next) => {
  console.log("[UserChecK_BACKEND]: I'm checking users role");
  let answer = {};
  let bool =false;
  let type = 0;
  if (req.params.user) {
    return new Promise ((resolve, reject) => {
      db.checkAdmin(req.params.user, 0)
          .then(data => {
            if ((data['code'] === 1)){
              console.log('UUID BELONGS TO ADMIN');
              type = data['data']['type'];
              bool = true;
              console.log('FOUND ADMIN');
            } else {
              type = 0;
              bool = false;
            }
            answer.code = 1;
            answer.bool = bool;
            answer.type = type;
            console.log("THIS IS WHAT CHECJ_RLE RESPOND WITH: ", answer);
            res.status(200).send(answer);
      })
          .catch(error => {
            console.log('This is uuidAdmin error: ' + error);
            answer.code= 0;
            answer.bool = bool;
            answer.type = 0;
            res.status(404).send(answer);
      })
    })
  } else {
    answer = {
      code: 0,
      message: "No uuid were provided"
    };
    res.status(200).send(answer);
  }
});

/**
 *
 * @type {Router|router}
 */
router.get('/get_all_polls/:user', token.verifyToken, (req,res, next) => {
  console.log("[PollsCheck_BACKEND]: I'm checking polls for user");
  let answer = {};
  let bool =false;
  if (req.params.user) {
    return new Promise ((resolve, reject) => {
      db.get_all_polls(0, req.params.user)
      .then(response => {
        if ((response['code'] === 1)){
          response.data.forEach(poll => {
            poll.question = validator.unescape(poll.question);
            poll.options_array.forEach(options => {
              options.option = validator.unescape(options.option);
            });
          })
        }
        answer = response;
        res.status(200).send(answer);
      })
      .catch(error => {
        console.log('This is PollsRetrievingError: ' + error);
        answer.code= 0;
        answer.bool = bool;
        answer.type = 0;
        res.status(404).send(answer);
      })
    })
  } else {
    answer = {
      code: 0,
      message: "No user were provided"
    };
    res.status(200).send(answer);
  }
});

/**
 * Retrieving categories
 */
router.get('/retrieve_all_categories/:type', token.verifyToken, (req,res, next) => {
  let type = parseInt(req.params.type);
  if (Number.isInteger(type)){
    return new Promise((resolve, reject) => {
      db.retrieveCategories(type)
      .then((answer) =>{
        if (answer['code']===1){
          res.status(200).send(answer);
        }
        else {
          res.status(500).send({code: 0, message: "Can't retrieve categories from the server"})
        }
      })
      .catch (error =>{
        console.log("Something went wrong while retrieving data for message creation");
        console.log(error);
        res.status(500).send({code: 0, message: "Something went wrong while retrieving data for message creation"});
      });
    });
  } else {
    console.log("inside the error");
    res.status(404).send({code: 0, message: "No data was provided"})
  }
});

/**
 * check presense of the session_id record for changing email procedure
 */
router.post('/check_temp_email', token.verifyToken, (req, res, next) => {
  let [session_id, session_uuid, passcode, usage_flag] = [uValid.validateText(req.body.session_id), uValid.validateText(req.body.session_uuid), uValid.validateText(req.body.passcode), req.body.usage_flag];
  if (req.body.session_id && req.body.session_uuid && req.body.passcode && req.body.usage_flag){
  } else {

  }

});

module.exports = router;