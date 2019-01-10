/**
 * Created by b0913178 on 07/06/2017.
 */

"use strict";

const express = require('express');
let config = require('config');

//axios to make request to backend
let axios = require('axios');

//in memory storage
const cache = require('memory-cache-ttl');
const in_memory = require('../controls/inMemoryToken');

const about_conf = config.get('About');
const general_conf = config.get('General');
const environment = config.get("Environment");
const browse_conf = config.get("Browse");
const style_conf = config.get("Style");
const text = config.get('Text');

//address for backend server
const BACKEND_ADDRESS = config.get('Environment.backend_host');
const FAILURE_MESSAGE = 'Your session has expired (or you are unauthorised). Please request a new private link.';

let router = express.Router();
let passwordless = require('passwordless');

//Middleware: import validation procedures
const pseudoUserName = require('../middleware/pseudo_username');
const classification = require('../middleware/classification');
const queryChecker = require('../middleware/browse_query_checker');
const userCheck = require('../middleware/user_checker');
const pollsChecker = require('../middleware/polls');

let validator = require('validator');

//importing initializing JWT token for internal API.
let internal_JWT = require('srv2srv_jwtauth_client');

//initialize internal JWT and connect to the backend
let token = undefined;
let credential_jwt = config.get('jwt.internal_credentials');
internal_JWT.init(credential_jwt.name, credential_jwt.user, credential_jwt.password, { passwordHashed: true}, credential_jwt.key);
(async () => {
  try {
    console.log("Trying to auth with the backend");
    token = await internal_JWT.auth(BACKEND_ADDRESS + '/v1/api/login');
    await in_memory.saveToken(token);
  }
  catch (e) {
    console.log("Auth with the backend failed");
    console.log(e)
  }
})();




router.get('/', passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    (req, res, next) => {
  if (!req.session.pseudo) {
    req.session.pseudo = Math.floor(Math.random() * 1000 * new Date());
    res.redirect(301, '/system/browse');
  } else {
    res.redirect(301, '/system/browse');
    console.log('it was already there: ', req.session.pseudo);
  }
});

//
// /* GET home page. */
// /*router.get('/', passwordless.restricted({ failureRedirect: '../email', failureFlash: 'Your session has expired (or you are unauthorised). Please request a new private link.' }), (req, res, next) => {
//     let addM = '';
//     if (req.session.noob){
//         addM = "true";
//         req.session.noob = false;
//     }
//     if (!req.session.pseudo){
//         req.session.pseudo = Math.floor(Math.random() * 1000 * new Date());
//         console.log(req.session.pseudo);
//         res.render('system', { title: 'Welcome', emailAdd: addM });
//     } else {
//         res.render('system', { title: 'Welcome', emailAdd: addM });
//         console.log('it was already there: ', req.session.pseudo);
//     }
// });*/

/**
 * responde with the post page and thread corrsponding to this post
 * actionCode - code of the actionType. for post - 1
 */
//TODO DELETE direct usage of DB methods
router.get('/post',
    queryChecker.queryChecker,
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed post page',
      actionCode: 1
    }),
    (req, res, next) => {
      let data = {};
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
      axios.get(BACKEND_ADDRESS + '/internal/get_post/' + req.query.id)
          .then((response)=>{
                    if (response['data']['code']===1){
                        data = response.data;
                        res.render('post', {
                            title: 'Message page',
                            message: data,
                            id: req.query.id,
                            page: req.query.p,
                            filter: req.query.f,
                            sort: req.query.s,
                            general: general_conf,
                            style: style_conf
                        });

                    } else {
                        data = response;
                        res.render('error', {
                            title: 'Post page error',
                            message: data.data,
                            error: {
                                status: 'Can\'t find this post',
                                stack: ''
                            },
                            general: general_conf
                        });

                    }
                })
          .catch(error => {
            console.log(error.message, ": \n" ,error.response.data);
            res.render('error', {
              title: 'Post page error',
              message: error.response.data,
              error: {
                status: 'Can\'t find this post',
                stack: ''
              },
              general: general_conf
            });
      })

});

//TODO DELETE direct usage of DB methods
/**
 * page with post and comments for thi post. specifically for moderators
 * actionCode - code of the actionType. for post - 11
 */
router.get('/post_mod',
    queryChecker.queryChecker,
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    userCheck.adminCheck,
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed moderators post page',
      actionCode: 11
    }),
    (req, res, next) => {
      let data = {};
        if (req.session.moderator) {
              req.query.id = parseInt(req.query.id);
              axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
              axios.get(BACKEND_ADDRESS + '/internal/get_post/' + req.query.id)
              .then((response)=>{
                if (response['data']['code']===1){
                  data = response.data;
                  res.render('post_mod', {
                    title: 'Post page',
                    message: data,
                    id: req.query.id,
                    comment_id: req.query.comment_id,
                    general: general_conf,
                    style: style_conf
                  });

                } else {
                  data = response;
                  res.render('error', {
                    title: 'Post page error',
                    message: data.data,
                    error: {
                      status: 'Can\'t find this post',
                      stack: ''
                    },
                    general: general_conf
                  });

                }
              })
              .catch(error => {
                console.log(error.message, ": \n" ,error.response.data);
                res.render('error', {
                  title: 'Post page error',
                  message: error.response.data,
                  error: {
                    status: 'Can\'t find this post',
                    stack: ''
                  },
                  general: general_conf
                });
              })
          } else {
            res.render('error', {
              title: 'Post page error',
              message: "Accesses denied, please check your permissions",
              error: {
                status: 'Can\'t find this post',
                stack: ''
              },
              general: general_conf
            });
          }

});

/**
 * About page
 * actionCode - type of the logged action. 2- access systems about page
 *
 */
router.get('/about',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed system about page',
      actionCode: 2
    }),
    (req, res, next) => {
  res.render('about_faq', {
    title: 'FAQ',
    path: '../',
    about: about_conf,
    general: general_conf,
    style: style_conf,
    text: text.about
  });

});

router.get('/created',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    (req, res, next) => {
      let code = 0;
      let message = '';
      try {
          code = parseInt(req.query.message);
      }
      catch(err){
          console.log(err)
      }
      if (code === 1){
          message = "Your post has been submitted for moderation. Posts that require significant moderation may take longer to be released. Normally messages and comments are released ";
      }
      res.render('created', {
          title: 'Post created',
          message: message,
          general: general_conf,
          style: style_conf

      });

});

/**
 * Router for Setting Page
 * actionCode - type of the logging action. 5 - accessed setting page
 */
router.get('/settings',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed setting page',
      actionCode: 5
    }),
    (req, res, next) => {
      console.log('This is the user - ', req.user);
      res.render('settings', {
          title: 'Settings',
          session_data: req.session,
          general: general_conf,
          environment: environment,
          style: style_conf
  });
});

/**
 * MODERATORS PAGE SHOULD BE ACCESSED ONLY FOR MODERATORS
 * actionCode - type of action logged. 15- access moderators page
 */

//TODO DELETE direct usage of DB methods
router.get('/moderate',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    userCheck.adminCheck,
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed moderators page',
      actionCode: 15
    }),
    (req, res, next) => {
    //TODO validate and escape req.user
    let type = 0;
    if (req.session.moderator) type = 1;
    axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
    axios.get(BACKEND_ADDRESS + '/internal/retrieve_all_categories/' + type)
    .then(categories => {
      if (categories['data']['code']===1){
          if (req.session.moderator) {
            res.render('moderate', {
              title: 'Moderate',
              data: categories['data']['data'],
              hash: req.session.hash_,
              general: general_conf,
              style: style_conf
            });
          } else {
            res.render('denied', {
              title: 'Something went wrong',
              message: "Ooops! Seems that something went wrong",
              general: general_conf,
              style: style_conf
            });
          }
      } else {
        res.render('error', {
          title: '9to5: Moderation page error (categories)',
          general: general_conf
        });
      }
    })
    .catch (error =>{
      console.log("Something went wrong while retrieving data for moderation page");
      console.log(error);
      res.render('error', {
        title: '9to5: Moderation page error indeed',
        general: general_conf
      });
    });
});

// //POLLS MODERATION PAGE SHOULD BE ACCESSED BY SUPER MODERATOR
// router.get('/moderate_polls', passwordless.restricted({ failureRedirect: '../email', failureFlash: 'Your session has expired (or you are unauthorised). Please request a new private link.' }), (req, res, next) => {
//   //TODO validate and escape req.user
//       let type = 1;
//
//       uuidVerification(req.user, type).then((answer) =>{
//         if (answer) {
//           res.render('polls_moderation', {
//             title: 'Polls moderation',
//             hash: req.session.hash_,
//             general: general_conf,
//             style: style_conf
//           });
//
//         } else {
//           res.render('denied', {
//             title: 'Something went wrong',
//             message: "Ooops! Seems that something went wrong",
//             general: general_conf
//           });
//         }
//       })
//       .catch (error =>{
//         console.log("Something went wrong while retrieving data for moderation page");
//         console.log(error);
//         res.render('error', {
//           title: '9to5: Moderation page error indeed',
//           general: general_conf
//         });
//       });
// });

//TODO DELETE direct usage of DB methods
router.get('/create',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    userCheck.adminCheck,
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed create message page',
      actionCode: 3
    }),
    (req, res, next) => {
      let type = 0;
      if (req.session.moderator) type = 1;
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + cache.get('token');
      axios.get(BACKEND_ADDRESS + '/internal/retrieve_all_categories/' + type)
        .then((response) =>{
          if (response['data']['code']===1){
            res.render('create', {
              title: 'Create message',
              data: response['data']['data'],
              general: general_conf,
              style: style_conf
            });
          }
          else {
            res.render('error', {
              title: 'Create message error',
              general: general_conf,
              style: style_conf
            });
          }
        })
      .catch (error =>{
        console.log("Something went wrong while retrieving data for message creation");
        res.render('error', {
          title: '9to5: Create message error indeed',
          general: general_conf,
          style: style_conf,
          error: error,
          message: error.response
        });
      });


});

router.get('/feedback',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    classification.log({backendAddress: BACKEND_ADDRESS,
      actionType: 'accessed feedback form page',
      actionCode: 4
    }),
    (req, res, next) => {
      res.render('feedback_auth', {
        title: 'Feedback Form',
        general: general_conf,
        style: style_conf
      });
});

//new browsing page
/**
 * sort_by: (3- Latest Entries, 0 - latest posts, 1 - Most_votes, 2 - most comments)
 * filter_by: (2 - this month, 0 - this week, 1- today, 3 - all time)
 */
//TODO DELETE direct usage of DB methods in uuidVerification
router.get('/browse',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    queryChecker.queryChecker,
    pseudoUserName.getRandomUserName,
    userCheck.adminCheck,
    classification.check({backendAddress: BACKEND_ADDRESS}),
    classification.log({backendAddress: BACKEND_ADDRESS, actionType: 'accessed browse page'}),
    pollsChecker.getAllPolls,
    (req, res, next) => {

  //initiate variables
  let [info, id, page, sort_by, filter_by, sess, polls, aFlag, addition] = [{}, req.query.id, req.query.p, req.query.s, req.query.f, req.session, false, false, {}];

  //TODO: send email to hash email with state
      console.log("This is your role: ", req.session.user_type);
      if (req.session.user_type && req.session.moderator === true) {
        aFlag = true;
        addition = {
          name: "Moderation",
          pLink: "/system/moderate"
        }
      }

  info = {
    title: 'Posted messages',
    aFlag: aFlag,
    id: id,
    page: page,
    filter: filter_by,
    sort: sort_by,
    polls: res.locals.polls,
    addition: addition,
    general: general_conf,
    browse: browse_conf,
    style: style_conf
  };

  res.status(200).render('browse', info);

});

//TODO delete direct usage of DB Methods
//TODO NOT FINISHED
router.get('/change_email',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    (req,res, next) => {
     let code = validator.blacklist(req.query.code, "$=\\/<>");
     let id = req.session.id;
     let uuid = req.session.passwordless;
     console.log('This is : ', code, " - ", id, " - ", uuid);
     res.status(200).send("good");
     // db.checkTempEmail(id, uuid, code, false)
     // .then(answer =>{
     //    if (answer && answer['code']===1){
     //        console.log(answer);
     //        let add_non_w_email = db.addValidEmail(answer['data']['working_email'], answer['data']['email']);
     //        add_non_w_email.then(answer =>{
     //            if (answer && answer['code']===1){
     //                console.log(answer['data']);
     //                res.render('changed', {
     //                    title: 'Additional email added or changed successfully',
     //                    message: answer['data'],
     //                    general: general_conf,
     //                    style: style_conf
     //                });
     //            } else {
     //                console.log('Error while updating: ', answer['data']);
     //                res.render('changed', {
     //                    title: 'Updating account error',
     //                    message: answer['data'],
     //                    general: general_conf,
     //                    style: style_conf
     //                });
     //            }
     //        })
     //
     //    }else {
     //        console.log ('Error: ', answer);
     //        //res.redirect('changed', {message: answer});
     //        res.render('error', {
     //          title: 'Code verification erorr',
     //          aFlag: false,
     //          message: 'Sorry',
     //          error: {
     //            status: 'Some Problems occurred',
     //            stack: ''
     //          },
     //          general: general_conf
     //        });
     //    }
     // })
     //     .catch(error => {
     //       console.log(error);
     //       res.render('error', {
     //         title: 'Code verification error',
     //         aFlag: false,
     //         message: 'Sorry',
     //         error: {
     //           status: 'Some Problems occurred',
     //           stack: 'error'
     //         },
     //         general: general_conf
     //       });
     //
     // });

});
//
// //TODO delete direct usage of DB Methods
// router.get('/unsubscribe', passwordless.restricted({ failureRedirect: '../email', failureFlash: 'Your session has expired (or you are unauthorised). Please request a new private link.' }), (req,res, next) => {
//   let code = uValid.validateText(req.query.code);
//   if (req.session.unsubscribe_token === req.query.code) {
//     db.unsubscribe(req.session.unsubscribe_token)
//         .then(response => {
//           if (response && response.code === 1){
//             res.render('unsubscribed', {
//               title: 'Successfully unsubscribed',
//               message: 'You were successfully unsubscribed from daily summaries. If you ever change your mind feel free to subscribe again.',
//               style: style_conf
//             });
//             if (response.data.personal_email && response.data.personal_email.length > 0){
//               uValid.listDeleteuser(response.data.personal_email);
//               uValid.listDeleteuser(response.data.email);
//
//             } else {
//               uValid.listDeleteuser(response.data.email);
//             }
//           }else  {
//             console.log("Error while unsubscribing. Zero data or no data returned");
//             res.render('unsubscribed', {
//               title: 'Error while unsubscribing',
//               message: 'Sorry, something went wrong while trying to unsubscribe from daily summaries.',
//               general: general_conf,
//               style: style_conf
//             });
//           }
//     })
//         .catch(error => {
//           console.log("Catch error while unsubscribing: ", error);
//           res.render('unsubscribed', {
//             title: 'Error while unsubscribing',
//             message: 'Sorry, something went wrong while trying to unsubscribe from daily summaries.',
//             general: general_conf,
//             style: style_conf
//           });
//     })
//   }
//
// });

router.get('/changed',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    (req,res, next) => {
     res.render('changed', {
         title: 'VoiceApp: Email changing',
         message: 'La la message',
         general: general_conf,
         style: style_conf
     });
});

//TODO finish logout process
router.get('/logout',
    passwordless.restricted({ failureRedirect: '../email', failureFlash: FAILURE_MESSAGE }),
    (req, res, next) => {
      req.session.destroy(err => {
          if (err){
              console.log(err);
          }else {
              res.redirect (config.get('Passwordless.host'));
          }
      });
});

// /**
//  * Part of the GET RESPONSIBLE FOR POLLS
//  *
//  */
// //router responsible for displaying page with all created pools and button for creation of the new one.
// router.get('', (req, res, next) => {
//   res.render('polls_list', {
//     title: 'All the available posts in the system',
//     general: general_conf
//   });
// });


module.exports = router;
