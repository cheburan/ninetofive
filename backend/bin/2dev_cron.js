/**
 * Created by b0913178 on 22/06/2017.
 */
let config = require('config');
let CronJob = require('cron').CronJob;

/*
* CONNECTION TO PRIMARY DB
* */
let pgp = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});
let pgp_ps = require('pg-promise').PreparedStatement;
//establish connection
let pg_cn = config.get('Connector.pg_db');
const posts_time = config.get('Posting_Daemon.posts_time');
const comments_time = config.get('Posting_Daemon.comments_time');
let db = pgp(pg_cn);

/*
 * CONNECTION TO MODERATORS DB
 * */
let pgp_moderate = require('pg-promise')({
    /* initialization options */
    capSQL: true // capitalize all generated SQL
});
let pgp_ps_moderate = require('pg-promise').PreparedStatement;
//establish connection
let pg_cn_moderate = config.get('Connector.pg_db_moderate');
let db_temp = pgp_moderate(pg_cn_moderate);
console.log("Cron Jobs are activated! " + new Date());


//CronJob that will check temp db for approved by moderators messages and delete them after succesfull inserting into main DB
new CronJob('*/5 * * * * *', function() { //for dev: '*/10 * * * * *', for prod: '0 58 8,11,16 * * *'
    console.log('Starting messages cronJob at' + new Date());
    let ids = [];
    //ColumnSet for pgp Helper
    //const cs = new pgp.helpers.ColumnSet(['type', 'text', 'author', 'categories', 'secure_link'], {table: 'voice.public_messages'});
    //query for retrieving messages for sending
    const ret_public_messages = new pgp_ps_moderate("cron_retrieve-public-messages", "SELECT id, type, text, author, categories, secure_link, cat_name, edit_status FROM voice.public_messages WHERE moderation = true AND archive_status = false AND send_status = false AND time_to_send < now()");
        db_temp.any(ret_public_messages)
            .then((data,err) => {
                if (err) reject(err);
                if (data.length>0){
                    data.forEach(item => {
                        ids.push(item.id);
                        //delete item.id;
                    });
                    console.log(data);
                    console.log(ids);
                    console.log('About to construct query');
                    let table = new pgp.helpers.TableName('public_messages', 'voice');
                    const query = pgp.helpers.insert(data, ['id', 'type', 'text', 'author', 'categories', 'secure_link', 'cat_name', 'edit_status'], table);
                    console.log('Successfully constructed query: \n' + query);
                    db.none(query)
                        .then( function(data){
                            console.log('inserted in main DB');
                            //FOR NOW I"M NOT DELETING DATA FROM THE TEMP BD
                              db_temp.tx(t => {
                                // creating a sequence of transaction queries:
                                const m_q1 = t.none('UPDATE voice.public_messages SET send_status = true WHERE id IN ($1:csv) AND moderation = true', [ids]);
                                const m_q2 = t.none('DELETE FROM voice.public_messages WHERE archive_status = true');

                                // returning a promise that determines a successful transaction:
                                return t.batch([m_q1, m_q2]); // all of the queries are to be resolved;
                              })
                                .then(function(){
                                    console.log('Updated messages in temp')
                                })
                                .catch(err0 => {
                                    console.log(err0)
                                })
                        })
                        .catch(err=>{
                            console.log(err);
                        })
                } else {
                    console.log("No new messages for inserting yet");

                    //delete commets from temp DB if they marked as commets for deletion
                    db_temp.none('DELETE FROM voice.public_messages WHERE archive_status = true')
                      .then(function() {
                        console.log('check for messages for deletion without inserting new messages')
                      })
                      .catch(err=>{
                        console.log(err);
                      });
                }


            })
            .catch (error =>{
                console.log('Nothing was find in moderate DB!');
                console.log(error);
            })


}, null, true);

//CronJob that will check temp db for approved by moderators comments and delete them after succesfull inserting into main DB
new CronJob('*/3 * * * * *', function() { //for dev: '*/13 * * * * *'  for prod: '0 0 9,12,17 * * *'
  let dat = new Date();
  console.log('Starting comments cronJob at' + dat);
  let ids = [];
  let message_ids = [];
  //ColumnSet for pgp Helper
  //const cs = new pgp.helpers.ColumnSet(['type', 'text', 'author', 'categories', 'secure_link'], {table: 'voice.public_messages'});
  //query for retrieving messages for sending
  const ret_comments = new pgp_ps_moderate("cron_retrieve-comments", "SELECT id, text, author, parent_message, parent_comment, edit_status FROM voice.comments WHERE moderation = true AND archive_status = false AND send_status = false AND time_to_send < now()");
  db_temp.any(ret_comments)
  .then((data,err) => {
    if (err) reject(err);
    if (data.length>0){
      data.forEach(item => {
        ids.push(item.id);
        message_ids.push(item.parent_message)
        //delete item.id;
      });
      //console.log(data);
      //console.log(ids);
      console.log(message_ids);
      console.log('About to construct query');
      let table = new pgp.helpers.TableName('comments', 'voice');
      const query = pgp.helpers.insert(data, ['id', 'text', 'author', 'parent_message', 'parent_comment', 'edit_status'], table);
      console.log('Successfully constructed query: \n' + query);
      db.tx(p=> {
        //creating sequence of transaction queries for inserting new comments into DB and update flgs and mod_time in public_messages
        const insert_comments = p.none(query);
        const update_m_back = p.none("UPDATE voice.public_messages SET new_comments = false WHERE new_comments = true AND mod_time < (CURRENT_TIMESTAMP - interval '24 hour')");
        const update_m_fields = p.none('UPDATE voice.public_messages SET new_comments = true, mod_time = $1 WHERE id IN ($2:csv)', [dat, message_ids]);

        return p.batch([insert_comments, update_m_back, update_m_fields]);
      })
      //db.none(query)
      .then( function(data){
        console.log('inserted in main DB');
        //FOR NOW I"M NOT DELETING DATA FROM THE TEMP BD
        db_temp.tx(t => {
          // creating a sequence of transaction queries:
          const c_q1 = t.none('UPDATE voice.comments SET send_status = true WHERE id IN ($1:csv) AND moderation = true', [ids]);
          const c_q2 = t.none('DELETE FROM voice.public_messages WHERE archive_status = true');

          // returning a promise that determines a successful transaction:
          return t.batch([c_q1, c_q2]); // all of the queries are to be resolved;
        })
        .then(function(){
          console.log('Updated comments in temp')
        })
        .catch(err0 => {
          console.log(err0)
        })
      })
      .catch(err=>{
        console.log(err);
      })
    } else {
      console.log("No new comments for inserting yet");

      //Switch off flag for new comets if modification ime was more than 24 hours ago
      db.none("UPDATE voice.public_messages SET new_comments = false WHERE new_comments = true AND mod_time < (CURRENT_TIMESTAMP - interval '24 hour')")
          .then(function() {
            console.log('check for comments for switching off flag without inserting new comments')
      })
          .catch(err=>{
            console.log(err);
      });

      //delete commets from temp DB if they marked as commets for deletion
      db_temp.none('DELETE FROM voice.comments WHERE archive_status = true')
          .then(function() {
            console.log('check for comments for deletion without inserting new comments')
          })
          .catch(err=>{
            console.log(err);
          });

    }


  })
  .catch (error =>{
    console.log('Nothing was find in moderate DB!');
    console.log(error);
  })


}, null, true);