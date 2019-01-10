/**
 * sort_by: (3- Latest Entries, 0 - latest posts, 1 - Most_votes, 2 - most comments)
 * filter_by: (2 - this month, 0 - this week, 1- today, 3 - all time)
 */
//TODO DELETE direct usage of DB methods in uuidVerification
router.get('/browse', passwordless.restricted({ failureRedirect: '../email', failureFlash: 'Your session has expired (or you are unauthorised). Please request a new private link.' }), (req, res, next) => {

  //important variables
  let [info, id, page, sort_by, filter_by, sess, polls] = [{}, 0, 1, 3, 3, req.session, false];
  // let info = {};
  // let id=0;
  // let page=1;
  // let sort_by = 3;
  // let filter_by = 3;
  // let sess = req.session;
  //let polls = false;

  // if (!req.session.pseudo) {
  //   req.session.pseudo = Math.floor(Math.random() * 1000 * new Date());
  //   req.session.nickname = uValid.getrandomUserName(req.session.pseudo)
  // } else {
  //   console.log('it was already there: ', req.session.pseudo);
  // }
  // if (req.session.title && req.session.title !== null) {
  //   req.session.nickname = req.session.title
  // }
  //console.log(req.flash('passwordless-success')[0]);
  // if (!req.session.class_position && !req.session.class_gender){
  //   console.log('trying to find by uuid');
  //   //get class data
  //   axios.get(BACKEND_ADDRESS + '/class_data/' + req.session.passwordless)
  //   .then(response => {
  //     if (response.code === 1){
  //       console.log('Ive found: ', response);
  //       sess.class_position = response.data.class_position;
  //       sess.class_gender = response.data.class_gender;
  //     } else {
  //       sess.class_position = 'unidentified';
  //       sess.class_gender = 'unidentified';
  //     }
  //
  //     console.log(sess.class_position, sess.class_gender);
  //
  //     try{
  //       axios.put(BACKEND_ADDRESS, {
  //         action: "accessed browse page",
  //         position: req.session.class_position,
  //         gender: req.session.class_gender
  //       })
  //       .then()
  //       .catch(error => {
  //         console.log("Classification data insertion request error: ", error);
  //       });
  //     }
  //     catch (err){
  //       console.log("Classification data insertion error: ", err);
  //     }
  //   })
  //   .catch(error => {
  //     req.session.class_position = 'unidentified';
  //     req.session.class_gender = 'unidentified';
  //     console.log(error);
  //   })
  // } else {
  //   try{
  //     db_track.insertTrackingData('accessed browse page', req.session.class_position, req.session.class_gender)
  //   }
  //   catch (err){
  //     console.log("Classification data insertion error: ", err);
  //   }
  // }

  //TODO later
  if (req.flash('passwordless-success')[0]){
    uValid.sendAnyEmail(req.session.hash_ + ' type: token_used, code: 1, class_position: '+ req.session.class_position, '<h5>'+ req.session.hash_ +'</h5>'+'<p>type: token_used, code: 1, class_position: ' + req.session.class_position + '</p>', config.get('Hash.email'), req.session.hash_);
  }

  //TODO: Done
  //checking presence of id and p variables in address string
  // if (req.query){
  //   try {
  //     id = parseInt(req.query.id);
  //     page = parseInt(req.query.p);
  //     filter_by = parseInt(req.query.f);
  //     sort_by= parseInt(req.query.s);
  //     if (page !== page) page=1;
  //     if (id !== id) id=0;
  //     if (filter_by !== filter_by) filter_by=3;
  //     if (sort_by !== sort_by) sort_by=3;
  //   }
  //   catch(err){
  //     console.log(err);
  //     res.render('error', {
  //       title: '9to5:  Optional values supply error',
  //       aFlag: false,
  //       message: 'Sorry',
  //       error: {
  //         status: 'Some Problems',
  //         stack: 'error'
  //       },
  //       general: general_conf,
  //       style: style_conf
  //     });
  //   }
  // }


  //check if user is a moderator or not
  uuidVerification(req.user).then((answer) =>{/////....
    console.log('THIS IS ANSWER: ' + answer);
    if (answer) {
      //get all polls for this user
      console.log ("++++++++++++++++About to CHECK POLLS");
      console.log(req.session.hash_);
      db.get_all_polls(0, req.session.hash_, false)
      .then(response => {
        console.log("Respone about polls from DB: ", response);
        if (response.data.length === 0){
          response.code = 0;
        } else {
          response.data.forEach(poll => {
            poll.question = validator.unescape(poll.question);
            poll.options_array.forEach(options => {
              options.option = validator.unescape(options.option);
            });
          })
        }

        info = {
          title: 'Posted messages',
          aFlag: true,
          id: id,
          page: page,
          filter: filter_by,
          sort: sort_by,
          polls: response,
          addition: {
            name: "Moderation",
            pLink: "/system/moderate"
          },
          general: general_conf,
          browse: browse_conf,
          style: style_conf
        };

        console.log("THIS POLLS DATA: ", info);
        res.render('browse', info);

      })
      .catch(error => {
        console.log("THIS IS ANSWER ERROR IN POLLS: "+ error);
        res.render('error', {
          title: '9to5: Polls error',
          aFlag: false,
          message: 'Sorry',
          error: {
            status: 'Some Problems',
            stack: 'error'
          },
          general: general_conf,
          style: style_conf
        });
      });
    } else {

      //check if hash is presents in session
      if (req.session.hash_){

        //get all polls for this user
        console.log ("++++++++++++++++About to CHECK POLLS");
        console.log(req.session.hash_);
        db.get_all_polls(0, req.session.hash_, false)
        .then(response => {
          console.log("Respone about polls from DB: ", response);
          if (response.data.length === 0){
            response.code = 0;
          } else {
            response.data.forEach(poll => {
              poll.question = validator.unescape(poll.question);
              poll.options_array.forEach(options => {
                options.option = validator.unescape(options.option);
              });
            })
          }

          info = {
            title: 'Browse',
            aFlag: false,
            id: id,
            page: page,
            filter: filter_by,
            sort: sort_by,
            polls: response,
            general: general_conf,
            browse: browse_conf,
            style: style_conf
          };

          console.log("THIS POLLS DATA: ", info);
          res.render('browse', info);

        })
        .catch(error => {
          console.log("THIS IS ANSWER ERROR IN POLLS: "+ error);
          res.render('error', {
            title: '9to5: Polls error',
            aFlag: false,
            message: 'Sorry',
            error: {
              status: 'Some Problems',
              stack: 'error'
            },
            general: general_conf,
            style: style_conf
          });
        });

      } else {
        console.log('USER without HASH is HERE');

        try{
          db_track.insertTrackingData('error', req.session.class_position, req.session.class_gender, {data: {error: 'user without hash'}})
        }
        catch (err){
          console.log("Classification data insertion error: ", err);
        }

        info = {
          title: 'Browse',
          aFlag: false,
          id: id,
          page: page,
          filter: filter_by,
          sort: sort_by,
          polls: {
            code: 0
          },
          general: general_conf,
          browse: browse_conf,
          style: style_conf
        };
        res.render('browse', info);
      }




    }

  })
  .catch(error => {
    console.log("THIS IS ANSWER ERROR: "+ error);
    res.render('error', {
      title: '9to5:  User verification error',
      aFlag: false,
      message: 'Sorry',
      error: {
        status: 'Some Problems',
        stack: 'error'
      },
      general: general_conf
    });

  });
});


//TODO delete direct usage of DB Methods
function uuidVerification(uuid, type=0) {
        uuid = uValid.validateText(uuid);
        let bool = false;
        return new Promise((resolve, reject) => {
            db.checkAdmin(uuid, type)
                .then(data => {
                    if ((data['code'] === 1) && (data["data"]["uuid"] === uuid)){
                        let moders = config.get('moderators');
                        console.log('UUID BELONGS TO ADMIN');
                        for (var i = moders.length -1; i>=0; i--){
                            if((moders[i]["name"] === data["data"]["email"])){
                                bool = true;
                                console.log('FOUND ADMIN');
                                break;
                            }else{
                                bool =  false;
                                console.log('CANT FIND ADMIN');
                            }
                        }
                    } else {
                        bool =  false;
                        console.log('UUID DOESNt BELONG TO ADMIN');
                    }
                    resolve(bool);
                })
                .catch(error => {
                    console.log('This is uuidAdmin error: ' + error);
                    resolve(bool);
                })

        });

}