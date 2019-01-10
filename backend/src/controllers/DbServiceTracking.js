"use strict";

let config = require('config');

//options object for pg-promise
let options = {

};

let pgp = require('pg-promise')();
let pgp_ps = require('pg-promise').PreparedStatement;

//establish connection
let pg_cn = config.get('Connector.pg_db_tracking');
let db = pgp(pg_cn);
let validator = require('validator');

module.exports = {

  /**
   *
   * @param action - type of the actions that was done
   * @param class_position - classification of the position/title of the user within the organisation (generilized)
   * @param class_gender - user's gender [optional]
   * @param options
   */
  insertTrackingData: (action, class_position='unclassified', class_gender='unidentified', options={}) => {
    // if (typeof class_position ==="undefined" || typeof class_gender === "undefined"){
    //   class_position = 'unclassified';
    //   class_gender = 'unclassified';
    // }
    try{
      action = validator.escape(validator.blacklist(action, '$<>'));
      class_position = validator.escape(validator.blacklist(class_position, '$<>'));
      class_gender = validator.escape(validator.blacklist(class_gender, '$<>'));
      const create_tracking_record = new pgp_ps("create-tracking-record", "INSERT INTO voice.tracking (action, class_position, class_gender, options) VALUES($1, $2, $3, $4::json)");
      db.none(create_tracking_record, [action, class_position, class_gender, options])
      .then((data, err) => {
        if (err) console.log("This is insertion error: ", err);
        console.log("Tracking data has been inserted successfully");
      })
      .catch(error => {
        console.log(error);
      })
    }
    catch(err) {
      console.log("This is error while inserting tracking data", err);
    }
  },

  updateData: (hash, uuid) => {
    let answer = {};
    if (validator.isAlphanumeric(hash)){
      hash = validator.escape(hash);
      const update_tracking_uuid = new pgp_ps("update-tracking-uuid", "UPDATE voice.tracking_user_classification SET uuid = $1 WHERE hash = $2 RETURNING class_position, class_gender");
      return new Promise((resolve, reject) => {
        db.one(update_tracking_uuid, [uuid, hash])
            .then((data, err) => {
              if (err || !data || data.length === 0) {
                answer = {
                  code: 0,
                  data: "Error while executing query"
                };
                reject(err);
              } else{
                answer = {
                  code: 1,
                  data: data
                };
              }
                resolve(answer)
        })
            .catch(err2 => {
              answer = {
                code: 0,
                data: "Error while executing query"
              };
              reject(err2);
        })
      })
          .catch(error => {
            console.log(error);
            answer = {
              code: 0,
              data: "Error while executing query"
            };
            return answer;
            //reject(error);
      })
    } else {
      answer = {
        code: 0,
        data: "No valid user presented"
      };
      return (answer);
    }
  },

  retrieveClassificationDataByUuid: (uuid) => {
    let answer = {};
    uuid = validator.escape(uuid);
    const retrieve_data_by_uid = new pgp_ps("retrieve-data-by-uid", "SELECT class_position, class_gender FROM voice.tracking_user_classification WHERE uuid = $1 LIMIT 1");
    return new Promise((resolve, reject) => {
      db.one(retrieve_data_by_uid, [uuid])
          .then((data, err)=> {
            if (err) reject(err);
            answer = {
              code: 1,
              data: data
            };
            console.log(data);
            resolve(answer);
      })
          .catch(error => {
            console.log(error);
            reject(error);
      })
    })
        .catch(error => {
          console.log("promise error: ", error);
          reject(error);
    })
  },

  /**
   * RETRIEVE FROM LOGS all available logged action types in DB
   */
  retrieveActionTypes: ()=> {
    let answer = {};
    const retrieve_action_tracking_list = new pgp_ps("retrieve-action-tracking-list", "SELECT action,COUNT(*) as count FROM voice.tracking GROUP BY action ORDER BY count DESC");
    return new Promise((resolve, reject) => {
      db.any(retrieve_action_tracking_list)
      .then((data, err)=> {
        if (err) reject(err);
        answer = {
          code: 1,
          data: data
        };
        console.log(data);
        resolve(answer);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    })
    .catch(error => {
      console.log("promise error when try to retrieve actions list from tracking: ", error);
      reject(error);
    })
  },

  /**
   * RETRIEVE FROM LOGS all available logged user classification types
   */
  retrieveUsersClassificationTypes: ()=> {
    let answer = {};
    const retrieve_users_classification_tracking_list = new pgp_ps("retrieve-users-classification-tracking-list", "SELECT class_position,COUNT(*) as count FROM voice.tracking_user_classification GROUP BY class_position ORDER BY count DESC");
    return new Promise((resolve, reject) => {
      db.any(retrieve_users_classification_tracking_list)
      .then((data, err)=> {
        if (err) reject(err);
        answer = {
          code: 1,
          data: data
        };
        console.log(data);
        resolve(answer);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    })
    .catch(error => {
      console.log("promise error when try to retrieve users classification list from tracking DB: ", error);
      reject(error);
    })
  },

  /**
   * RETRIEVE FROM LOGS actions performed by users
   */
  retrieveActions: (action='%', offset=0) => {
    let answer = {};
    let limit = 100;
    const retrieve_actions = new pgp_ps("retrieve-actions", "SELECT action, class_position, to_char(timestamp, 'HH24-DD/MM/YYYY') as timestamp FROM voice.tracking WHERE action LIKE $1 LIMIT $2 OFFSET $3;");
    return new Promise((resolve, reject) => {
      db.result(retrieve_actions, [action, limit, offset])
      .then((data, err)=> {
        if (err) reject(err);
        answer = {
          code: 1,
          limit: limit,
          rowsCount: data.rowCount,
          offset: offset,
          data: data.rows
        };
        console.log(data);
        resolve(answer);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    })
    .catch(error => {
      console.log("promise error when try to retrieve actions list from tracking: ", error);
      return(error);
    })
  },

  /**
   * RETRIEVE FROM LOGS views of specific thread group by user classification
   */
  retrieveViewsOfTheThread: (thread_id=1) => {
    let answer = {};
    const retrieve_views = new pgp_ps("retrieve-views", "SELECT DISTINCT class_position, COUNT(*) FROM voice.tracking WHERE action = 'accessed post page' AND options->'data'->>'post_id' = $1 GROUP BY class_position");
    return new Promise((resolve, reject) => {
      db.result(retrieve_views, [thread_id])
      .then((data, err)=> {
        if (err) reject(err);
        answer = {
          code: 1,
          rowsCount: data.rowCount,
          thread_id: thread_id,
          data: data.rows
        };
        console.log(data);
        resolve(answer);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    })
    .catch(error => {
      console.log("promise error when try to retrieve views list from tracking: ", error);
      return(error);
    })
  },

  /**
   * RETRIEVE FROM LOGS amount of comments of specific thread group by user classification
   */
  retrieveAmountOfCommetsInTheThread: (thread_id=1) => {
    let answer = {};
    const retrieve_views = new pgp_ps("retrieve-views", "SELECT DISTINCT class_position, COUNT(*) FROM voice.tracking WHERE action = 'new comment posted' AND options->'data'->>'parent_message' = $1 GROUP BY class_position");
    return new Promise((resolve, reject) => {
      db.result(retrieve_views, [thread_id])
      .then((data, err)=> {
        if (err) reject(err);
        answer = {
          code: 1,
          rowsCount: data.rowCount,
          thread_id: thread_id,
          data: data.rows
        };
        console.log(data);
        resolve(answer);
      })
      .catch(error => {
        console.log(error);
        reject(error);
      })
    })
    .catch(error => {
      console.log("promise error when try to retrieve amount of commets list from tracking: ", error);
      return(error);
    })
  }
};