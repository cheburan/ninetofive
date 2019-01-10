/**
 * Created by b0913178 on 01/06/2017.
 */

"use strict";

let config = require('config');

//options object for pg-promise
let options = {

};

let pgp_moderate = require('pg-promise')();
let pgp_ps_moderate = require('pg-promise').PreparedStatement;

//establish connection
let pg_cn_moderate = config.get('Connector.pg_db_moderate');
let db_temp = pgp_moderate(pg_cn_moderate);


//checking connection to DB (PostgreSQL)
/*db_temp.connect()
        .then(obj => {
                console.log('Connected succesfully');
                obj.done(); // success, release the connection;
            })
            .catch(error => {
                console.log("ERROR:", error.message || error);
            });
*/

module.exports = {

  /*  retrieveCategories: function (type=0) {
        let answer = null;
        let query = '';
        return new Promise((resolve, reject) =>{
            if (type ===1){
                query = 'SELECT id, cat_name FROM voice.categories ORDER BY weight ASC LIMIT 2';
            } else {
                query = 'SELECT id, cat_name, description, parent_cat FROM voice.categories'
            }
            db_temp.any(query)
                .then((data,err) => {
                    if (err) reject(err);
                    //one-liner to ger rid of the 0 category
                    data = data.filter(e => e.id !== 0);
                    let length = data.length;
                    answer = {"code": 1, "data": data, "length": length};
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })
    }, */

    insertMessage: function (message, author, categories, cat_name, type, link) {
        let answer = null;
        return new Promise((resolve, reject) =>{
            categories.unshift(0);
            db_temp.none("INSERT INTO voice.public_messages (text, author, categories, cat_name, type, secure_link) VALUES ($1, $2, $3, $4, $5, $6)", [message, author, categories, cat_name, type, link])
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

  insertFeedback: function (message, author, categories, cat_name, contacts) {
    let answer = null;
    return new Promise((resolve, reject) =>{
      categories.unshift(0);
      db_temp.none("INSERT INTO voice.feedback (text, author, type_id, type_name, contacts) VALUES ($1, $2, $3, $4, $5)", [message, author, categories, cat_name, contacts])
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

    //TODO : Implement protection against posting a comment in non-visible post (type <>1)
      insertComment: function (text, parent_message, author) {
        let answer = null;
        console.log("Comment data for insertion: ", text, " - ", parent_message, " - ", author);
        const insert_comment = new pgp_ps_moderate('insert-comment', 'INSERT INTO voice.comments (text, author, parent_message) VALUES ($1, $2, $3)');
        return new Promise((resolve, reject) =>{
          db_temp.none(insert_comment, [text, author, parent_message])
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


    /*
    @param category - optional paramentr for coosing category
    @param order - sorting order (time)
     */
    retrievePublicMessages: function (category=0, order=0, offset=0, status=0){
        const limit = 10;
        let query = {
            mod_st: false,
            arch_st: false,
            del_st: false
        };
        switch (status) {
          case 0:
              break;
          case 1:
              query.mod_st = true;
              break;
          case 2:
              query.mod_st = true;
              query.arch_st = true;
              break;
          default:
              query.mod_st = false;
              query.arch_st = false;
              query.del_st = false;
        }
        console.log(query);
        const ret_public_messages = new pgp_ps_moderate("retrieve-public-messages", "SELECT pm.id, pm.type, pm.text, pm.author, pm.moderation, pm.archive_status, pm.categories, pm.timestamp, pm.cat_name, pm.edit_status, pm.original_text, pm.title, SUM(case when ps.approval_state = true then 1 else 0 end) as app_number_true, SUM(case when ps.approval_state = false then 1 else 0 end) as app_number_false, array_agg(ps.admin_hash || ':' || ps.approval_state) as admin_activity FROM voice.public_messages AS pm LEFT JOIN voice.posts_statuses AS ps ON ps.post_id = pm.id WHERE moderation = $1 AND archive_status = $2 AND deletion_status = $3 AND send_status = false AND $4 = ANY(categories) GROUP BY pm.id ORDER BY pm.timestamp ASC LIMIT $5 OFFSET $6");
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            db_temp.any(ret_public_messages, [query.mod_st, query.arch_st, query.del_st, category, limit, offset])
                .then((data,err) => {
                    if (err) reject(err);
                    console.log(data);
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
                })
                .catch (error =>{
                    console.log('Nothing was find in moderate DB!');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                    reject(error);
                })
        })

    },

  /**
   *
   * @param id - id of the message
   * @param reason - reason for editing or archiving
   * @param status - new status of the message (0 - submition, 1- rejecting/archiving, 2 - renew)
   * @return {Promise.<T>}
   */
      logMessageModeration: function(id, reason, status) {
      const insert_message_log_status = new pgp_ps_moderate("insert-message-log-status", "INSERT INTO voice.trackable_posts (post_id, modification_reason, action_type) VALUES ($1, $2, $3)");
      return new Promise((resolve, reject) => {
        let answer = {};
        db_temp.none(insert_message_log_status,[id, reason, status])
            .then((data, err) => {
              if (err) reject(err);
              answer = {
                code: 1,
                data: 'message moderation logged'
              };
              resolve(answer);
        })
            .catch(error => {
              console.log(error);
              answer = {
                code: 0,
                data: 'message moderation logging error'
              };
              reject(error);
        })
      })
          .catch(error => {
            console.log('Promise error: ', error);
            let answer = {
              code: 0,
              data: 'message moderation logging error'
            };
            return answer
      })
    },

  /**
   *
   * @param id - id of the comment
   * @param reason - reason for editing or archiving
   * @param status - new status of the message (0 - submition, 1- rejecting/archiving, 2 - renew)
   * @return {Promise.<T>}
   */
    logCommentModeration: function(id, reason, status) {
      const insert_comment_log_status = new pgp_ps_moderate("insert-comment-log-status", "INSERT INTO voice.trackable_comments (comment_id, modification_reason, action_type) VALUES ($1, $2, $3)");
      return new Promise((resolve, reject) => {
        let answer = {};
        db_temp.none(insert_comment_log_status,[id, reason, status])
        .then((data, err) => {
          if (err) reject(err);
          answer = {
            code: 1,
            data: 'comment moderation logged'
          };
          resolve(answer);
        })
        .catch(error => {
          console.log(error);
          answer = {
            code: 0,
            data: 'comment moderation logging error'
          };
          reject(error);
        })
      })
      .catch(error => {
        console.log('Promise error: ', error);
        let answer = {
          code: 0,
          data: 'comment moderation logging error'
        };
        return answer
      })
    },

    updateMessageStatus: function (id, status, reason){
      let query = {
        mod_st: false,
        arch_st: false,
        del_st: false
      };

      switch (status) {
        case 0:
          //make it ready for submission
          query.mod_st = true;
          query.arch_st = false;
          query.del_st = false;
          break;
        case 1:
          //make it ready for archiving
          query.mod_st = true;
          query.arch_st = true;
          query.del_st = false;
          break;
        case 2:
          //revert it back to new
          query.mod_st = false;
          query.arch_st = false;
          query.del_st = false;
          break;
        default:
          query.mod_st = true;
          query.arch_st = false;
          query.del_st = false;
      }


        const update_messages_status = new pgp_ps_moderate("update-messages-status", "UPDATE voice.public_messages SET moderation=$1, archive_status=$2, deletion_status=$3 WHERE id=$4");
        return new Promise((resolve, reject) =>{
            let answer ={};
            console.log("I'm about to insert data: ", id, status, reason);
            db_temp.none(update_messages_status, [query.mod_st, query.arch_st, query.del_st, id])
            .then((data, err) => {
              if (err) reject(err);
              answer = {
                "code": 1,
                "data": "Message status updated successfully",
              };
              resolve(answer);
            })
            .catch (error =>{
              console.log('Error while updating message status!');
              answer = {"code": 0, "data": error['message']};
              console.log(error);
              resolve(answer);
              reject(error);
            })
        })

    },

  /**
   * @param id - message id
   * @param status - desired status of the message (ready for submission  - 0, ready for archiving - 1, back to new - 2)
   * @param reason - additional reason for deletion or editing of the message
   * @param admin_hash - hash of the admin email for logging admin actions
   * @param type - type of the action (if true - ready for submission status, false - message should be rejected by belief of this admin)
   */
  updateMessageStatusRemote: function (id, status, reason, admin_hash, type){
    //console.log('Data: ', id, status, reason, admin_hash);
    let answer ={};
    let message = "You approved this";
    let action_flag = false;
    let limit = config.get("minimal_mod_votes");
    console.log('Status is ', status);
    const update_posts_statuses = new pgp_ps_moderate("update-messages-statuses","INSERT INTO voice.posts_statuses (post_id, approval_state, admin_hash) VALUES ($1, $2, $3)");
    const delete_prev_post_statuses = new pgp_ps_moderate("delete-prev-posts-statuses", "DELETE FROM voice.posts_statuses WHERE post_id = $1 AND admin_hash = $2");
    const check_statuses_count = new pgp_ps_moderate("check-statuses-count", "SELECT posts_statuses.post_id, SUM(case when posts_statuses.approval_state = true then 1 else 0 end) as app_number_true, SUM(case when posts_statuses.approval_state = false then 1 else 0 end) as app_number_false FROM voice.posts_statuses WHERE post_id = $1 GROUP BY posts_statuses.post_id");
    if (!type){
      message = "You rejected this"
    }
    return new Promise((resolve, reject) => {
      db_temp.tx(t => {
        if (status === 2){
          const q1 = t.none(delete_prev_post_statuses, [id, admin_hash]);
          const q3 = t.any(check_statuses_count, [id]);
          console.log('Just renew it ! ');
          return t.batch([q1, q3]);
        } else {
          const q1 = t.none(delete_prev_post_statuses, [id, admin_hash]);
          const q2 = t.none(update_posts_statuses, [id, type, admin_hash]);
          const q3 = t.any(check_statuses_count, [id]);
          console.log('Update it ! ');
          return t.batch([q1, q2, q3]);
        }
      }).then((data, err) => {
        //actual function that get called in order to move message from one status to another (this.updateMessageStatus)
        if (err) reject(err);
        //res[0].app_number_false - count of overall votes from moderators for and agains this message
        let res = data[data.length-1];
        console.log(res);
        if (((status !== 2 && parseInt(res[0].app_number_true) === limit && parseInt(res[0].app_number_false) === 0)) || ((status !== 2 && parseInt(res[0].app_number_false) === limit && parseInt(res[0].app_number_true) === 0))) {
          action_flag = true;
          this.updateMessageStatus(id, status, reason);
        } else if (status === 2){
          action_flag = true;
          this.updateMessageStatus(id, status, reason);
        }
        answer = {
          "code": 1,
          "data": res,
          "message": message,
          "flag": action_flag
        };
        resolve(answer);
        this.logMessageModeration(id, reason, status)
        .then((data, err) => {
          if (err) console.log(err);
          console.log(data);
        })
        .catch(error => {
          console.log(error);
        })
      }).catch(error => {
        console.log('Error while updating message status for this admin!');
        answer = {"code": 0, "data": error['message']};
        console.log(error);
        resolve(answer);
        reject(error);
      })
    })

  },

  /**
   * @param id - comment id
   * @param status - desired status of comment (ready for submission  - 0, ready for archiving - 1, back to new - 2)
   * @param reason - additional reason for deletion or editing of the comment
   * @param admin_hash - hash of the admin email for logging admin actions
   * @param type - type of the action (if true - ready for submission status, false - comment should be rejected by belief of this admin)
   */
  updateCommentStatusRemote: function (id, status, reason, admin_hash, type){
    //console.log('Data: ', id, status, reason, admin_hash);
    let answer ={};
    let message = "You approved this";
    let action_flag = false;
    let limit = config.get("minimal_mod_votes");
    console.log('Status is ', status);
    const update_comment_statuses = new pgp_ps_moderate("update-comment-statuses","INSERT INTO voice.comments_statuses (comment_id, approval_state, admin_hash) VALUES ($1, $2, $3)");
    const delete_prev_comment_statuses = new pgp_ps_moderate("delete-prev-comment-statuses", "DELETE FROM voice.comments_statuses WHERE comment_id = $1 AND admin_hash = $2");
    const check_comment_statuses_count = new pgp_ps_moderate("check-comment-statuses-count", "SELECT comments_statuses.comment_id, SUM(case when comments_statuses.approval_state = true then 1 else 0 end) as app_number_true, SUM(case when comments_statuses.approval_state = false then 1 else 0 end) as app_number_false FROM voice.comments_statuses WHERE comment_id = $1 GROUP BY comments_statuses.comment_id");
    if (!type){
      message = "You rejected this"
    }
    return new Promise((resolve, reject) => {
      db_temp.tx(t => {
        if (status === 2){
          const q1 = t.none(delete_prev_comment_statuses, [id, admin_hash]);
          const q3 = t.any(check_comment_statuses_count, [id]);
          console.log('Just renew it ! ');
          return t.batch([q1, q3]);
        } else {
          const q1 = t.none(delete_prev_comment_statuses, [id, admin_hash]);
          const q2 = t.none(update_comment_statuses, [id, type, admin_hash]);
          const q3 = t.any(check_comment_statuses_count, [id]);
          console.log('Update it ! ');
          return t.batch([q1, q2, q3]);
        }
      }).then((data, err) => {
        if (err) reject(err);
        let res = data[data.length-1];
        console.log(res);
        if (((status !== 2 && parseInt(res[0].app_number_true) === limit && parseInt(res[0].app_number_false) === 0)) || ((status !== 2 && parseInt(res[0].app_number_false) === limit && parseInt(res[0].app_number_true) === 0))) {
          action_flag = true;
          this.updateCommentStatus(id, status, reason);
        } else if (status === 2){
          action_flag = true;
          this.updateCommentStatus(id, status, reason);
        }
        answer = {
          "code": 1,
          "data": res,
          "message": message,
          "flag": action_flag
        };
        resolve(answer);
        this.logCommentModeration(id, reason, status)
        .then((data, err) => {
          if (err) console.log(err);
          console.log(data);
        })
        .catch(error => {
          console.log(error);
        })
      }).catch(error => {
        console.log('Error while updating message status for this admin!');
        answer = {"code": 0, "data": error['message']};
        console.log(error);
        resolve(answer);
        reject(error);
      })
    })

  },

  updateCommentStatus: function (id, status, reason){
    let query = {
      mod_st: false,
      arch_st: false,
      del_st: false
    };

    switch (status) {
      case 0:
        //make it ready for submission
        query.mod_st = true;
        query.arch_st = false;
        query.del_st = false;
        break;
      case 1:
        //make it ready for archiving
        query.mod_st = true;
        query.arch_st = true;
        query.del_st = false;
        break;
      case 2:
        //revert it back to new
        query.mod_st = false;
        query.arch_st = false;
        query.del_st = false;
        break;
      default:
        query.mod_st = true;
        query.arch_st = false;
        query.del_st = false;
    }


    const update_comment_status = new pgp_ps_moderate("update-comment-status", "UPDATE voice.comments SET moderation=$1, archive_status=$2, deletion_status=$3 WHERE id=$4");
    return new Promise((resolve, reject) =>{
      let answer ={};
      db_temp.none(update_comment_status, [query.mod_st, query.arch_st, query.del_st, id])
      .then((data, err) => {
        if (err) reject(err);
        answer = {
          "code": 1,
          "data": "Comment status updated successfully",
        };
        resolve(answer);
      })
      .catch (error =>{
        console.log('Error while updating comment status!');
        answer = {"code": 0, "data": error['message']};
        console.log(error);
        resolve(answer);
        reject(error);
      })
    })

  },

    updateTempMessage: function (id, data, old_text, reason){
        const save_original_message = new pgp_ps_moderate ("save-original-message","UPDATE voice.public_messages SET original_text=$1 WHERE id=$2 AND edit_status=false AND archive_status = false AND deletion_status = false");
        const update_messages = new pgp_ps_moderate("update-messages", "UPDATE voice.public_messages SET text=$1, edit_status = true WHERE id=$2 AND moderation=false AND archive_status = false AND deletion_status = false");
        const insert_message_log_update = new pgp_ps_moderate("insert-message-log-update", "INSERT INTO voice.trackable_posts (text_before, text_after, post_id, modification_reason, action_type) VALUES ($1, $2, $3, $4, $5)");
        return new Promise((resolve, reject) =>{
            let answer ={};

            db_temp.tx( t=> {
              const q0 = t.none(save_original_message, [old_text,id]);
              const q1 = t.none(update_messages, [data, id]);
              const q2 = t.none(insert_message_log_update,[old_text, data, id, reason, 0]);
              return t.batch([q0, q1, q2]); // all of the queries are to be resolved;
            })
            .then((data, err) => {
              if (err) reject(err);
              answer = {
                "code": 1,
                "data": "Message updated successfully",
              };
              resolve(answer);
            })
            .catch (error =>{
              console.log('Error while updating message!');
              answer = {"code": 0, "data": error['message']};
              console.log(error);
              resolve(answer);
              reject(error);
            })


            /*db_temp.none(update_messages, [data, id])
                .then((data,err) => {
                    if (err) reject(err);
                    answer = {
                        "code": 1,
                        "data": "Message updated successfully",
                    };
                    resolve(answer);
                })
                .catch (error =>{
                    console.log('Error while updating status!');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                    reject(error);
                }) */
        })

    },

  updateTempComment: function (id, data, old_text, reason){
    const save_original_comment = new pgp_ps_moderate ("save-original-comment","UPDATE voice.comments SET original_text=$1 WHERE id=$2 AND edit_status=false AND archive_status = false AND deletion_status = false");
    const update_comments = new pgp_ps_moderate("update-comments", "UPDATE voice.comments SET text=$1, edit_status = true WHERE id=$2 AND moderation=false AND archive_status = false AND deletion_status = false");
    const insert_comment_log_update = new pgp_ps_moderate("insert-comment-log-update", "INSERT INTO voice.trackable_comments (text_before, text_after, comment_id, modification_reason, action_type) VALUES ($1, $2, $3, $4, $5)");
    return new Promise((resolve, reject) =>{
      let answer ={};

      db_temp.tx( t=> {
        const q0 = t.none(save_original_comment, [old_text,id]);
        const q1 = t.none(update_comments, [data, id]);
        const q2 = t.none(insert_comment_log_update,[old_text, data, id, reason, 0]);
        return t.batch([q0, q1, q2]); // all of the queries are to be resolved;
      })
      .then((data, err) => {
        if (err) reject(err);
        answer = {
          "code": 1,
          "data": "Comment updated successfully",
        };
        resolve(answer);
      })
      .catch (error =>{
        console.log('Error while updating comment!');
        answer = {"code": 0, "data": error['message']};
        console.log(error);
        resolve(answer);
        reject(error);
      })


    })

  },

        retrieveOnePublicMessage: function (id){
        console.log ("This is id: ", id);
        const ret_one_public_message = new pgp_ps("retrieve-one-public-message", "SELECT * FROM voice.public_messages WHERE id = $1");
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            db_temp.any(ret_one_public_message, [id])
                .then((data,err) => {
                    if (err) reject(err);
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
                    console.log(error);
                    resolve(answer);
                })
        })

    },

    /**
     * @param id - message id
     * @param order - sorting order (time)
     * @param offset - ofsset from the first element of the table
     * @param status - status of comment for retrieving (pending approval - 0, pending subbmition - 1, pending archiving - 2);
     */
    retrieveComments: function (order=0, offset=0, status=0){
        const limit = 10;
        let query = {
          mod_st: false,
          arch_st: false,
          del_st: false
        };
        switch (status) {
          case 0:
            break;
          case 1:
            query.mod_st = true;
            break;
          case 2:
            query.mod_st = true;
            query.arch_st = true;
            break;
          default:
            query.mod_st = false;
            query.arch_st = false;
            query.del_st = false;
        }
        console.log(query);
        const ret_message_comments = new pgp_ps_moderate("retrieve-comments", "SELECT c.id, c.type, c.text, c.author, c.createdtime, c.parent_message, c.parent_comment, c.moderation, c.archive_status, c.edit_status, c.original_text, SUM(case when cs.approval_state = true then 1 else 0 end) as app_number_true, SUM(case when cs.approval_state = false then 1 else 0 end) as app_number_false, array_agg(cs.admin_hash || ':' || cs.approval_state) as admin_activity FROM voice.comments AS c LEFT JOIN voice.comments_statuses AS cs ON cs.comment_id = c.id WHERE moderation = $1 AND archive_status = $2 AND deletion_status = $3 AND send_status = false GROUP BY c.id ORDER BY createdtime ASC LIMIT $4 OFFSET $5");
        //probably not really optimal
        //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
        return new Promise((resolve, reject) =>{
            let answer ={};
            db_temp.any(ret_message_comments, [query.mod_st, query.arch_st, query.del_st, limit, offset])
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
                    console.log('Nothing was find!');
                    answer = {"code": 0, "data": error['message']};
                    console.log(error);
                    resolve(answer);
                })
        })

    },

  retrieveMessageComments: function (id, order=0, offset=0){
    const limit = 30;
    const ret_message_comments = new pgp_ps_moderate("retrieve-message-comments", "SELECT * FROM voice.comments WHERE parent_message = $1 AND deletion_status = false ORDER BY createdtime DESC LIMIT $2 OFFSET $3");
    //probably not really optimal
    //const ret_pub_messages_count = new pgp_ps("retrieve-pub-mess-count", "");
    return new Promise((resolve, reject) =>{
      let answer ={};
      db_temp.any(ret_message_comments, [id, limit, offset])
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
        console.log('Nothing was find!');
        answer = {"code": 0, "data": error['message']};
        console.log(error);
        resolve(answer);
      })
    })

  }

};