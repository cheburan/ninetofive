/**
 * Created by Dinislam
 */
let config = require('config');
const BACKEND_ADDRESS = config.get('Environment.backend_host');
//in memory-cache
const cache = require('memory-cache-ttl');

let axios = require('axios');
const validator = require('validator');

module.exports = {
  /**
   *
   */
  adminCheck: (req, res, next) => {
    if (req.session.moderator &&
        (req.session.user_type === "moderator" || req.session.user_type ===
            "super_moderator")) {
      console.log("No neeed to check permissions, already: ",
          req.session.user_type);
      next()
    } else {
      console.log("[UserCheck]: This is the user: ", req.user);
      req.user = validator.blacklist(req.user, "$=\\/<>");
      if (!validator.isEmpty(req.user)) {
        axios.defaults.headers.common['Authorization'] = 'Bearer ' +
            cache.get('token');
        axios.get(BACKEND_ADDRESS + '/internal/check_role/' + req.user).
            then(response => {
              console.log('[UserCheck_RESPONSE_JOPPPAAA]: ', response.data);
              if (response.data.code === 1) {
                if (response.data.bool === true) {
                  req.session.moderator = true;
                  switch (response.data.type) {
                    case 15:
                      req.session.user_type = "moderator";
                      break;
                    case 29:
                      req.session.user_type = "super_moderator";
                      break;
                    default:
                      req.session.user_type = "user";
                  }
                } else {
                  req.session.moderator = false;
                  req.session.user_type = "user";
                }
              } else {
                req.session.moderator = false;
                req.session.user_type = "user";
                console.log("[UserCheck]: This is your Session_code=0: ",
                    req.session);
                next()
              }
              console.log("[UserCheck]: This is your Session_then: ",
                  req.session);
              next()

            }).
            catch(error => {
              console.log("[UserCheck]: Error while checking role ", error);
              req.session.moderator = false;
              req.session.user_type = "user";
              console.log("[UserCheck]: This is your Session_catch: ",
                  req.session);
              next()
            })
      } else {
        req.session.moderator = false;
        eq.session.user_type = "user";
        console.log("[UserCheck]: This is your Session_external_else: ",
            req.session);
        next()
      }
    }
  }
};

