/**
 * Created by Dinislam
 */
let config = require('config');
const BACKEND_ADDRESS = config.get('Environment.backend_host');
let axios = require('axios');
//in memory-cache
const cache = require('memory-cache-ttl');

module.exports = {

  getAllPolls: (req, res, next) => {
    if (req.session.hash_) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
      axios.get(BACKEND_ADDRESS + '/internal/get_all_polls/' + req.session.hash_)
      .then(response => {
        res.locals.polls = response.data;
        next()
      })
      .catch(error => {
        res.locals.polls = {
          code: 0
        };
        next()
      })
    } else {
      console.log("User without HASH_ HERE");
    }
  }
};