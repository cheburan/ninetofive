const express = require('express');
let uValid = require('../controllers/additions/useful_func');
let validator = require('validator');
let passwordless = require('passwordless');

let config = require('config');
const api_crypto = require('crypto');
let token = require('../controllers/VerifyJWTToken');
let api_description = require('../model/ExternalAPI_v1');

const app = express();
const router = express.Router();

let mongo_db = require('../controllers/DbApi_v1');
let db = require('../controllers/DbService');
let db_track = require('../controllers/DbServiceTracking');


let bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

let User = require('../model/UserAPI_v1');

/**
 * LIST OF ALL METHODS
 */
router.options('/', (req, res) => {
  return res.status(200).send(api_description);
});

/**
 * PART OF API RESPONSIBLE FOR API USERS REGISTRATION AND LOGIN AND LOGOUT
 * =============================================================================
 */

/**
 * Register as a new API user
 */
//TODO Finish this API endpoint
router.post('/register', /*passwordless.restricted(),*/ (req,res) => {

  if (!req.body.user || !req.body.password || !req.body.name) {
    return res.status(403).send({ auth: false, err: "Not all fields were received please check your request" });
  } else {
    User.findOne({email: req.body.user}, (err, user) => {
      if (err) return res.status(500).send({ auth: false, err: "There was during checking user's existence" });
      if (!user) {
        //create Hmac
        let salt = api_crypto.randomBytes(128).toString('hex');
        let hashedPassword = uValid.hashingString(req.body.password, salt);
        //let hashedPassword = api_crypto.createHmac('sha512', salt);
        //hashedPassword.update(req.body.password);
        //console.log(hashedPassword.digest('hex'));

        User.create ({
              name: req.body.name,
              email: req.body.user,
              password: hashedPassword,
              salt: salt
            },
            (err, user) =>{
              if(err) return res.status(500).send({ auth: false, err: "There was a problem registering the user." });
              let jwt = token.createToken(user._id);
              return res.status(200).send({ auth:true, token: jwt});
            });
      } else {
        res.status(500).send({ auth: false, err: "User with this email already exist"})
      }
    });

  }

});

/**
 * Login for already registered API user
 */
router.post('/login', (req,res) => {
  if (!req.body.user || !req.body.password) {
    return res.status(403).send({ auth: false, err: "Not all fields were received please check your request" });
  } else {
    User.findOne({email: req.body.user}, (err, user) => {
      if (err) return res.status(500).
          send(
              {auth: false, err: "There was during checking user's existence"});
      if (!user) return res.status(404).
          send({auth: false, err: "No user found"});
      let receivedPassword = uValid.hashingString(req.body.password, user.salt);
      if (!(user.password === receivedPassword)) return res.status(401).
          send({auth: false, token: null});

      //create and send token
      let jwt = token.createToken(user._id);
      res.status(200).send({ auth:true, token: jwt});
    })
  }

});

/**
 * Change password for existing user
 */
router.patch('/change_pass', token.verifyToken, (req,res) => {
  //TODO check if all req.body.paparms exist. apperently string below is not enought
  if (!req.body.email || (req.body.email == 'undefined') || !req.body.old_password || (req.body.old_password == 'undefined') || !req.body.new_password || (req.body.new_password == 'undefined') || !req.userId) {
    return res.status(403).send({ auth: false, err: "Not all fields were received please check your request" });
  } else {
    User.findOne({email: req.body.email}, (err, user) => {
      if (err) return res.status(500).send({auth: false, err: "There was during checking user's existence"});
      if (!user) return res.status(404).send({auth: false, err: "No user found"});
      if (!(req.userId === user._id.toString())) return res.status(401).
          send({auth: false, err: "Contradiction between used token and updated user. Please check submitted credentials"});

      //checking that request was received from this user
      let receivedPassword = uValid.hashingString(req.body.old_password, user.salt);
      if (!(user.password === receivedPassword) || (receivedPassword == undefined)) return res.status(401).
          send({auth: false, err: "Invalid credentials were submitted. Please check your login or(and) password"});

      //change password
      let newPassword = uValid.hashingString(req.body.new_password, user.salt);
      User.update({_id: req.userId},{
        name: user.name,
        email: user.email,
        password: newPassword,
        salt: user.salt
      }, {new: true}, (err, updated_user) => {
        if(err) return res.status(500).send({ auth: false, err: "There was a problem updating password for the user." });
        return res.status(200).send({ auth:true, message: "Password for user was updated successfully"});
      })
    })
  }
});

/**
 *
 */


/**
 * PART OF API FOR RETRIEVING DATA REGARDING TRACKINGS
 * =============================================================================
 */

/**
 * RETRIEVE THE LIST AND COUNT OF TRACKED ACTIONS
 */
router.get('/stats/tracking_actions_list', token.verifyToken, (req,res) => {
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
  db_track.retrieveActionTypes()
  .then(response => {
    return res.status(200).send(response);
  })
  .catch(error => {
    console.log("Error in pulling tracking actions results: ", error);
    return res.status(500).send("Error occurred during pulling tracking actions list")
  })

});

/**
 * RETRIEVE THE LIST OF Users Classification types
 */
router.get('/stats/tracking_users_classification_list', token.verifyToken, (req,res) => {
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE

  db_track.retrieveUsersClassificationTypes()
  .then(response => {
    return res.status(200).send(response);
  })
  .catch(error => {
    console.log("Error in pulling tracking users classification results: ", error);
    return res.status(500).send("Error occurred during pulling tracking users classification list")
  })

});

/**
 * RETRIEVE THE TRACKED ACTIONS
 */
router.get('/stats/tracking_actions', token.verifyToken, (req, res) => {
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
  if(!req.query.action || (req.query.action ==="") || (req.query.action === " ")) req.query.action = '%';
  else {
    req.query.action = validator.escape(req.query.action);
  }
  if(!req.query.offset || (isNaN(req.query.offset)) || (req.query.offset < 0)) req.query.offset = 0;

  db_track.retrieveActions(req.query.action, req.query.offset)
  .then(response => {
    return res.status(200).send(response);
  })
  .catch(error => {
    console.log("Error in pulling tracking actions: ", error);
    return res.status(500).send("Error occurred during pulling actions")
  });
});

/**
 * RETRIEVE AMOUNT OF VIEWS of SPECIFIC THREAD
 */
router.get('/stats/views', token.verifyToken, (req, res) => {
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
  if(!req.query.thread_id || (isNaN(req.query.thread_id)) || (req.query.thread_id < 0)) {
    return res.status(500).send({"error":"Please specify 'thread_id' query parameter"});
  }
  else {
    db_track.retrieveViewsOfTheThread(req.query.thread_id)
    .then(response => {
      return res.status(200).send(response);
    })
    .catch(error => {
      console.log("Error in pulling tracking views: ", error);
      return res.status(500).send("Error occurred during pulling views")
    });
  }
});

/**
 * RETRIEVE AMOUNT OF COMMENTS BY USERS CLASS
 */
router.get('/stats/comments_posted', token.verifyToken, (req, res) => {
  //TODO: CHECK FOR SUPERADMIN RIGHTS HERE
  if(!req.query.thread_id || (isNaN(req.query.thread_id)) || (req.query.thread_id < 0)) {
    return res.status(500).send({"error":"Please specify 'thread_id' query parameter"});
  }
  else {
    db_track.retrieveAmountOfCommetsInTheThread(req.query.thread_id)
    .then(response => {
      return res.status(200).send(response);
    })
    .catch(error => {
      console.log("Error in pulling tracking views: ", error);
      return res.status(500).send("Error occurred during pulling amount of commets")
    });
  }
});

/**
 * ============================================================================
 */

/**
 * PART OF API FOR RETRIEVING DATA
 * ============================================================================
 */

/**
 * RETRIEVE list of categories from the DB
 */
router.get('/categories', token.verifyToken, (req, res, next) => {
  db.retrieveCategories(1).then((answer) =>{
    if (answer['code']===1){
      return res.status(200).send(answer);
    }
    else {
      console.log(answer['data']);
      return res.status(500).send(answer);

    }
  })
  .catch (error =>{
    console.log("Something went wrong while retrieving data for categories");
    console.log(error);
    return res.status(500).send('SOmething went wrong while retrieving list of available categories');
  });
});

/**
 * RETRIEVE THREADS/MESSAGES OF SPECIFIC CATEGORY (by category id)
 */
router.get('/threads', token.verifyToken, (req, res, next) => {
  if(!req.query.category_id || (isNaN(req.query.category_id)) || (req.query.category_id < 0)) req.query.category_id = 0;
  else {
    req.query.category_id = parseInt(req.query.category_id);
  }
  if(!req.query.offset || (isNaN(req.query.offset)) || (req.query.offset < 0)) req.query.offset = 0;
  else {
    req.query.offset = parseInt(req.query.offset);
  }
  if(!req.query.order || (isNaN(req.query.order)) || (req.query.order < 0)) req.query.order = 3;
  else {
    req.query.order = parseInt(req.query.order);
  }
  if(!req.query.scope || (isNaN(req.query.scope)) || (req.query.scope < 0)) req.query.scope = 0;
  else {
    req.query.scope = parseInt(req.query.scope);
  }

  db.retrievePublicMessages(req.query.category_id, req.query.order, req.query.offset, req.query.scope)
  .then((response)=>{
    if (response['code']===1){
      let options_track = {
        data: {
          cat_number: req.query.category_id,
          order: req.query.order,
          offset: req.query.offset,
          scope: req.query.scope
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
      return res.status(200).send(response);
    } else {
      console.log(response);
      return res.status(404).send(response);
    }
  })
  .catch((error) => {
    console.log("Error in threads API endpoint: ", error);
    return res.status(500).send({ err: "internal error while retrieving threads data"})
  })



});

/**
 * RETRIEVE COMMENTS FOR SPECIFIC MESSAGE (by thread/message id)
 */
/**
 * RETRIEVE THREADS/MESSAGES OF SPECIFIC CATEGORY (by category id)
 */
router.get('/comments', token.verifyToken, (req, res, next) => {
  if(!req.query.thread_id || (isNaN(req.query.thread_id)) || (req.query.thread_id < 0)) return res.status(500).send({ err: "Please specify thread_id"});
  else {
    req.query.thread_id = parseInt(req.query.thread_id);
  }
  if(!req.query.offset || (isNaN(req.query.offset)) || (req.query.offset < 0)) req.query.offset = 0;
  else {
    req.query.offset = parseInt(req.query.offset);
  }
  if(!req.query.order || (isNaN(req.query.order)) || (req.query.order < 0)) req.query.order = 3;
  else {
    req.query.order = parseInt(req.query.order);
  }

  db.retrieveMessageComments(req.query.thread_id, req.query.order, req.query.offset)
  .then((response)=>{
    if (response['code']===1){
      let options_track = {
        data: {
          thread_id: req.query.thread_id,
          order: req.query.order,
          offset: req.query.offset
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
      return res.status(200).send(response);
    } else {
      console.log(response);
      return res.status(404).send(response);
    }
  })
  .catch((error) => {
    console.log("Error in comments API endpoint: ", error);
    return res.status(500).send({ err: "internal error while retrieving comments data"})
  })



});

/**
 * ============================================================================
 */

module.exports = router;