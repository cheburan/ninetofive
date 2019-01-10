/**
 * Created by Dinislam
 */
let config = require('config');
const token = config.get("Environment.backend_token");

let axios = require('axios');

//in memory-cache
const cache = require('memory-cache-ttl');

/**
 *
 * @constructor
 */
function Classification() {

}

/**
 *
 * @param options
 * @return {Function}
 */
Classification.check = function(options) {
  return function(req, res, next){
    console.log("THIS is CACHE STATUS", cache.get('cache'));
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
    //get user's clasification for stats
    if ((!req.session.class_position && !req.session.class_gender) || (req.session.class_position === undefined || req.session.class_gender === undefined)){
      console.log('trying to find by uuid');
      //get class data
      axios.get(options.backendAddress + '/internal/class_data/' + req.session.passwordless)
      .then(response => {
        if (response.code === 1){
          console.log('[CLASSIFICATION_CHECK]: Ive found: ', response);
          req.session.class_position = response.data.class_position;
          req.session.class_gender = response.data.class_gender;
        } else {
          req.session.class_position = 'unidentified';
          req.session.class_gender = 'unidentified';
        }
      })
      .catch(error => {
        req.session.class_position = 'unidentified';
        req.session.class_gender = 'unidentified';
        console.log(error);
      });
      next();
    }
    else {
      console.log('[CLASSIFICATION_CHECK]: Nothing to CHECK');
      next();
    }
  }
};

/**
 *
 * @param options
 * @return {Function}
 */
Classification.log = function(options) {
  return function(req, res, next) {
    console.log("THIS is CACHE STATUS in log", cache.get('cache'));
    let data = {data: {}};
    if (options.actionCode){
      switch (options.actionCode) {
        case 1:
          data.data = {post_id: req.query.id};
          break;
        default:
          break
      }
    }
    if (!req.session.hash_) {
      data.data.error = "user without hash";
    }
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
    axios.put(options.backendAddress + '/internal/class_log/', {
      action: options.actionType,
      position: req.session.class_position,
      gender: req.session.class_gender,
      options: data
    })
    .then(response => {
      console.log("Classification data inserted successfully: ", response.data)
    })
    .catch(error => {
      console.log("Classification data insertion request error: ", error.message, ": \n", error.response.data);
    });
    next();
  }
};

module.exports = Classification;