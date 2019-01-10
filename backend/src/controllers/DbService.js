/**
 * Created by b0913178 on 01/06/2017.
 */

"use strict";

let config = require('config');

//options object for pg-promise
let options = {

};

let pgp = require('pg-promise')();
let pgp_ps = require('pg-promise').PreparedStatement;

//establish connection
let pg_cn = config.get('Connector.pg_db');
let db = pgp(pg_cn);
let validator = require('validator');
let domain = config.get('Environment.email_domain');

//check Email cases
//TODO: Check what happened in someone has email with ' - sign like martyn.o'riordan@barnardos.org.uk
let check_email_query ='';
const check_q1 = "SELECT email, personal_email, type, subscription, title FROM voice.valid_email WHERE ((email = $1 OR personal_email = $1) OR (email = $2 OR personal_email = $2)) AND active = true LIMIT 1";
const check_q2 = "SELECT email, personal_email, type, subscription, title FROM voice.valid_email WHERE (email = $1 OR email = $2) AND active = true LIMIT 1";
if (domain){
  check_email_query=check_q2
} else {
  check_email_query=check_q1
}

//checking connection to DB (PostgreSQL)
/*db.connect()
        .then(obj => {
                console.log('Connected succesfully');
                obj.done(); // success, release the connection;
            })
            .catch(error => {
                console.log("ERROR:", error.message || error);
            });
*/

module.exports = {

    /*Function for checking email presence in the list of white_list emails*/
    checkEmail: function(email_to_search, hash){
        if (hash === undefined) hash = email_to_search;
        let answer = {};
        console.log('Searching for ', email_to_search, ' & ', hash);
        return new Promise((resolve, reject) =>{
            db.one(check_email_query, [email_to_search, hash])
                .then(function (email, err) {
                    // do something if found
                    if(err) reject(err);
                    console.log('This retrieved data: ', email);
                    answer = {"code": 1, "data": email};
                    resolve(answer);

                })
                .catch(error => {
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    resolve(answer);
                    console.log(error);
                    // error;
                });

        });
    },

    /*Function for updating admin user with the lates user.id*/
    updateEmailtoken: function(email_to_search, uuid){
        let answer = {};
        const update_token = new pgp_ps('update-token', 'UPDATE voice.valid_email SET uuid=$1 WHERE email=$2');
        return new Promise((resolve, reject) =>{
            db.none(update_token, [uuid, email_to_search])
                .then(function (email, err) {
                    // do something if found
                    answer = {"code": 1, "data": 'Token has been updated at '+ email_to_search};
                    resolve(answer);
                    console.log("THISIS FROM UPDATE TOKEN FUNCTION: ", answer);
                })
                .catch(error => {
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    resolve(answer);
                    console.log(error);
                    // error;
                });

        });
    },

    //check presence of the record with session_id, uuid< emails in the temporary table for adding non-working email (for the second step of the adding process)
  /**
   *
    * @param uuid - user uuid
   * @param type - type of the request. if type = 0 {default} - check for moderator role; if type = 1 - check for pages or API where super admin requered
   * @return {Promise}
   */
  checkAdmin: function (uuid, type=0) {
    console.log("I'm succesfully inside the CHECK_ADMIN_DB_METHOD: ", uuid);
        let answer = null;
        let query = null;
        const check_uuid = new pgp_ps('check-admin-uuid', 'SELECT email, uuid, type, modified_time FROM voice.valid_email WHERE uuid = $1 LIMIT 1');
        const check_super_uuid = new pgp_ps('check-super-admin-uuid', 'SELECT email, uuid, type, modified_time FROM voice.valid_email WHERE uuid = $1 AND type = 29 LIMIT 1');
        if (type === 1){
          query = check_super_uuid;
        } else {
          query = check_uuid
        }
        return new Promise((resolve, reject) =>{
            db.one(query, [uuid])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {"code": 1, "data": data};
                    console.log("Returning this - ", answer);
                    resolve(answer);
                })
                .catch (error =>{
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    },

    retrieveCategories: function (type=0) {
        let answer = null;
        let query = '';
        return new Promise((resolve, reject) =>{
          if (type === 1){
            query = 'SELECT id, cat_name, description, parent_cat, permission FROM voice.categories_ WHERE active = true ORDER BY id ASC';
          } else {
            query = 'SELECT id, cat_name, description, parent_cat, permission FROM voice.categories_ WHERE active = true AND permission = false ORDER BY id ASC';
          }
            db.any(query)
                .then((data,err) => {
                    if (err) reject(err);
                    //one-liner to ger rid of the 0 category
                    if (type === 0){
                      data = data.filter(e => e.id !== 0);
                    }
                    let length = data.length;
                    answer = {"code": 1, "data": data, "length": length};
                    resolve(answer);
                    //console.log(answer);
                })
                .catch (error =>{
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    //console.log(error);
                    resolve(answer);
                })
        })
    },

    /*insertMessage: function (message, author, categories, cat_name, type, link) {
        let answer = null;
        return new Promise((resolve, reject) =>{
            categories.unshift(0);
            db.none("INSERT INTO voice.public_messages (text, author, categories, cat_name, secure_link) VALUES ($1, $2, $3, $4, $5)", [message, author, categories, cat_name, link])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {"code": 1, "data": "successfully inserted"};
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Something happened while inserting');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    }, */

    //TODO : Implement protection against posting a comment in non-visible post (type <>1)
    insertComment: function (text, parent_message, author) {
        let answer = null;
        const insert_comment = new pgp_ps('insert-comment', 'INSERT INTO voice.comments (text, author, parent_message) VALUES ($1, $2, $3)');
        return new Promise((resolve, reject) =>{
            db.none(insert_comment, [text, author, parent_message])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {"code": 1, "data": "successfully inserted"};
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Something happened while inserting');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    },

    //add personal email to a temporary table on a first step of changing/adding new non-working email
    addTempEmail: function (working_email, email, session_id, session_uuid, passcode, usage_flag) {
        let answer = null;
        console.log(working_email, " ---- ", email);
        return new Promise((resolve, reject) =>{
            db.none("INSERT INTO voice.temp_email (working_email, email, session_id, session_uuid, passcode, usage_flag) VALUES ($1, $2, $3, $4, $5, $6)", [working_email, email, session_id, session_uuid, passcode, usage_flag])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {"code": 1, "data": "successfully inserted"};
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Something happened while inserting');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    },

    //add personal email to a temporary table on a first step of changing/adding new non-working email
    addUnsubscriptionToken: function (working_email, passcode) {
      let answer = null;
      const update_subscription_token = new pgp_ps("update-subscription-token", "UPDATE voice.valid_email SET unsubscription_token = $1 WHERE email = $2");
      return new Promise((resolve, reject) =>{
        db.none(update_subscription_token, [passcode, working_email])
        .then((data,err) => {
          if (err) reject(err);
          answer = {"code": 1, "data": "successfully inserted"};
          resolve(answer);
        })
        .catch (error =>{
          console.log('Something happened while inserting');
          answer = {"code": 0, "data": error['message']};
          console.log(error);
          resolve(answer);
        })
      })
    },

  /**
   * unsubscribing from the daily mails
   * @param unsubscription_token
   */
  unsubscribe: function(unsubscription_token) {
      const check_unsub_token = new pgp_ps("check-unsub-token", "SELECT email, personal_email, subscription FROM voice.valid_email WHERE unsubscription_token = $1");
      const unsubscribe_email = new pgp_ps("unsibscribe_email", "UPDATE voice.valid_email SET subscription = false, unsubscription_token = null  WHERE unsubscription_token = $1 RETURNING email, personal_email");
      let answer = {};
      return new Promise((resolve, reject) => {
        db.one(unsubscribe_email, [unsubscription_token])
        .then((data, err) => {
          if (data && data['email']){
            answer.code = 1;
            answer.data = data
          } else {
            answer.code =0;
            resolve(answer);
          }
          resolve(answer);
        })
        .catch(error => {
          answer.code = 0;
          console.log(error);
          reject(answer)
        })
      })
    },

    //check presence of the record with session_id, uuid< emails in the temporary table for adding non-working email (for the second step of the adding process)
    checkTempEmail: function (session_id, session_uuid, passcode, usage_flag) {
        let answer = null;
        const check_temp_email = new pgp_ps('check-temp-email', 'SELECT * FROM voice.temp_email WHERE session_id = $1 AND session_uuid = $2 AND passcode = $3 AND usage_flag = $4 ORDER BY timestamp DESC LIMIT 1');
        return new Promise((resolve, reject) =>{
            db.one(check_temp_email, [session_id, session_uuid, passcode, usage_flag])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {"code": 1, "data": data};
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Something happened while retrieving data');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    },

    //add new personal email for the last step of the adding/changing non-working email;
    addValidEmail: function (working_email, personal_email) {
        let answer = null;
        const add_valid_email = new pgp_ps('add-valid-email', 'UPDATE  voice.valid_email SET personal_email = $1 WHERE email = $2');
        const update_temp_email = new pgp_ps('update-temp-email', 'DELETE FROM voice.temp_email WHERE working_email = $1');
        return new Promise((resolve, reject) =>{
            db.tx(t=>{
                return t.batch([
                    db.none(add_valid_email, [personal_email, working_email]),
                    db.none(update_temp_email, [working_email])
                ]);
            })
                .then((data,err) => {
                    if (err) {
                        console.log('THIS IS UPDATE ERROR: ', err);
                        reject(err);
                    }
                    answer = {"code": 1, "data": 'Additional email updated successfully'};
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Something happened while updating');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    },

    /**
     * @param category - optional paramentr for coosing category
     * @param order - sorting order (time or votes or nuber of comments)
     * @param offset - ofsset of the querry form the first returned record
     * @param  scope - scope of the search. luike day, week, month or all time
     */
    retrievePublicMessages: function (category=0, order=0, offset=0, scope=0){
        //const limit = 1000;
        const limit = 10;
        //determing sorting order
        let order_in ="";
        switch (order) {
          case 0:
              order_in = 'pm.timestamp';
              break;
          case 1:
              order_in = 'pm.votes_up + pm.votes_down';
              break;
          case 2:
              order_in = 'comments';
              break;
          case 3:
              order_in = 'pm.mod_time';
          default:
              order_in = 'pm.mod_time';
        }

        //determing scopes
        let scope_in ="";
        switch (scope) {
          case 0:
            scope_in = "AND pm.timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days' ";
            break;
          case 1:
            scope_in = "AND pm.timestamp > CURRENT_TIMESTAMP - INTERVAL '1 days' ";
            break;
          case 2:
            scope_in = "AND pm.timestamp > CURRENT_TIMESTAMP - INTERVAL '31 days' ";
            break;
          case 3:
            scope_in = "";
            break;
          default:
            scope_in = "AND pm.timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days' ";
        }

        let quer = "SELECT pm.id, pm.text, pm.categories, pm.cat_name, pm.votes_up, pm.votes_down, pm.timestamp, pm.edit_status, pm.mod_time, pm.new_comments, COUNT(c.id) as comments FROM voice.public_messages AS pm LEFT JOIN voice.comments AS c ON c.parent_message=pm.id WHERE pm.type = 1 AND $1 = ANY(pm.categories) " + scope_in + "GROUP BY pm.id ORDER BY " + order_in + " DESC LIMIT $2 OFFSET $3";

        //loggind data
        console.log("THIS DATA I'M GONNA USE FOR QUERY: ", category, limit, offset);
        console.log("THIS IS QUERY: ", quer);

        //const ret_public_messages = new pgp_ps("retrieve-public-messages", "SELECT * FROM voice.public_messages WHERE type = 1 AND $1 = ANY(categories) ORDER BY timestamp DESC LIMIT $2 OFFSET $3");
        //const ret_public_messages_plus_comments = new pgp_ps("retrieve-public-messages-plus-comments", quer);
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            //db.any(ret_public_messages_plus_comments, [category, scope_in, limit, offset])
            db.any(quer, [category, limit, offset])
                .then((data,err) => {
                    if (err) reject(err);
                    if (data && data.length > 0){
                      answer = {
                        "code": 1,
                        "data": data,
                        "pagination": {
                          "per_page": limit,
                          "current_page": (limit+offset)/limit,
                          "last": data.length
                        }
                      };
                      resolve(answer);
                    } else {
                      answer = {
                        "code": 0,
                        "data": data,
                        "pagination": {
                          "per_page": limit,
                          "current_page": (limit+offset)/limit,
                          "last": data.length
                        }
                      };
                      resolve(answer);
                    }
                })
                .catch (error =>{
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })

    },
        retrieveOnePublicMessage: function (id){
        console.log ("This is id: ", id);
        const ret_one_public_message = new pgp_ps("retrieve-one-public-message", "SELECT * FROM voice.public_messages WHERE id = $1 AND type = 1");
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            db.any(ret_one_public_message, [id])
                .then((data,err) => {
                    if (err) reject(err);
                    data[0]['text'] = validator.unescape(data[0]['text']);
                    answer = {
                        "code": 1,
                        "data": data[0]
                    };
                    console.log('DB data: ', data[0]);
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    resolve(answer);
                })
        })

    },

    //function for updating votes score for specific post
    updateVotesInPublicMessage: function (id, type, amount){
        let query ='';
        const update_votes_down = new pgp_ps("update-votes_down", "UPDATE voice.public_messages SET votes_down = votes_down - 1 WHERE id = $1");
        const update_votes_up = new pgp_ps("update-votes_up", "UPDATE voice.public_messages SET votes_up = votes_up + 1 WHERE id = $1");
        const update_2_votes_down = new pgp_ps("update-2-votes_down", "UPDATE voice.public_messages SET votes_down = votes_down - 1, votes_up = votes_up - 1 WHERE id = $1");
        const update_2_votes_up = new pgp_ps("update-2-votes_up", "UPDATE voice.public_messages SET votes_up = votes_up + 1, votes_down = votes_down + 1 WHERE id = $1");
        if (id && type===0 && amount===1){
            query = update_votes_down
        } else if (id && type===1 && amount===1){
            query = update_votes_up
        } else if (id && type===0 && amount===2){
          query = update_2_votes_down
        } else if (id && type===1 && amount===2){
            query = update_2_votes_up
        } else {
            return {"code": 0, "data": "ERROR: Unresolved type of command"}
        }
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            db.none(query, [id])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {
                        "code": 1,
                        "data": "Votes Updated Successfully"
                    };
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    resolve(answer);
                })
        })

    },

    //function for retrieving votes record from voice.votes table for specific post
    selectVotesInVotes: function (id, uuid){
        const select_votes = new pgp_ps("select-votes", "SELECT * FROM voice.votes WHERE uuid = $1 AND message_id = $2 LIMIT 1");
        if (uuid && id){
            return new Promise((resolve, reject) =>{
                let answer ={};
                db.any(select_votes, [uuid, id])
                    .then((data,err) => {
                        if (err) reject(err);
                        answer = {
                            "code": 1,
                            "data": data
                        };
                        resolve(answer);
                    })
                    .catch (error =>{
                        console.log('Nothing was find!');
                        answer = {"code": 0, "data": error['message']};
                        resolve(answer);
                    })
            })
        }

    },

    //function for updating votes record from voice.votes table for specific post
    insertOrUpdateVotesInVotes: function (id, uuid, type, action){
        let query ='';
        const insert_votes = new pgp_ps("insert-votes", "INSERT INTO voice.votes (type, uuid, message_id) VALUES ($1, $2, $3)");
        const update_votes = new pgp_ps("update-votes", "UPDATE voice.votes SET type = $1 WHERE uuid = $2 AND message_id = $3");
        if (action===0 && id && uuid){
            query = insert_votes;
        } else if (action === 1 && id && uuid){
            query = update_votes
        }else {
            return {"code": 0, "data": "ERROR: Unresolved type of command"}
        }
        return new Promise((resolve, reject) =>{
            let answer ={};
            db.none(query, [type, uuid, id])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {
                        "code": 1,
                        "data": "Vote recorder/changed successfully"
                    };
                    resolve(answer);
                })
                .catch (error =>{
                    answer = {"code": 0, "data": error['message']};
                    resolve(answer);
                })
        })

    },

    /*
    @param id - omessage id
    @param order - sorting order (time)
    @param offset
     */
    retrieveMessageComments: function (id, order=0, offset=0){
        const limit = 30;
        const ret_message_comments = new pgp_ps("retrieve-message-comments", "SELECT * FROM voice.comments WHERE parent_message = $1 ORDER BY createdtime DESC LIMIT $2 OFFSET $3");
        //const ret_message_comments = new pgp_ps("retrieve-message-comments", "SELECT * FROM voice.comments ORDER BY createdtime ASC");
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            db.any(ret_message_comments, [id, limit, offset])
            //db.any(ret_message_comments)
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {
                        "code": 1,
                        "data": data,
                        "pagination": {
                            "per_page": limit,
                            "current_page": (limit+offset)/limit,
                            "last": data.length,

                        }
                    };
                    resolve(answer);
                })
                .catch (error =>{
                    answer = {"code": 0, "data": error['message']};
                    resolve(answer);
                })
        })

    },

  /**
   * Functions that works with the polls functionality
   * 
   */

  /**
   * Function for creating a new poll (should be accesable only for super admins)
   * @param question - text of the polls question
   * @param optionsArray - array of option texts
   * @returns {Promise} - JSON object with all inserted data and their ids
   */
  createNewPoll: function(question, optionsArray) {
    const create_new_poll_question = new pgp_ps("create-new-poll-question", "INSERT INTO voice.polls_questions (question, json_options_array) VALUES($1, $2::json[]) RETURNING id");
    let table_options = new pgp.helpers.TableName('polls_options', 'voice');
    let table_votes = new pgp.helpers.TableName('polls_votes', 'voice');
    let result = {};
    return new Promise((resolve, reject) =>{
      db.one(create_new_poll_question, [question, optionsArray])
      .then(data => {
        result.question = question;
        result.question_id = data.id;
        optionsArray.forEach(function(element, index) {
          element.question_id = data.id;
          //element.option_num = index;
        });
        const create_new_poll_options = pgp.helpers.insert(optionsArray, ['option', 'question_id', 'option_num'], table_options) + " RETURNING id, option_num";
        db.any(create_new_poll_options)
        .then(data=> {
            result.options = optionsArray;
            data.forEach(function(element, index) {
              element.option_id = element.id;
              delete element.id;
              element.votes = 0;
              result.options[index]['id'] = element.option_id;
            });
            const create_new_poll_votes = pgp.helpers.insert(data, ['option_id', 'votes'], table_votes) + " RETURNING id, option_id, votes";
            db.any(create_new_poll_votes)
            .then(data => {
              result.votes = data;
              resolve(result);
            })
            .catch(error => {
              reject("error: " + error);
            });
        })
        .catch(error => {
          reject("error: " + error);
        });
      })
      .catch(error =>{
         reject("error: " + error);
      })
    })
 },

  /**
   * Function for storing user's vote in specific poll
   * @param pollId
   * @param optionNum
   * @param userHash
   */
  voteInSpecificPoll: function(pollId, optionNum, userHash) {
    let answer = {};
    if (!userHash || userHash.length === 0){
        answer = {
            code: 0,
            data: "User is not identified for voting"
        };
        return answer
    } else {
      const check_user_specific_poll = new pgp_ps("check-user-specific-vote", "SELECT COUNT(*) FROM voice.polls_voters_voted WHERE question_id = $1 AND hash = $2");
      const retriev_option_id = new pgp_ps("retriev-option-id", "SELECT id FROM voice.polls_options WHERE question_id = $1 AND option_num = $2 LIMIT 1");
      const vote_in_specifc_poll = new pgp_ps("vote-in-specific-poll", "UPDATE voice.polls_votes SET votes = votes + 1 WHERE option_id = $1");
      const store_user_specific_poll = new pgp_ps("store-user-specific-poll", "INSERT INTO voice.polls_voters_voted (question_id, hash) VALUES ($1, $2)");

      return new Promise((resolve, reject) => {
        db.one(check_user_specific_poll, [pollId, userHash])
        .then(data => {
          if (data && (parseInt(data.count)===0)) {

            db.one(retriev_option_id, [pollId, optionNum])
            .then(data => {
              db.tx(t=>{
                return t.batch([
                  db.none(vote_in_specifc_poll, [data.id]),
                  db.none(store_user_specific_poll, [pollId, userHash])
                ]);
              })
              .then(data => {
                this.getPollResult(pollId)
                    .then(response => {
                      answer.code = response.code;
                      answer.data = response.data;

                      resolve(answer)
                })
                    .catch(error => {
                      answer.code = 0;
                      answer.data = error;
                      reject(answer)
                });
              })
              .catch(error => {
                answer.code = 0;
                answer.data = error;
                reject(answer)
              })
            })
            .catch(error => {
              answer.code = 0;
              answer.data = error;
              reject(answer)
            })
          } else {
            answer.code =0;
            answer.data = "You've been voted in this poll already";
            resolve(answer);
          }
        })
        .catch(error => {
          answer.code = 0;
          answer.data = error;
          reject(answer)
        })
      })
    }

  },

  /**
   *
   * @param pollId - id of the poll to  togle status
   * @return {Promise} of "pollId": integer, "publish": boolean
   */
  togglePublishStatusPoll: function(pollId) {
      const toggle_publish_state_poll = new pgp_ps("toggle-publish-state-poll", "UPDATE voice.polls_questions SET published = NOT published WHERE id = $1 RETURNING id, published");
      let answer = {};
      return new Promise((resolve, reject) => {
          db.one(toggle_publish_state_poll, [pollId])
              .then(data => {
                  answer.code = 1;
                  answer.data = data;
                  resolve(answer)
          })
              .catch(error => {
                  answer.code = 0;
                  answer.data = error;
                  reject(answer)
          })
      })
  },

  /**
   *
   * @param pollId - id of the poll to  togle status
   * @return {Promise} of "pollId": integer, "activate": boolean
   */
  toggleActivateStatusPoll: function(pollId) {
    const toggle_activate_state_poll = new pgp_ps("toggle-activate-state-poll", "UPDATE voice.polls_questions SET active = NOT active WHERE id = $1 RETURNING id, active");
    let answer = {};
    return new Promise((resolve, reject) => {
      db.one(toggle_activate_state_poll, [pollId])
      .then(data => {
        answer.code = 1;
        answer.data = data;
        resolve(answer)
      })
      .catch(error => {
        answer.code = 0;
        answer.data = error;
        reject(answer)
      })
    })
  },

  /**
   *
   * @param type - type of request. by default = 0 (1 - probably for moderators)
   * @param user_hash - hash of the user's email for whom polls are retrieved
   * @param mod_user- boolean of is this query for moderators or normal users
   * @return {Promise} of "pollId": integer, "activate": boolean
   */
  get_all_polls: function(type=0, user_hash=null, mod_user=false) {
        let answer = {};
        //const retrieve_all_active_published_polls = new pgp_ps("retrieve-all-active-published-polls", "SELECT q.id, q.question, array_agg(o.option) as options_array FROM voice.polls_questions AS q LEFT OUTER JOIN voice.polls_options AS o ON q.id = o.question_id WHERE q.active = true AND q.published = true AND q.id not in (SELECT question_id from voice.polls_voters_voted WHERE hash = $1) GROUP BY q.id ORDER BY q.id");
        const retrieve_all_active_published_polls = new pgp_ps("retrieve-all-active-published-polls", "SELECT q.id, q.question, q.json_options_array as options_array FROM voice.polls_questions AS q WHERE q.active = true AND q.published = true AND q.id not in (SELECT question_id from voice.polls_voters_voted WHERE hash = $1) ORDER BY q.weight DESC");
        //for admins
        const retrieve_all_polls = new pgp_ps("retrieve-all-polls", "SELECT q.id, q.question, json_object_agg(o.option_num, o.option) as options_array, q.active, q.published, COUNT(distinct v.id) as votes FROM voice.polls_questions AS q LEFT OUTER JOIN voice.polls_options AS o ON q.id = o.question_id LEFT OUTER JOIN voice.polls_voters_voted AS v ON q.id = v.question_id GROUP BY q.id ORDER BY q.weight DESC");
        let query = retrieve_all_active_published_polls;
        return new Promise((resolve, reject) => {
          if (type === 42){
            query = retrieve_all_polls
          }
          db.any(query, [user_hash])
          .then(data => {
              answer = {
                    "code": 1,
                    "data": data
              };
              resolve(answer)
          })
          .catch(error => {
            answer = {
              "code": 0,
              "data": error
            };
            reject(answer)
          })
        })
  },

  get_all_polls_results: function(mod_user=false) {
    let answer = {};
    ///for admins
    const retrieve_all_polls = new pgp_ps("retrieve-all-polls", "SELECT q.id, q.question, json_object_agg(o.option_num, o.option) as options_array, q.active, q.published, COUNT(distinct v.id) as votes FROM voice.polls_questions AS q LEFT OUTER JOIN voice.polls_options AS o ON q.id = o.question_id LEFT OUTER JOIN voice.polls_voters_voted AS v ON q.id = v.question_id GROUP BY q.id ORDER BY q.weight DESC");
    let query = '';
    return new Promise((resolve, reject) => {
      if (mod_user === true){
        db.any(retrieve_all_polls)
        .then(data => {
          answer = {
            "code": 1,
            "data": data
          };
          resolve(answer)
        })
        .catch(error => {
          answer = {
            "code": 0,
            "data": error
          };
          reject(answer)
        })

      } else {
        resolve(answer);
      }
    })
  },

  /**
   *
   * @param pollId - id of the poll that we wnat to see amount of votes for
   * @return {Promise}
   */
  getPollVotes: function(pollId) {
    const retrieve_votes_for_poll = new pgp_ps("retrieve-votes-for-poll", "SELECT COUNT(*) as votes FROM voice.polls_voters_voted WHERE question_id = $1");
    let answer = {};
    return new Promise((resolve, reject) => {
      db.one(retrieve_votes_for_poll, [pollId])
          .then(data => {
            data.id = pollId;
            answer = {
              "code": 1,
              "data": data
            };
            resolve(answer)
      })
          .catch(error => {
            answer = {
              "code": 0,
              "data": error
            };
            reject(answer)
      })
    })
  },

  getPollResult: function(pollId) {
    const retrieve_poll_results = new pgp_ps("retrieve-poll-results", "SELECT q.id as question_id, q.question, q.published, q.active, q.post_link, COUNT(distinct v.id) as overall_votes, o.option, o.option_num, o.id as option_id, ov.votes FROM voice.polls_questions AS q LEFT OUTER JOIN voice.polls_options AS o ON q.id = o.question_id LEFT OUTER JOIN voice.polls_votes AS ov ON o.id = ov.option_id LEFT OUTER JOIN voice.polls_voters_voted AS v ON q.id = v.question_id WHERE q.id = $1 GROUP BY q.id, o.option, o.option_num, o.id, ov.votes ORDER BY o.option_num;");
    let answer = {};

    return new Promise ((resolve, reject) => {
      db.any(retrieve_poll_results, [pollId])
          .then(data => {
            answer.code = 1;
            answer.data = data;
            resolve(answer)
      })
          .catch(error => {
            answer.code = 0;
            answer.data = error;
            reject(answer)
      })
    })
  },

  deletePoll: function(pollId) {
    const delete_poll = new pgp_ps("delete-poll", "DELETE FROM voice.polls_questions WHERE id=$1 AND published = false AND active = false RETURNING id");
    let answer = {};

    return new Promise ((resolve, reject) => {
      db.any(delete_poll, [pollId])
      .then(data => {
        console.log(data);
        if (data && data.length){
          answer.code = 1;
          answer.data = data;
        } else {
          answer.code = 0;
          answer.data = "Impossible to delete. Please check publishing and active status of this poll"
        }
        resolve(answer);

      })
      .catch(error => {
        answer.code = 0;
        answer.data = error;
        reject(answer)
      })
    })
  },

  subscribe: function(token, boolean) {
    const subscribe_to_summary = new pgp_ps("subscribe-to-summary", "UPDATE voice.valid_email SET subscription = $1, subscription_token = '' WHERE subscription_token = $2 RETURNING email, personal_email");
    return new Promise((resolve, reject) => {
        db.one(subscribe_to_summary, [boolean, token])
            .then(data => {
                let answer = {
                  code: 1,
                  data: {
                    message: "Subscribed successfully",
                    email: data.email,
                    personal_email: data.personal_email
                  }
                };
                resolve(answer);
                console.log("Subscribed succesfully");
        })
            .catch(error => {
                console.log("Subscribtion error: ", error);
                reject({"code": 0, "data": error});
        })
    })
  },

  subscribeTemp: function(email, token) {
    const subscribe_temp = new pgp_ps("subscribe-temp", "UPDATE voice.valid_email SET subscription_token = $1 WHERE email = $2");
    return new Promise((resolve, reject) => {
      db.none(subscribe_temp, [token, email])
      .then(data => {
        resolve({"code": 1, "data": "Temp Subscription token assign successfully"});
        console.log("Temp Subscription token assign successfully");
      })
      .catch(error => {
        console.log("Subscribtion error: ", error);
        reject({"code": 0, "data": error});
      })
    })
  }

};